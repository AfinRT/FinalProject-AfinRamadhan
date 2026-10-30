import { db } from "../config/connection.js";
import { createPagination } from "../utils/pagination.js";
import { HttpError } from "../utils/HttpError.js";

// Tarif PPN 12% dan margin keuntungan 20% untuk menentukan harga jual obat.
const VAT_RATE = 0.12;
const MARKUP_RATE = 0.2;

// Hitung harga jual per unit berdasarkan total faktur, PPN 12%, dan margin keuntungan 20%.
function calculateSellingPrice(invoiceAmount, baseQuantity = 1) {
  const totalWithMarkup =
    Number(invoiceAmount) * (1 + VAT_RATE) * (1 + MARKUP_RATE);
  const quantity = Number(baseQuantity);

  const sellingPrice =
    quantity > 0 ? totalWithMarkup / quantity : totalWithMarkup;
  return Number(sellingPrice.toFixed(2));
}

// Hitung harga modal per unit dari total faktur dibagi jumlah unit yang diterima.
function calculateUnitCost(invoiceAmount, baseQuantity) {
  const amount = Number(invoiceAmount);
  const quantity = Number(baseQuantity);

  if (quantity <= 0) return amount;
  return Number((amount / quantity).toFixed(2));
}

// Format objek data produk agar memiliki struktur nilai default yang rapi dan konsisten.
export function formatProduct(row = {}) {
  const stock = Math.max(0, Number(row.stock) || 0);
  const activeBatchCount = Number(row.active_batch_count || 0);
  const criticalBatchCount = Number(row.critical_batch_count || 0);
  const salableStock =
    row.salable_stock !== undefined
      ? Math.max(0, Number(row.salable_stock) || 0)
      : activeBatchCount > 0
        ? stock
        : criticalBatchCount > 0
          ? 0
          : stock;

  return {
    id: row.id || null,
    name: row.name || "",
    barcode: row.barcode || "",
    unit: row.unit || "",
    purchase_price: row.purchase_price || 0,
    selling_price: row.selling_price || 0,
    stock,
    salable_stock: salableStock,
    min_stock: Math.max(0, Number(row.min_stock) || 0),
    category_id: row.category_id || null,
    supplier_id: row.supplier_id || null,
    invoice_number: row.invoice_number || null,
    invoice_date: row.invoice_date || null,
    exp_date: row.exp_date || null,
    active_batch_count: activeBatchCount,
    critical_batch_count: criticalBatchCount,
    critical_exp_date: row.critical_exp_date || null,
    has_active_batch: activeBatchCount > 0,
  };
}

// Cari data produk berdasarkan nama, barcode, kategori, supplier, atau pengurutan dengan paginasi.
export async function searchProducts(filters = {}) {
  const search = filters.name || "";
  const barcode = filters.barcode || "";
  const categoryId = filters.categoryId || "";
  const supplierId = filters.supplierId || "";
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;

  let query = `
    SELECT p.*, c.name AS category_name,
      (SELECT b.invoice_number FROM product_batches b WHERE b.product_id = p.id ORDER BY b.id DESC LIMIT 1) AS invoice_number,
      (SELECT DATE_FORMAT(b.invoice_date, '%Y-%m-%d') FROM product_batches b WHERE b.product_id = p.id ORDER BY b.id DESC LIMIT 1) AS invoice_date,
      COALESCE(
        (SELECT MIN(b.exp_date) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
        (SELECT MIN(b.exp_date) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0)
      ) AS exp_date,
      (SELECT MIN(b.exp_date) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS critical_exp_date,
      (SELECT COUNT(*) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS active_batch_count,
      (SELECT COUNT(*) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS critical_batch_count,
      COALESCE((SELECT SUM(b.quantity_remaining) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)), 0) AS salable_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE 1=1
  `;
  const queryParams = [];
  const countParams = [];
  let countQuery = `
    SELECT COUNT(*) AS total
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE 1=1
  `;

  // Filter pencarian berdasarkan nama obat atau barcode.
  if (search !== "") {
    query += " AND (p.name LIKE ? OR p.barcode LIKE ?)";
    queryParams.push(`%${search.toLowerCase()}%`, `%${search}%`);
    countQuery += " AND (p.name LIKE ? OR p.barcode LIKE ?)";
    countParams.push(`%${search.toLowerCase()}%`, `%${search}%`);
  }

  if (barcode !== "") {
    query += " AND p.barcode LIKE ?";
    queryParams.push(`%${barcode}%`);
    countQuery += " AND p.barcode LIKE ?";
    countParams.push(`%${barcode}%`);
  }

  // Filter pencarian berdasarkan ID kategori.
  if (categoryId !== "") {
    query += " AND p.category_id = ?";
    queryParams.push(Number(categoryId));
    countQuery += " AND p.category_id = ?";
    countParams.push(Number(categoryId));
  }

  // Filter pencarian berdasarkan ID supplier.
  if (supplierId !== "") {
    query += " AND p.supplier_id = ?";
    queryParams.push(Number(supplierId));
    countQuery += " AND p.supplier_id = ?";
    countParams.push(Number(supplierId));
  }

  // Pengurutan data produk secara dinamis: stok > 0 di atas, stok = 0 di paling bawah.
  query += (() => {
    const sortMap = {
      name: "p.name",
      barcode: "p.barcode",
      price: "p.selling_price",
      selling_price: "p.selling_price",
      purchase_price: "p.purchase_price",
      stock: "p.stock",
      min_stock: "p.min_stock",
      id: "p.id",
    };
    const stockPriority = "CASE WHEN p.stock > 0 THEN 0 ELSE 1 END ASC";
    if (filters.sort) {
      const [field, direction] = String(filters.sort).split(":");
      const col = sortMap[field?.toLowerCase()?.trim()];
      const dir = direction?.toUpperCase()?.trim() === "DESC" ? "DESC" : "ASC";
      if (col) {
        return ` ORDER BY ${stockPriority}, ${col} ${dir}, p.name ASC`;
      }
    }
    return ` ORDER BY ${stockPriority}, p.name ASC`;
  })();

  // Hitung total produk untuk membuat metadata paginasi.
  const [[count]] = await db.execute(countQuery, countParams);
  const pagination = createPagination(page, pageSize, Number(count.total));

  query += " LIMIT ? OFFSET ?";
  queryParams.push(pageSize, pagination.offset);
  const [rows] = await db.execute(query, queryParams);
  if (rows.length === 0) return { items: [], pagination };

  const hasilAkhir = [];

  // Ambil daftar satuan penjualan tambahan (multi-unit) untuk setiap produk.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const product = formatProduct(row);

    const [unitRows] = await db.execute(
      `SELECT id, unit_name, base_quantity, is_base_unit 
       FROM product_units 
       WHERE is_sale_unit = 1 AND product_id = ?
       ORDER BY is_base_unit DESC`,
      [product.id],
    );

    const saleUnits = [];
    let punyaSatuanUtama = false;

    for (let j = 0; j < unitRows.length; j++) {
      const u = unitRows[j];

      if (
        u.is_base_unit ||
        u.unit_name.toLowerCase() === product.unit.toLowerCase()
      ) {
        punyaSatuanUtama = true;
      }

      saleUnits.push({
        id: u.id,
        unit_name: u.unit_name,
        base_quantity: Number(u.base_quantity),
        is_base_unit: Boolean(u.is_base_unit),
      });
    }

    if (!punyaSatuanUtama) {
      saleUnits.unshift({
        id: null,
        unit_name: product.unit || "unit",
        base_quantity: 1,
        is_base_unit: true,
      });
    }

    product.sale_units = saleUnits;
    hasilAkhir.push(product);
  }

  return { items: hasilAkhir, pagination };
}

// Ambil daftar batch obat yang mendekati kedaluwarsa (dalam 30 hari) atau sudah kedaluwarsa.
export async function getExpiringProductBatches({
  search = "",
  supplierId = "",
  page = 1,
  pageSize = 10,
} = {}) {
  let query = `
    SELECT b.id AS batch_id, p.id AS product_id, p.name AS product_name,
      p.barcode, p.unit, p.supplier_id, c.name AS category_name,
      b.exp_date, b.quantity_remaining,
      CASE
        WHEN b.exp_date < CURDATE() THEN 'Sudah kedaluwarsa'
        WHEN b.exp_date = CURDATE() THEN 'Kedaluwarsa hari ini'
        ELSE 'Mendekati kedaluwarsa'
      END AS status
    FROM product_batches b
    INNER JOIN products p ON p.id = b.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE b.quantity_remaining > 0
      AND b.exp_date IS NOT NULL
      AND b.exp_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  `;
  const params = [];
  let countQuery = `
    SELECT COUNT(*) AS total
    FROM product_batches b
    INNER JOIN products p ON p.id = b.product_id
    WHERE b.quantity_remaining > 0
      AND b.exp_date IS NOT NULL
      AND b.exp_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  `;
  const countParams = [];

  // Filter pencarian berdasarkan nama produk atau barcode.
  if (search) {
    query += " AND (p.name LIKE ? OR p.barcode LIKE ?)";
    params.push(`%${search.toLowerCase()}%`, `%${search}%`);
    countQuery += " AND (p.name LIKE ? OR p.barcode LIKE ?)";
    countParams.push(`%${search.toLowerCase()}%`, `%${search}%`);
  }

  // Filter berdasarkan supplier obat.
  if (supplierId) {
    query += " AND p.supplier_id = ?";
    params.push(Number(supplierId));
    countQuery += " AND p.supplier_id = ?";
    countParams.push(Number(supplierId));
  }

  query += " ORDER BY b.exp_date ASC, p.name ASC";

  // Hitung total batch obat kedaluwarsa untuk paginasi.
  const [[count]] = await db.execute(countQuery, countParams);
  const pagination = createPagination(page, pageSize, Number(count.total));

  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, pagination.offset);
  const [rows] = await db.execute(query, params);
  return { items: rows, pagination };
}

// Ambil daftar produk yang jumlah stoknya sudah mencapai atau di bawah batas minimum.
export async function getLowStockProducts({
  search = "",
  supplierId = "",
  page = 1,
  pageSize = 10,
} = {}) {
  let query = `
    SELECT MAX(id) AS id, name, barcode, supplier_id,
      MAX(unit) AS unit, MAX(category_id) AS category_id,
      MAX(purchase_price) AS purchase_price, MAX(selling_price) AS selling_price,
      SUM(stock) AS stock, MAX(min_stock) AS min_stock,
      COUNT(*) AS duplicate_count
    FROM products
    WHERE stock >= 0
  `;
  const params = [];
  let countQuery = `
    SELECT COUNT(*) AS total FROM (
      SELECT name, barcode, supplier_id
      FROM products
      WHERE stock >= 0
  `;
  const countParams = [];

  // Filter pencarian berdasarkan nama produk atau barcode.
  if (search) {
    query += " AND (name LIKE ? OR barcode LIKE ?)";
    params.push(`%${search.toLowerCase()}%`, `%${search}%`);
    countQuery += " AND (name LIKE ? OR barcode LIKE ?)";
    countParams.push(`%${search.toLowerCase()}%`, `%${search}%`);
  }

  // Filter berdasarkan supplier obat.
  if (supplierId) {
    query += " AND supplier_id = ?";
    params.push(Number(supplierId));
    countQuery += " AND supplier_id = ?";
    countParams.push(Number(supplierId));
  }

  query += `
    GROUP BY name, barcode, supplier_id
    HAVING SUM(stock) >= 0 AND SUM(stock) <= MAX(min_stock)
    ORDER BY SUM(stock) ASC, name ASC
  `;

  countQuery += `
      GROUP BY name, barcode, supplier_id
      HAVING SUM(stock) >= 0 AND SUM(stock) <= MAX(min_stock)
    ) AS low_stock_products
  `;

  // Hitung total produk stok menipis untuk membuat metadata paginasi.
  const [[count]] = await db.execute(countQuery, countParams);
  const pagination = createPagination(page, pageSize, Number(count.total));

  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, pagination.offset);
  const [rows] = await db.execute(query, params);

  const hasilFormat = [];
  for (let i = 0; i < rows.length; i++) {
    hasilFormat.push({
      ...formatProduct(rows[i]),
      duplicate_count: Number(rows[i].duplicate_count) || 1,
    });
  }
  return { items: hasilFormat, pagination };
}

// Cari data produk lengkap berdasarkan ID produk.
export async function findProductById(id) {
  const query = `
    SELECT p.*, c.name AS category_name,
      (SELECT b.invoice_number FROM product_batches b WHERE b.product_id = p.id ORDER BY b.id DESC LIMIT 1) AS invoice_number,
      (SELECT DATE_FORMAT(b.invoice_date, '%Y-%m-%d') FROM product_batches b WHERE b.product_id = p.id ORDER BY b.id DESC LIMIT 1) AS invoice_date,
      COALESCE(
        (SELECT MIN(b.exp_date) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
        (SELECT MIN(b.exp_date) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0)
      ) AS exp_date,
      (SELECT MIN(b.exp_date) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS critical_exp_date,
      (SELECT COUNT(*) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS active_batch_count,
      (SELECT COUNT(*) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS critical_batch_count,
      COALESCE((SELECT SUM(b.quantity_remaining) FROM product_batches b WHERE b.product_id = p.id AND b.quantity_remaining > 0 AND b.exp_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)), 0) AS salable_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = ?
  `;

  const [rows] = await db.execute(query, [id]);

  if (rows.length > 0) {
    return formatProduct(rows[0]);
  }
  return null;
}

// Simpan dan sinkronkan daftar satuan penjualan multi-unit untuk suatu produk.
async function saveProductSaleUnits(
  connection,
  productId,
  baseUnit,
  saleUnits = [],
) {
  const normalizedUnits = [
    { unit_name: baseUnit, base_quantity: 1, is_base_unit: true },
    ...saleUnits.map((unit) => ({
      unit_name: String(unit.unit_name).trim(),
      base_quantity: Number(unit.base_quantity),
      is_base_unit: false,
    })),
  ];

  const [existingUnits] = await connection.execute(
    `SELECT id, unit_name, base_quantity
     FROM product_units
     WHERE product_id = ?
     FOR UPDATE`,
    [productId],
  );
  await connection.execute(
    "UPDATE product_units SET is_sale_unit = 0 WHERE product_id = ?",
    [productId],
  );

  for (const unit of normalizedUnits) {
    const existingUnit = existingUnits.find(
      (candidate) =>
        String(candidate.unit_name).trim().toLowerCase() ===
          unit.unit_name.toLowerCase() &&
        Number(candidate.base_quantity) === unit.base_quantity,
    );

    if (existingUnit) {
      await connection.execute(
        "UPDATE product_units SET is_sale_unit = 1, is_base_unit = ? WHERE id = ?",
        [Number(unit.is_base_unit), existingUnit.id],
      );
    } else {
      await connection.execute(
        `INSERT INTO product_units (\n          product_id, unit_name, base_quantity,\n          is_base_unit, is_purchase_unit, is_sale_unit\n        ) VALUES (?, ?, ?, ?, 0, 1)`,
        [
          productId,
          unit.unit_name,
          unit.base_quantity,
          Number(unit.is_base_unit),
        ],
      );
    }
  }
}

// Tambah data produk obat baru ke database beserta batch awal dan satuan jualnya.
export async function createProduct(data) {
  const categoryId = data.category_id || data.categoryId || null;
  const supplierId = data.supplier_id || data.supplierId || null;
  const invoiceAmount = data.purchase_price || data.purchasePrice || 0;
  const minStock = data.min_stock || data.minStock || 0;
  const name = data.name || "";
  const barcode = data.barcode || "";
  const unit = data.unit || "";
  const initialStock = Number(data.stock || 0);

  // Hitung modal per unit dan harga jual berdasarkan total faktur dan stok awal.
  const unitPurchasePrice = calculateUnitCost(invoiceAmount, initialStock);
  const resolvedSellingPrice = calculateSellingPrice(
    invoiceAmount,
    initialStock,
  );

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Simpan data master produk ke tabel products.
    const [result] = await connection.execute(
      `INSERT INTO products (category_id, supplier_id, barcode, name, unit, purchase_price, selling_price, stock, min_stock) \n       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        categoryId,
        supplierId,
        barcode,
        name,
        unit,
        unitPurchasePrice,
        resolvedSellingPrice,
        initialStock,
        minStock,
      ],
    );
    const productId = result.insertId;

    // Simpan relasi satuan multi-unit produk.
    await saveProductSaleUnits(connection, productId, unit, data.sale_units);

    // Jika ada stok awal, catat sebagai batch obat pertama.
    let batchId = null;
    if (initialStock > 0) {
      const expDate = data.exp_date || null;
      const [batchResult] = await connection.execute(
        `INSERT INTO product_batches (\n          product_id, invoice_number, invoice_date, quantity_received,\n          quantity_remaining, unit_cost, exp_date\n        ) VALUES (?, ?, COALESCE(?, CURDATE()), ?, ?, ?, ?)`,
        [
          productId,
          data.invoice_number || null,
          data.invoice_date || null,
          initialStock,
          initialStock,
          unitPurchasePrice,
          expDate || "2030-12-31",
        ],
      );
      batchId = batchResult.insertId;
    }

    await connection.commit();
    connection.release();

    const product = await findProductById(productId);
    return product ? { ...product, batch_id: batchId } : null;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

// Perbarui data produk, kelola penambahan/pengurangan stok batch, dan sinkronkan satuan jual.
export async function updateProduct(id, data) {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [products] = await connection.execute(
      "SELECT stock FROM products WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!products[0]) {
      await connection.rollback();
      transactionStarted = false;
      return null;
    }

    const currentStock = Number(products[0].stock) || 0;
    const nextStock = Number(data.stock);
    const stockDifference = nextStock - currentStock;
    const invoiceAmount = Number(data.purchase_price) || 0;
    const unitCost = calculateUnitCost(invoiceAmount, nextStock);

    // Jika stok bertambah, perbarui batch terbaru atau buat batch baru.
    if (stockDifference > 0) {
      const [existingBatches] = await connection.execute(
        `SELECT id, quantity_received, quantity_remaining\n         FROM product_batches\n         WHERE product_id = ?\n         ORDER BY exp_date DESC, received_at DESC, id DESC\n         LIMIT 1\n         FOR UPDATE`,
        [id],
      );

      if (existingBatches.length > 0) {
        const targetBatch = existingBatches[0];
        await connection.execute(
          `UPDATE product_batches\n           SET quantity_received = quantity_received + ?,\n               quantity_remaining = quantity_remaining + ?,\n               unit_cost = ?,\n               invoice_number = COALESCE(?, invoice_number),\n               invoice_date = COALESCE(?, invoice_date),\n               exp_date = COALESCE(?, exp_date)\n           WHERE id = ?`,
          [
            stockDifference,
            stockDifference,
            unitCost,
            data.invoice_number || null,
            data.invoice_date || null,
            data.exp_date || null,
            targetBatch.id,
          ],
        );
      } else {
        // Jika produk sebelumnya belum memiliki batch sama sekali, buat batch awal.
        const [batchResult] = await connection.execute(
          `INSERT INTO product_batches (\n            product_id, invoice_number, invoice_date, quantity_received,\n            quantity_remaining, unit_cost, exp_date\n          ) VALUES (?, ?, COALESCE(?, CURDATE()), ?, ?, ?, ?)`,
          [
            id,
            data.invoice_number || null,
            data.invoice_date || null,
            stockDifference,
            stockDifference,
            unitCost,
            data.exp_date || "2030-12-31",
          ],
        );
      }
    } else if (stockDifference < 0) {
      // Jika stok berkurang, kurangi stok pada batch obat aktif.
      let quantityToRemove = Math.abs(stockDifference);
      const [batches] = await connection.execute(
        `SELECT id, quantity_remaining\n         FROM product_batches\n         WHERE product_id = ? AND quantity_remaining > 0\n         ORDER BY exp_date DESC, received_at DESC, id DESC\n         FOR UPDATE`,
        [id],
      );

      for (const batch of batches) {
        if (quantityToRemove === 0) break;
        const removed = Math.min(
          quantityToRemove,
          Number(batch.quantity_remaining),
        );
        await connection.execute(
          "UPDATE product_batches SET quantity_remaining = quantity_remaining - ? WHERE id = ?",
          [removed, batch.id],
        );
        quantityToRemove -= removed;
      }

      if (quantityToRemove > 0) {
        throw new HttpError(
          409,
          "Jumlah stok batch tidak cukup untuk mengurangi stok produk.",
        );
      }
    }

    // Jika stok tidak bertambah namun ada pembaruan tanggal kedaluwarsa atau nomor faktur.
    if (
      stockDifference <= 0 &&
      (data.exp_date ||
        data.invoice_number !== undefined ||
        data.invoice_date !== undefined)
    ) {
      const [latestBatch] = await connection.execute(
        `SELECT id FROM product_batches\n         WHERE product_id = ?\n         ORDER BY exp_date DESC, received_at DESC, id DESC\n         LIMIT 1`,
        [id],
      );
      if (latestBatch[0]) {
        await connection.execute(
          `UPDATE product_batches\n           SET exp_date = COALESCE(?, exp_date),\n               invoice_number = COALESCE(?, invoice_number),\n               invoice_date = COALESCE(?, invoice_date)\n           WHERE id = ?`,
          [
            data.exp_date || null,
            data.invoice_number || null,
            data.invoice_date || null,
            latestBatch[0].id,
          ],
        );
      }
    }

    // Perbarui data utama produk di tabel products.
    await connection.execute(
      `UPDATE products\n       SET category_id = ?, supplier_id = ?, barcode = ?, name = ?, unit = ?,\n           purchase_price = ?, selling_price = ?, stock = ?, min_stock = ?\n       WHERE id = ?`,
      [
        data.category_id,
        data.supplier_id,
        data.barcode,
        data.name,
        data.unit,
        unitCost,
        calculateSellingPrice(invoiceAmount, nextStock),
        nextStock,
        data.min_stock,
        id,
      ],
    );

    // Sinkronkan daftar multi-unit produk.
    await saveProductSaleUnits(connection, id, data.unit, data.sale_units);

    await connection.commit();
    transactionStarted = false;
    return findProductById(id);
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Catat penerimaan stok obat baru dari faktur pembelian (konversi boks ke satuan terkecil).
export async function receiveProductStock(id, data) {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [products] = await connection.execute(
      "SELECT id, stock FROM products WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!products[0]) {
      throw new HttpError(404, "Produk tidak ditemukan.");
    }

    const receivedQuantity =
      Number(data.box_quantity) * Number(data.conversion_factor);
    const invoiceAmount = Number(data.purchase_price);
    const unitCost = calculateUnitCost(invoiceAmount, receivedQuantity);
    const sellingPrice = calculateSellingPrice(invoiceAmount, receivedQuantity);

    // Buat batch penerimaan baru untuk obat ini.
    const [batchResult] = await connection.execute(
      `INSERT INTO product_batches (\n        product_id, invoice_number, invoice_date, quantity_received,\n        quantity_remaining, unit_cost, exp_date\n      ) VALUES (?, ?, COALESCE(?, CURDATE()), ?, ?, ?, ?)`,
      [
        id,
        data.invoice_number || null,
        data.invoice_date || null,
        receivedQuantity,
        receivedQuantity,
        unitCost,
        data.exp_date || "2030-12-31",
      ],
    );
    const batchId = batchResult.insertId;

    // Perbarui stok produk dan harga terbarunya.
    await connection.execute(
      `UPDATE products\n       SET stock = stock + ?, purchase_price = ?, selling_price = ?\n       WHERE id = ?`,
      [receivedQuantity, unitCost, sellingPrice, id],
    );

    await connection.commit();
    transactionStarted = false;
    const product = await findProductById(id);
    return product ? { ...product, batch_id: batchId } : null;
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Ambil daftar seluruh batch obat milik suatu produk terurut berdasarkan tanggal kedaluwarsa.
export async function getProductBatches(productId) {
  const query = `\n   SELECT id, product_id, invoice_number,\n      DATE_FORMAT(invoice_date, '%Y-%m-%d') AS invoice_date,\n      quantity_received, quantity_remaining, unit_cost,\n      DATE_FORMAT(exp_date, '%Y-%m-%d') AS exp_date,\n      received_at\n  FROM product_batches\n  WHERE product_id = ? \n    AND quantity_remaining > 0\n  ORDER BY exp_date ASC, id ASC\n\n  `;
  const [rows] = await db.execute(query, [productId]);
  return rows;
}

// Perbarui informasi batch obat (nomor faktur, tanggal kadaluwarsa, jumlah stok, dan modal faktur).
export async function updateProductBatch(batchId, data) {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [batches] = await connection.execute(
      "SELECT id, product_id, quantity_received, quantity_remaining, unit_cost, exp_date, invoice_number, invoice_date FROM product_batches WHERE id = ? FOR UPDATE",
      [batchId],
    );
    if (!batches[0]) {
      throw new HttpError(404, "Batch tidak ditemukan.");
    }

    const existing = batches[0];
    const oldQtyReceived = Number(existing.quantity_received) || 0;
    const newQtyReceived =
      data.quantity_received !== undefined
        ? Math.max(0, Number(data.quantity_received))
        : oldQtyReceived;
    const receivedDiff = newQtyReceived - oldQtyReceived;

    const oldQtyRemaining = Number(existing.quantity_remaining) || 0;
    // Gunakan quantity_remaining yang dikirim user jika ada, atau sesuaikan dengan selisih kuantitas diterima baru.
    const newQtyRemaining =
      data.quantity_remaining !== undefined
        ? Math.min(newQtyReceived, Math.max(0, Number(data.quantity_remaining)))
        : Math.max(0, oldQtyRemaining + receivedDiff);
    const diff = newQtyRemaining - oldQtyRemaining;

    const newInvoiceNumber =
      data.invoice_number !== undefined
        ? data.invoice_number
          ? String(data.invoice_number).trim()
          : null
        : existing.invoice_number;

    const newInvoiceDate =
      data.invoice_date !== undefined
        ? data.invoice_date
          ? String(data.invoice_date).trim()
          : null
        : existing.invoice_date;

    const newExpDate =
      data.exp_date !== undefined
        ? data.exp_date
          ? String(data.exp_date).trim()
          : null
        : existing.exp_date;

    const resolvedQty = newQtyReceived > 0 ? newQtyReceived : 1;
    // Nilai modal yang dimasukkan adalah total faktur batch, dibagi sesuai stok diterima.
    const invoiceAmount =
      data.unit_cost !== undefined
        ? Math.max(0, Number(data.unit_cost))
        : Number(existing.unit_cost) * oldQtyReceived;

    // Hitung modal per unit (total faktur / stok diterima).
    const newUnitCost = calculateUnitCost(invoiceAmount, resolvedQty);
    // Hitung harga jual per unit (total faktur + PPN + margin / stok diterima).
    const newSellingPrice = calculateSellingPrice(invoiceAmount, resolvedQty);

    // Perbarui data batch obat.
    await connection.execute(
      `UPDATE product_batches\n       SET invoice_number = ?,\n           invoice_date = ?,\n           quantity_received = ?,\n           quantity_remaining = ?,\n           exp_date = ?,\n           unit_cost = ?\n       WHERE id = ?`,
      [
        newInvoiceNumber,
        newInvoiceDate,
        newQtyReceived,
        newQtyRemaining,
        newExpDate,
        newUnitCost,
        batchId,
      ],
    );

    const isUnitCostEdited = data.unit_cost !== undefined;
    const isReceivedEdited =
      data.quantity_received !== undefined && receivedDiff !== 0;

    // Sinkronkan harga dan stok pada master produk jika ada perubahan modal atau kuantitas.
    if (isUnitCostEdited || isReceivedEdited || diff !== 0) {
      await connection.execute(
        `UPDATE products\n         SET purchase_price = ?,\n             selling_price = ?,\n             stock = GREATEST(0, stock + ?)\n         WHERE id = ?`,
        [newUnitCost, newSellingPrice, diff, existing.product_id],
      );
    }

    await connection.commit();
    transactionStarted = false;

    return {
      id: batchId,
      product_id: existing.product_id,
      invoice_number: newInvoiceNumber,
      invoice_date: newInvoiceDate,
      quantity_received: newQtyReceived,
      quantity_remaining: newQtyRemaining,
      exp_date: newExpDate,
      unit_cost: newUnitCost,
      purchase_price: newUnitCost,
      selling_price: newSellingPrice,
    };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Hapus data batch obat dan kurangi stok utama produk.
export async function deleteProductBatch(batchId) {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [batches] = await connection.execute(
      "SELECT id, product_id, quantity_remaining FROM product_batches WHERE id = ? FOR UPDATE",
      [batchId],
    );
    if (!batches[0]) {
      throw new HttpError(404, "Batch tidak ditemukan.");
    }

    const { product_id, quantity_remaining } = batches[0];
    const qtyToDeduct = Number(quantity_remaining) || 0;

    const [delResult] = await connection.execute(
      "DELETE FROM product_batches WHERE id = ?",
      [batchId],
    );

    // Kurangi stok produk jika batch yang dihapus masih memiliki sisa kuantitas.
    if (qtyToDeduct > 0) {
      await connection.execute(
        "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?",
        [qtyToDeduct, product_id],
      );
    }

    await connection.commit();
    transactionStarted = false;
    return delResult.affectedRows > 0;
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      throw new HttpError(
        409,
        "Batch ini tidak dapat dihapus karena sudah ada riwayat transaksi penjualan.",
      );
    }
    throw error;
  } finally {
    connection.release();
  }
}

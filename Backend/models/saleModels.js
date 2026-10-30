import { randomUUID } from "node:crypto";
import { db } from "../config/connection.js";
import { HttpError } from "../utils/HttpError.js";
import { createPagination } from "../utils/pagination.js";

// Ambil daftar transaksi penjualan dengan filter hak akses, tanggal, kasir, dan paginasi.
export async function getAllSales({
  userId,
  hasFullAccess,
  today,
  filters = {},
  page = 1,
  pageSize = 10,
}) {
  let query = `
    SELECT s.*, u.name AS cashier_name
    FROM sales s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE 1=1
  `;
  let countQuery = `
    SELECT COUNT(*) AS total
    FROM sales s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE 1=1
  `;
  const params = [];
  const countParams = [];

  // Kasir hanya bisa melihat transaksi miliknya sendiri pada hari ini.
  if (!hasFullAccess) {
    query +=
      " AND s.user_id = ? AND s.sale_date >= ? AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)";
    params.push(userId, today, today);
    countQuery +=
      " AND s.user_id = ? AND s.sale_date >= ? AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)";
    countParams.push(userId, today, today);
  }

  // Filter pencarian berdasarkan nomor invoice.
  if (filters.invoice) {
    query += " AND s.invoice_number LIKE ?";
    params.push(`%${filters.invoice}%`);
    countQuery += " AND s.invoice_number LIKE ?";
    countParams.push(`%${filters.invoice}%`);
  }

  // Filter pencarian berdasarkan nama produk yang dibeli.
  if (filters.product) {
    query += ` AND EXISTS (
      SELECT 1
      FROM sale_details sd
      INNER JOIN products p ON p.id = sd.product_id
      WHERE sd.sale_id = s.id AND p.name LIKE ?
    )`;
    params.push(`%${filters.product}%`);
    countQuery += ` AND EXISTS (
      SELECT 1
      FROM sale_details sd
      INNER JOIN products p ON p.id = sd.product_id
      WHERE sd.sale_id = s.id AND p.name LIKE ?
    )`;
    countParams.push(`%${filters.product}%`);
  }

  // Filter berdasarkan nama kasir (khusus admin).
  if (hasFullAccess && filters.cashier) {
    query += " AND u.name LIKE ?";
    params.push(`%${filters.cashier}%`);
    countQuery += " AND u.name LIKE ?";
    countParams.push(`%${filters.cashier}%`);
  }

  // Filter berdasarkan metode pembayaran.
  if (filters.paymentMethod) {
    query += " AND LOWER(s.payment_method) = ?";
    params.push(filters.paymentMethod.toLowerCase().trim());
    countQuery += " AND LOWER(s.payment_method) = ?";
    countParams.push(filters.paymentMethod.toLowerCase().trim());
  }

  // Filter berdasarkan rentang tanggal transaksi (khusus admin).
  if (hasFullAccess && filters.dateFrom && filters.dateTo) {
    query +=
      " AND s.sale_date >= ? AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)";
    params.push(filters.dateFrom, filters.dateTo);
    countQuery +=
      " AND s.sale_date >= ? AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)";
    countParams.push(filters.dateFrom, filters.dateTo);
  }

  query += " ORDER BY s.sale_date DESC, s.id DESC";

  // Hitung total transaksi untuk membuat metadata paginasi.
  const [[count]] = await db.execute(countQuery, countParams);
  const pagination = createPagination(page, pageSize, Number(count.total));

  // Ambil data transaksi penjualan sesuai halaman aktif (limit dan offset).
  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, pagination.offset);
  const [sales] = await db.execute(query, params);

  // Ambil jumlah item dan ringkasan nama produk pada tiap transaksi.
  for (let i = 0; i < sales.length; i++) {
    const sale = sales[i];

    const [details] = await db.execute(
      `SELECT COUNT(*) AS item_count, GROUP_CONCAT(p.name SEPARATOR ' ') AS product_names
       FROM sale_details sd
       INNER JOIN products p ON p.id = sd.product_id
       WHERE sd.sale_id = ?`,
      [sale.id],
    );

    sale.item_count = details[0].item_count || 0;
    sale.product_names = details[0].product_names || "";
  }

  return { items: sales, pagination };
}

// Analisis penjualan produk untuk mengukur tingkat kelarisan obat berdasarkan satuan dan jumlah terjual.
export async function getProductSalesAnalysis({
  dateFrom,
  dateTo,
  search = "",
  order = "DESC",
  page = 1,
  pageSize = 10,
} = {}) {
  let query = `
    SELECT 
        p.name AS product_name,
        p.barcode,
        MAX(p.unit) AS satuan_terkecil,
        MAX(c.name) AS category_name,
        supplier.id AS supplier_id,
        MAX(supplier.name) AS supplier_name,
        COALESCE(SUM(sd.quantity), 0) AS quantity_sold,
        CASE
            WHEN MAX(p.unit) IN ('Tablet', 'Kapsul') AND COALESCE(SUM(sd.quantity), 0) >= 150 THEN 'Laris'
            WHEN MAX(p.unit) = 'Strip'               AND COALESCE(SUM(sd.quantity), 0) >= 30  THEN 'Laris'
            WHEN MAX(p.unit) IN ('Botol', 'Tube')    AND COALESCE(SUM(sd.quantity), 0) >= 15  THEN 'Laris'
            WHEN MAX(p.unit) = 'Pcs'                 AND COALESCE(SUM(sd.quantity), 0) >= 20  THEN 'Laris'
            ELSE 'Tidak Laris'
        END AS popularity_status
    FROM sale_details sd
    INNER JOIN products p ON p.id = sd.product_id
    INNER JOIN sales s ON s.id = sd.sale_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN suppliers supplier ON supplier.id = p.supplier_id
  `;

  const params = [];
  const whereClauses = [];

  // Filter berdasarkan rentang tanggal penjualan.
  if (dateFrom && dateTo) {
    whereClauses.push(
      "s.sale_date >= ? AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)",
    );
    params.push(dateFrom, dateTo);
  }

  // Filter pencarian berdasarkan nama produk, barcode, kategori, atau nama supplier.
  if (search) {
    whereClauses.push(
      "(p.name LIKE ? OR p.barcode LIKE ? OR c.name LIKE ? OR supplier.name LIKE ?)",
    );
    params.push(
      `%${search.toLowerCase()}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    );
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  const direction = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";

  // Hitung total produk unik untuk metadata paginasi.
  let countQuery = `
    SELECT COUNT(*) AS total
    FROM (
      SELECT p.name, p.barcode, supplier.id
      FROM sale_details sd
      INNER JOIN products p ON p.id = sd.product_id
      INNER JOIN sales s ON s.id = sd.sale_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN suppliers supplier ON supplier.id = p.supplier_id
  `;
  if (whereClauses.length > 0) {
    countQuery += ` WHERE ${whereClauses.join(" AND ")}`;
  }
  countQuery += " GROUP BY p.name, p.barcode, supplier.id) AS analysis_products";
  const [[count]] = await db.execute(countQuery, params);
  const pagination = createPagination(page, pageSize, Number(count.total));

  // Ambil data analisis sesuai halaman aktif.
  query += `
    GROUP BY p.name, p.barcode, supplier.id
    ORDER BY quantity_sold ${direction}, p.name ASC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.execute(query, [
    ...params,
    pageSize,
    pagination.offset,
  ]);
  return {
    items: rows.map((row) => ({
      ...row,
      quantity_sold: Number(row.quantity_sold) || 0,
    })),
    pagination,
  };
}

// Cari detail lengkap transaksi penjualan beserta item dan rincian batch FEFO.
export async function findSaleById(saleId) {
  const [sales] = await db.execute(
    `SELECT s.*, u.name AS cashier_name
     FROM sales s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
    [saleId],
  );

  const sale = sales[0];
  if (!sale) return null;

  // Ambil item produk dalam transaksi penjualan.
  const [items] = await db.execute(
    `SELECT sd.id, sd.product_id, p.name AS product_name, sd.quantity,
            p.unit AS unit, sd.price, sd.discount, sd.subtotal
     FROM sale_details sd
     JOIN products p ON p.id = sd.product_id
     WHERE sd.sale_id = ?
     ORDER BY sd.id ASC`,
    [saleId],
  );

  // Ambil alokasi batch obat FEFO untuk setiap item produk.
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const [batches] = await db.execute(
      `SELECT batch_id, quantity, unit_cost 
       FROM sale_detail_batches 
       WHERE sale_detail_id = ?`,
      [item.id],
    );

    item.fefo_batches = batches;
  }

  sale.items = items;
  return sale;
}

// Pastikan akun pengguna aktif dan memiliki role yang sesuai.
async function assertActiveRole(connection, userId, roleName) {
  const [users] = await connection.execute(
    `SELECT u.id
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? AND u.status = 'active' AND LOWER(r.name) = ?
     FOR UPDATE`,
    [userId, roleName],
  );

  if (users.length === 0) {
    throw new HttpError(
      403,
      `Hanya akun aktif dengan role ${roleName} yang dapat melakukan operasi ini.`,
    );
  }
}

// Kembalikan stok batch dan produk saat transaksi penjualan dibatalkan/dihapus.
async function restoreSaleInventory(connection, saleId) {
  const [details] = await connection.execute(
    `SELECT sd.id AS sale_detail_id, sd.product_id, sd.quantity, sdb.batch_id, sdb.quantity AS allocated_quantity
     FROM sale_details sd
     LEFT JOIN sale_detail_batches sdb ON sdb.sale_detail_id = sd.id
     WHERE sd.sale_id = ?
     FOR UPDATE`,
    [saleId],
  );

  const allocatedByDetail = new Map();
  const quantityByProduct = new Map();

  for (const detail of details) {
    allocatedByDetail.set(
      detail.sale_detail_id,
      (allocatedByDetail.get(detail.sale_detail_id) ?? 0) +
        Number(detail.allocated_quantity ?? 0),
    );
    if (detail.batch_id !== null) {
      quantityByProduct.set(
        detail.product_id,
        (quantityByProduct.get(detail.product_id) ?? 0) +
          Number(detail.allocated_quantity),
      );
    }
  }

  // Pulihkan kuantitas batch yang terpotong.
  for (const detail of details) {
    if (
      allocatedByDetail.get(detail.sale_detail_id) !== Number(detail.quantity)
    ) {
      throw new HttpError(
        409,
        "Transaksi ini tidak memiliki alokasi batch lengkap dan tidak dapat dihapus.",
      );
    }
    if (detail.batch_id !== null) {
      await connection.execute(
        "UPDATE product_batches SET quantity_remaining = quantity_remaining + ? WHERE id = ?",
        [detail.allocated_quantity, detail.batch_id],
      );
    }
  }

  // Pulihkan total stok produk utama.
  for (const [productId, quantity] of quantityByProduct) {
    await connection.execute(
      "UPDATE products SET stock = stock + ? WHERE id = ?",
      [quantity, productId],
    );
  }
}

// Simpan transaksi penjualan baru dan potong stok batch sesuai metode FEFO.
export async function createSale(userId, sale) {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;
    await assertActiveRole(connection, userId, "kasir");

    const preparedItems = [];
    let subtotal = 0;

    // Validasi produk, konversi satuan multi-unit, dan hitung subtotal harga.
    for (const item of sale.items) {
      const [products] = await connection.execute(
        "SELECT id, name, unit, selling_price FROM products WHERE id = ? FOR UPDATE",
        [item.productId],
      );
      const product = products[0];
      if (!product) {
        throw new HttpError(404, `Produk ${item.productId} tidak ditemukan.`);
      }

      let baseQuantity = item.quantity;
      if (item.unitId !== null) {
        const [units] = await connection.execute(
          `SELECT base_quantity
           FROM product_units
           WHERE id = ? AND product_id = ? AND is_sale_unit = 1
           FOR UPDATE`,
          [item.unitId, item.productId],
        );
        if (!units[0]) {
          throw new HttpError(400, `Unit untuk ${product.name} tidak valid.`);
        }
        baseQuantity *= Number(units[0].base_quantity);
      }

      const price = Number(product.selling_price);
      const gross = price * baseQuantity;
      if (item.discount > gross) {
        throw new HttpError(
          400,
          `Diskon untuk ${product.name} melebihi subtotal item.`,
        );
      }

      const itemSubtotal = gross - item.discount;
      subtotal += itemSubtotal;
      preparedItems.push({
        ...item,
        quantity: baseQuantity,
        product,
        price,
        itemSubtotal,
      });
    }

    if (sale.discount > subtotal) {
      throw new HttpError(400, "Diskon transaksi melebihi subtotal penjualan.");
    }

    const grandTotal = subtotal - sale.discount;
    if (sale.paidAmount < grandTotal) {
      throw new HttpError(
        400,
        `Jumlah pembayaran kurang dari total penjualan. Total yang harus dibayar: ${new Intl.NumberFormat(
          "id-ID",
          { style: "currency", currency: "IDR", maximumFractionDigits: 2 },
        ).format(grandTotal)}.`,
      );
    }

    // Buat nomor invoice unik dengan tanggal hari ini.
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const today = `${year}-${month}-${day}`;
    const invoiceNumber = `INV-${year}${month}${day}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;
    const saleDate = `${today} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Simpan data utama penjualan ke tabel sales.
    const [saleResult] = await connection.execute(
      `INSERT INTO sales (
        invoice_number, user_id, sale_date, subtotal, discount,
        grand_total, paid_amount, change_amount, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        userId,
        saleDate,
        subtotal,
        sale.discount,
        grandTotal,
        sale.paidAmount,
        sale.paidAmount - grandTotal,
        sale.paymentMethod,
      ],
    );
    const saleId = saleResult.insertId;

    // Simpan rincian tiap item dan potong stok batch sesuai FEFO (kadaluwarsa terdekat).
    for (const item of preparedItems) {
      const [detailResult] = await connection.execute(
        `INSERT INTO sale_details (
          sale_id, product_id, quantity, price, discount, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          item.productId,
          item.quantity,
          item.price,
          item.discount,
          item.itemSubtotal,
        ],
      );
      let quantityRemaining = item.quantity;

      const [batches] = await connection.execute(
        `SELECT id, quantity_remaining, unit_cost
         FROM product_batches
         WHERE product_id = ?
           AND quantity_remaining > 0
           AND exp_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY)
         ORDER BY exp_date ASC, received_at ASC, id ASC
         FOR UPDATE`,
        [item.productId],
      );

      for (const batch of batches) {
        if (quantityRemaining === 0) break;
        const allocatedQuantity = Math.min(
          quantityRemaining,
          Number(batch.quantity_remaining),
        );
        await connection.execute(
          "UPDATE product_batches SET quantity_remaining = quantity_remaining - ? WHERE id = ?",
          [allocatedQuantity, batch.id],
        );
        await connection.execute(
          `INSERT INTO sale_detail_batches (
            sale_detail_id, batch_id, quantity, unit_cost
          ) VALUES (?, ?, ?, ?)`,
          [detailResult.insertId, batch.id, allocatedQuantity, batch.unit_cost],
        );
        quantityRemaining -= allocatedQuantity;
      }

      if (quantityRemaining > 0) {
        throw new HttpError(
          409,
          `Stok batch ${item.product.name} tidak mencukupi atau sudah kedaluwarsa.`,
        );
      }

      // Potong stok utama produk.
      await connection.execute(
        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [item.quantity, item.productId, item.quantity],
      );
    }

    await connection.commit();
    transactionStarted = false;
    return { id: saleId };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Hapus transaksi penjualan dan kembalikan stok batch produk (khusus role admin).
export async function deleteSale(saleId, userId) {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;
    await assertActiveRole(connection, userId, "admin");

    const [sales] = await connection.execute(
      "SELECT id FROM sales WHERE id = ? FOR UPDATE",
      [saleId],
    );
    if (!sales[0]) throw new HttpError(404, "Data penjualan tidak ditemukan.");

    await restoreSaleInventory(connection, saleId);
    await connection.execute("DELETE FROM sales WHERE id = ?", [saleId]);
    await connection.commit();
    transactionStarted = false;
    return { id: saleId };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

import { db } from "../config/connection.js";
import { createPagination } from "../utils/pagination.js";

// Ambil semua data supplier dengan pencarian dan paginasi.
export async function getAllSuppliers({
  search = "",
  page = 1,
  pageSize = 10,
} = {}) {
  let query = "SELECT * FROM suppliers";
  let countQuery = "SELECT COUNT(*) AS total FROM suppliers";
  const params = [];
  const countParams = [];

  // Filter pencarian berdasarkan nama, nomor telepon, email, atau alamat.
  if (search) {
    query += " WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR address LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    countQuery += " WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR address LIKE ?";
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += " ORDER BY name ASC";

  // Hitung total supplier untuk membuat metadata paginasi.
  const [[count]] = await db.execute(countQuery, countParams);
  const pagination = createPagination(page, pageSize, Number(count.total));

  // Ambil data supplier sesuai halaman aktif (limit dan offset).
  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, pagination.offset);
  const [rows] = await db.execute(query, params);

  return { items: rows, pagination };
}

// Cari data supplier berdasarkan ID.
export async function findSupplierById(id) {
  const [rows] = await db.execute("SELECT * FROM suppliers WHERE id = ?", [id]);

  if (rows.length > 0) {
    return rows[0];
  }
  return null;
}

// Ambil data batch pembelian obat dari supplier berdasarkan kriteria filter.
async function getSupplierPurchaseBatches(
  supplierId,
  invoiceNumber,
  productName,
  invoiceDate,
  includeNullInvoice = false,
) {
  let query = `
    SELECT s.id AS supplier_id, s.name AS supplier_name, b.id AS batch_id, b.invoice_number,
           b.quantity_received, b.quantity_remaining, b.unit_cost, b.exp_date, b.invoice_date,
           p.id AS product_id, p.name AS product_name, p.barcode, p.unit
    FROM product_batches b
    INNER JOIN products p ON p.id = b.product_id
    INNER JOIN suppliers s ON s.id = p.supplier_id
    WHERE 1 = 1
  `;
  const params = [];

  // Filter berdasarkan ID supplier.
  if (supplierId !== undefined && supplierId !== null) {
    query += " AND p.supplier_id = ?";
    params.push(supplierId);
  }

  // Filter berdasarkan nomor faktur/invoice.
  if (invoiceNumber !== undefined) {
    if (invoiceNumber === null && includeNullInvoice) {
      query += " AND b.invoice_number IS NULL";
    } else if (invoiceNumber !== null) {
      query += " AND b.invoice_number = ?";
      params.push(invoiceNumber);
    }
  }

  // Filter jika ada produk tertentu dalam faktur yang dicari.
  if (productName) {
    query += `
      AND EXISTS (
        SELECT 1
        FROM product_batches search_batch
        INNER JOIN products search_product
          ON search_product.id = search_batch.product_id
        WHERE search_product.supplier_id = p.supplier_id
          AND search_batch.invoice_number <=> b.invoice_number
          AND LOCATE(?, search_product.name) > 0
      )
    `;
    params.push(productName);
  }

  // Filter berdasarkan tanggal faktur.
  if (invoiceDate) {
    query += " AND b.invoice_date = ?";
    params.push(invoiceDate);
  }

  query += " ORDER BY s.name ASC, b.invoice_date DESC, b.id DESC";

  const [rows] = await db.execute(query, params);
  return rows;
}

// Kelompokkan baris data batch obat ke dalam struktur faktur pembelian.
function groupPurchaseBatches(rows) {
  const daftarFaktur = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nomorInvoice = row.invoice_number || "TANPA_INVOICE";

    let faktur = null;
    for (let j = 0; j < daftarFaktur.length; j++) {
      if (daftarFaktur[j].invoice_number === nomorInvoice) {
        faktur = daftarFaktur[j];
        break;
      }
    }

    const jumlahBeli = Number(row.quantity_received || 0);
    const hargaModal = Number(row.unit_cost || 0);
    const subTotalItem = Number((jumlahBeli * hargaModal).toFixed(2));

    if (!faktur) {
      faktur = {
        invoice_number: row.invoice_number || null,
        invoice_date: row.invoice_date,
        total_items: 0,
        total_amount: 0,
        items: [],
      };
      daftarFaktur.push(faktur);
    }

    faktur.total_items += 1;
    faktur.total_amount = Number(
      (faktur.total_amount + subTotalItem).toFixed(2),
    );

    faktur.items.push({
      batch_id: row.batch_id,
      product_id: row.product_id,
      product_name: row.product_name,
      barcode: row.barcode,
      unit: row.unit,
      quantity_received: jumlahBeli,
      unit_cost: hargaModal,
      total_amount: subTotalItem,
      exp_date: row.exp_date,
      invoice_date: row.invoice_date,
    });
  }

  return daftarFaktur;
}

// Ambil daftar riwayat faktur pembelian dari supplier dengan paginasi.
export async function getAllSupplierPurchaseHistory(
  supplierId,
  productName,
  invoiceDate,
  page = 1,
  pageSize = 10,
) {
  let whereClause = " WHERE 1 = 1";
  const params = [];
  if (supplierId !== undefined && supplierId !== null) {
    whereClause += " AND p.supplier_id = ?";
    params.push(supplierId);
  }
  if (productName) {
    whereClause += ` AND EXISTS (
      SELECT 1
      FROM product_batches search_batch
      INNER JOIN products search_product
        ON search_product.id = search_batch.product_id
      WHERE search_product.supplier_id = p.supplier_id
        AND search_batch.invoice_number <=> b.invoice_number
        AND LOCATE(?, search_product.name) > 0
    )`;
    params.push(productName);
  }
  if (invoiceDate) {
    whereClause += " AND b.invoice_date = ?";
    params.push(invoiceDate);
  }

  const invoiceGroups = `
    FROM product_batches b
    INNER JOIN products p ON p.id = b.product_id
    INNER JOIN suppliers s ON s.id = p.supplier_id
    ${whereClause}
    GROUP BY p.supplier_id, b.invoice_number
  `;
  const [[count]] = await db.execute(
    `SELECT COUNT(*) AS total FROM (SELECT p.supplier_id ${invoiceGroups}) AS invoices`,
    params,
  );
  const pagination = createPagination(page, pageSize, Number(count.total));
  const [invoiceRows] = await db.execute(
    `SELECT p.supplier_id, MAX(s.name) AS supplier_name,
            MAX(b.invoice_number) AS invoice_number,
            MAX(b.invoice_date) AS invoice_date, MAX(b.id) AS last_batch_id
     ${invoiceGroups}
     ORDER BY supplier_name ASC, invoice_date DESC, last_batch_id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, pagination.offset],
  );

  const items = [];
  for (const invoiceRow of invoiceRows) {
    const rows = await getSupplierPurchaseBatches(
      invoiceRow.supplier_id,
      invoiceRow.invoice_number,
      productName,
      invoiceDate,
      true,
    );
    const invoice = groupPurchaseBatches(rows)[0];
    if (invoice) {
      items.push({
        ...invoice,
        supplier_id: invoiceRow.supplier_id,
        supplier_name: invoiceRow.supplier_name,
      });
    }
  }

  return {
    items,
    pagination,
  };
}

// Ambil rincian lengkap satu faktur pembelian supplier berdasarkan nomor faktur.
export async function getSupplierPurchaseDetails(supplierId, invoiceNumber) {
  const rows = await getSupplierPurchaseBatches(supplierId, invoiceNumber);
  const hasilGrup = groupPurchaseBatches(rows);

  if (hasilGrup.length > 0) {
    return hasilGrup[0];
  }
  return null;
}

// Tambah data supplier baru ke database.
export async function createSupplier(data) {
  const name = data.name ? String(data.name).trim() : "";
  const phone = data.phone ? String(data.phone).trim() : "";
  const email = data.email ? String(data.email).trim() : "";

  const address = data.address || data.adress || "";
  const cleanAddress = String(address).trim();

  const [result] = await db.execute(
    "INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)",
    [name, phone, email, cleanAddress],
  );

  return findSupplierById(result.insertId);
}

// Perbarui data supplier berdasarkan ID.
export async function updateSupplier(id, data) {
  const name = data.name ? String(data.name).trim() : "";
  const phone = data.phone ? String(data.phone).trim() : "";
  const email = data.email ? String(data.email).trim() : "";
  const address = data.address || data.adress || "";
  const cleanAddress = String(address).trim();

  await db.execute(
    "UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?",
    [name, phone, email, cleanAddress, id],
  );

  return findSupplierById(id);
}

// Hapus data supplier berdasarkan ID dari database.
export async function deleteSupplier(id) {
  const [result] = await db.execute("DELETE FROM suppliers WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

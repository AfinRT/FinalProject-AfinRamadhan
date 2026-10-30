import { db } from "../config/connection.js";
import { createPagination } from "../utils/pagination.js";

// Ambil nama role pengguna yang aktif berdasarkan ID.
export async function getExpenseRole(userId) {
  const [rows] = await db.execute(
    `SELECT r.name AS role_name
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? AND u.status = 'active'`,
    [userId],
  );

  if (rows.length > 0) {
    return rows[0].role_name;
  }
  return null;
}

// Ambil semua data pengeluaran dengan filter role, tanggal, pencarian, dan paginasi.
export async function getAllExpenses(
  userId,
  isAdmin,
  dateFrom = null,
  dateTo = null,
  search = "",
  page = 1,
  pageSize = 10,
) {
  let query = `
    SELECT id, user_id, category, description, amount, payment_method,
           DATE_FORMAT(expense_date, '%Y-%m-%d %H:%i:%s') AS expense_date 
    FROM expenses 
    WHERE 1=1
  `;
  const params = [];
  let countQuery = "SELECT COUNT(*) AS total FROM expenses WHERE 1=1";
  const countParams = [];

  // Admin dapat memfilter berdasarkan rentang tanggal; staf/kasir hanya melihat data miliknya hari ini.
  if (isAdmin) {
    if (dateFrom && dateTo) {
      query +=
        " AND expense_date >= ? AND expense_date < DATE_ADD(?, INTERVAL 1 DAY)";
      params.push(dateFrom, dateTo);
      countQuery +=
        " AND expense_date >= ? AND expense_date < DATE_ADD(?, INTERVAL 1 DAY)";
      countParams.push(dateFrom, dateTo);
    }
  } else {
    query +=
      " AND user_id = ? AND expense_date >= CURDATE() AND expense_date < CURDATE() + INTERVAL 1 DAY";
    params.push(userId);
    countQuery +=
      " AND user_id = ? AND expense_date >= CURDATE() AND expense_date < CURDATE() + INTERVAL 1 DAY";
    countParams.push(userId);
  }

  // Filter pencarian berdasarkan kategori atau deskripsi pengeluaran.
  if (search) {
    query += " AND (category LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
    countQuery += " AND (category LIKE ? OR description LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY expense_date DESC";

  // Hitung total data untuk membuat paginasi.
  const [[count]] = await db.execute(countQuery, countParams);
  const pagination = createPagination(page, pageSize, Number(count.total));

  // Ambil data halaman aktif sesuai limit dan offset.
  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, pagination.offset);
  const [rows] = await db.execute(query, params);
  return { items: rows, pagination };
}

// Cari data pengeluaran berdasarkan ID (staf hanya bisa melihat miliknya sendiri).
export async function findExpenseById(id, userId, isAdmin = false) {
  let query = `
    SELECT id, user_id, category, description, amount, payment_method,
           DATE_FORMAT(expense_date, '%Y-%m-%d %H:%i:%s') AS expense_date 
    FROM expenses 
    WHERE id = ?
  `;
  const params = [id];

  // Batasi akses jika bukan admin.
  if (!isAdmin) {
    query += " AND user_id = ?";
    params.push(userId);
  }

  const [rows] = await db.execute(query, params);

  if (rows.length > 0) {
    return rows[0];
  }
  return null;
}

// Catat pengeluaran baru ke database.
export async function createExpense(userId, data) {
  const category = data.category || "";
  const description = data.description || "";
  const amount = data.amount || 0;
  const payment_method = data.payment_method === "transfer" ? "transfer" : "cash";
  const expense_date = data.expense_date || new Date(); 

  const [result] = await db.execute(
    `INSERT INTO expenses (user_id, category, description, amount, payment_method, expense_date) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, category, description, amount, payment_method, expense_date],
  );

  return findExpenseById(result.insertId, userId, true);
}

// Perbarui data pengeluaran berdasarkan ID.
export async function updateExpense(id, userId, data, isAdmin = false) {
  const category = data.category || "";
  const description = data.description || "";
  const amount = data.amount || 0;
  const payment_method = data.payment_method === "transfer" ? "transfer" : "cash";
  const expense_date = data.expense_date || new Date();

  let query = `
    UPDATE expenses 
    SET category = ?, description = ?, amount = ?, payment_method = ?, expense_date = ? 
    WHERE id = ?
  `;
  const params = [category, description, amount, payment_method, expense_date, id];

  // Batasi agar staf hanya bisa mengubah pengeluaran miliknya sendiri.
  if (!isAdmin) {
    query += " AND user_id = ?";
    params.push(userId);
  }

  await db.execute(query, params);
  return findExpenseById(id, userId, isAdmin);
}

// Hapus data pengeluaran berdasarkan ID.
export async function deleteExpense(id, userId, isAdmin = false) {
  let query = "DELETE FROM expenses WHERE id = ?";
  const params = [id];

  // Batasi agar staf hanya bisa menghapus pengeluaran miliknya sendiri.
  if (!isAdmin) {
    query += " AND user_id = ?";
    params.push(userId);
  }

  const [result] = await db.execute(query, params);

  return result.affectedRows > 0;
}

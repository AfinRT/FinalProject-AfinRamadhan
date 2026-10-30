import { db } from "../config/connection.js";
import { createPagination } from "../utils/pagination.js";

// Ambil semua data kategori dengan fitur pencarian dan paginasi.
export async function getAllCategories({
  search = "",
  page = 1,
  pageSize = 10,
} = {}) {
  let query = "SELECT * FROM categories";
  let countQuery = "SELECT COUNT(*) AS total FROM categories";
  const params = [];
  const countParams = [];

  // Filter pencarian berdasarkan nama atau deskripsi kategori.
  if (search) {
    query += " WHERE name LIKE ? OR description LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
    countQuery += " WHERE name LIKE ? OR description LIKE ?";
    countParams.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY name ASC";

  // Hitung total baris untuk membuat metadata paginasi (halaman, total item, dll).
  const [[count]] = await db.execute(countQuery, countParams);
  const pagination = createPagination(page, pageSize, Number(count.total));

  // Ambil data sesuai halaman (limit dan offset).
  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, pagination.offset);
  const [rows] = await db.execute(query, params);

  return { items: rows, pagination };
}

// Cari data kategori berdasarkan ID.
export async function findCategoryById(id) {
  const [rows] = await db.execute(`SELECT * FROM categories WHERE id = ?`, [
    id,
  ]);

  return rows[0] ?? null;
}

// Tambah kategori baru ke database dan kembalikan data yang baru dibuat.
export async function createCategory(data) {
  const { name, description } = data;
  const resolvedName = String(name ?? "").trim();
  const resolvedDescription = String(description ?? "").trim();

  const [result] = await db.execute(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    [resolvedName, resolvedDescription],
  );

  return findCategoryById(result.insertId);
}

// Perbarui nama dan deskripsi kategori berdasarkan ID.
export async function updateCategory(id, data) {
  const { name, description } = data;
  const resolvedName = String(name ?? "").trim();
  const resolvedDescription = String(description ?? "").trim();

  await db.execute(
    `UPDATE categories SET name = ?, description = ? WHERE id = ?`,
    [resolvedName, resolvedDescription, id],
  );

  return findCategoryById(id);
}

// Hapus kategori berdasarkan ID dari database.
export async function deleteCategory(id) {
  const [result] = await db.execute(`DELETE FROM categories WHERE id = ?`, [
    id,
  ]);

  return result.affectedRows > 0;
}

import bcrypt from "bcryptjs";
import { db } from "../config/connection.js";
import { createPagination } from "../utils/pagination.js";

// Ambil semua data pengguna dengan filter pencarian dan paginasi.
export async function getAllUsers({
  search = "",
  page = 1,
  pageSize = 10,
} = {}) {
  let query =
    "SELECT u.id, u.name, u.email, u.role_id, u.status, r.name AS role_name FROM users u LEFT JOIN roles r ON r.id = u.role_id";
  let countQuery =
    "SELECT COUNT(*) AS total FROM users u LEFT JOIN roles r ON r.id = u.role_id";
  const params = [];
  const countParams = [];

  // Filter pencarian berdasarkan nama, email, atau nama role.
  if (search) {
    query += " WHERE u.name LIKE ? OR u.email LIKE ? OR r.name LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countQuery += " WHERE u.name LIKE ? OR u.email LIKE ? OR r.name LIKE ?";
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += " ORDER BY u.id ASC";

  // Hitung total pengguna untuk metadata paginasi.
  const [[count]] = await db.execute(countQuery, countParams);
  const pagination = createPagination(page, pageSize, Number(count.total));

  // Ambil data pengguna sesuai halaman aktif (limit dan offset).
  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, pagination.offset);
  const [rows] = await db.execute(query, params);

  return { items: rows, pagination };
}

// Cari data pengguna berdasarkan alamat email.
export async function findUserByEmail(email) {
  const [rows] = await db.execute(
    "SELECT id, name, email, password, role_id, status FROM users WHERE email = ?",
    [email],
  );

  if (rows.length > 0) {
    return rows[0];
  }
  return null;
}

// Cari data pengguna berdasarkan ID.
export async function findUserById(id) {
  const [rows] = await db.execute(
    "SELECT id, name, email, role_id, status FROM users WHERE id = ?",
    [id],
  );

  if (rows.length > 0) {
    return rows[0];
  }
  return null;
}

// Ambil nama role pengguna aktif berdasarkan ID.
export async function getActiveUserRole(userId) {
  const [rows] = await db.execute(
    `SELECT LOWER(r.name) AS role_name
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

// Cek apakah ID role tersedia di database.
export async function roleExists(roleId) {
  const [rows] = await db.execute("SELECT id FROM roles WHERE id = ?", [
    roleId,
  ]);

  return rows.length > 0;
}

// Buat akun pengguna baru dengan password yang di-hash.
export async function createUser(data) {
  const name = data.name;
  const email = data.email;
  const password = data.password;
  const roleId = data.roleId;

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, role_id, status) VALUES (?, ?, ?, ?, ?)",
      [name, email, passwordHash, roleId, "active"],
    );

    return findUserById(result.insertId);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
      return null;
    }
    throw error;
  }
}

// Perbarui data nama, email, role, status, atau password pengguna berdasarkan ID.
export async function updateUser(id, data) {
  const name = data.name;
  const email = data.email;
  const password = data.password;
  const roleId = data.roleId;
  const status = data.status;

  const fields = ["name = ?", "email = ?", "role_id = ?"];
  const params = [name, email, roleId];

  if (status) {
    fields.push("status = ?");
    params.push(status);
  }

  if (password && password.length > 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    fields.push("password = ?");
    params.push(passwordHash);
  }

  params.push(id);
  await db.execute(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
    params,
  );

  return findUserById(id);
}

// Hapus data pengguna berdasarkan ID.
export async function deleteUser(id) {
  const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);

  return result.affectedRows > 0;
}

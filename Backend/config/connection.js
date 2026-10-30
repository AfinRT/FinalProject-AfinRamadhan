import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const isSsl =
  process.env.DB_SSL === "true" ||
  process.env.DB_SSL === "REQUIRED" ||
  process.env.DB_SSL === "1";

// Membuat pool koneksi database MySQL agar request ditangani secara efisien.
export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "apotek_pos",
  decimalNumbers: true,
  connectionLimit: 15,
  ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

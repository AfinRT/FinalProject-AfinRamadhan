import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { db } from "../config/connection.js";

const migrationUrl = new URL(
  "../migrations/apotek_pos%20(1).sql",
  import.meta.url,
);
const expectedTables = [
  "categories",
  "expenses",
  "products",
  "product_batches",
  "product_units",
  "roles",
  "sales",
  "sale_details",
  "sale_detail_batches",
  "suppliers",
  "users",
];

// Memisahkan perintah-perintah SQL dan menormalkan query pembuatan tabel
function splitStatements(sql) {
  return sql
    .replace(/^\s*--.*$/gm, "")
    .replace(/\/\*![0-9]{5}\s*([\s\S]*?)\*\//g, "$1")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => {
      // Pastikan CREATE TABLE menyertakan PRIMARY KEY (`id`)
      if (/^CREATE\s+TABLE/i.test(statement) && !/PRIMARY\s+KEY/i.test(statement)) {
        return statement.replace(/\)\s*ENGINE=/i, ", PRIMARY KEY (`id`)\n) ENGINE=");
      }

      // Hapus klausul ADD PRIMARY KEY pada ALTER TABLE jika primary key sudah ditentukan
      if (/^ALTER\s+TABLE/i.test(statement) && /ADD\s+PRIMARY\s+KEY\s*\(`id`\)/i.test(statement)) {
        const cleaned = statement
          .replace(/ADD\s+PRIMARY\s+KEY\s*\(`id`\)\s*,?/i, "")
          .trim();
        if (/^ALTER\s+TABLE\s+`?\w+`?\s*$/i.test(cleaned)) {
          return null;
        }
        return cleaned;
      }

      return statement;
    })
    .filter(Boolean);
}

let connection;

try {
  const databaseName = process.env.DB_NAME;

  if (
    !databaseName ||
    !/^[A-Za-z0-9_]+$/.test(databaseName)
  ) {
    throw new Error(
      "DB_NAME wajib diatur dan hanya boleh berisi huruf, angka, atau underscore.",
    );
  }

  // Buat database di server MySQL lokal jika belum ada
  try {
    const serverConnection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME || "root",
      password: process.env.DB_PASSWORD ?? "",
    });

    try {
      await serverConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${databaseName}\`
         CHARACTER SET utf8mb4
         COLLATE utf8mb4_unicode_ci`,
      );
    } finally {
      await serverConnection.end();
    }
  } catch (err) {
    console.log("Catatan: Melewati pembuatan database otomatis (menggunakan database yang sudah ada).");
  }

  // Gunakan koneksi pool database lokal
  connection = await db.getConnection();

  const [databaseRows] = await connection.execute(
    "SELECT DATABASE() AS database_name",
  );

  const activeDatabaseName =
    databaseRows[0]?.database_name;

  if (activeDatabaseName !== databaseName) {
    throw new Error(
      `Database aktif harus ${databaseName}; saat ini: ${
        activeDatabaseName ?? "tidak ada"
      }`,
    );
  }

  // Periksa tabel yang sudah tersedia di database lokal
  const [tableRows] = await connection.query(
    "SHOW TABLES",
  );

  const existingTables = new Set(
    tableRows.map((row) => Object.values(row)[0]),
  );

  const missingTables = expectedTables.filter(
    (table) => !existingTables.has(table),
  );

  const sql = await readFile(migrationUrl, "utf8");
  const statements = splitStatements(sql);

  await connection.beginTransaction();

  try {
    for (const statement of statements) {
      await connection.query(statement);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }

  // Verifikasi seluruh tabel setelah migrasi dijalankan
  const [finalTableRows] = await connection.query(
    "SHOW TABLES",
  );

  const finalTables = new Set(
    finalTableRows.map((row) => Object.values(row)[0]),
  );

  const stillMissing = expectedTables.filter(
    (table) => !finalTables.has(table),
  );

  if (stillMissing.length > 0) {
    throw new Error(
      `Tabel belum tersedia: ${stillMissing.join(", ")}`,
    );
  }

  if (missingTables.length > 0) {
    console.log(
      `Database ${databaseName}: migrasi berhasil. Tabel baru yang ditambahkan: ${missingTables.join(", ")}.`,
    );
  } else {
    console.log(
      `Database ${databaseName}: migrasi berhasil. Seluruh tabel sudah tersedia.`,
    );
  }
} catch (error) {
  console.error("Setup database gagal:", error.message);
  process.exitCode = 1;
} finally {
  connection?.release();
  await db.end();
}

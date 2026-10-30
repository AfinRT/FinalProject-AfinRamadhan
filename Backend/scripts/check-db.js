import { db } from "../config/connection.js";

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

try {
  const [server] = await db.execute(
    "SELECT DATABASE() AS database_name, VERSION() AS version",
  );
  const [tables] = await db.query("SHOW TABLES");
  const existingTables = new Set(tables.map((row) => Object.values(row)[0]));
  const missingTables = expectedTables.filter(
    (tableName) => !existingTables.has(tableName),
  );

  if (missingTables.length > 0) {
    throw new Error(
      `Tabel migration belum lengkap: ${missingTables.join(", ")}`,
    );
  }

  const tableCounts = await Promise.all(
    expectedTables.map(async (tableName) => {
      const [[{ row_count: rowCount }]] = await db.query(
        `SELECT COUNT(*) AS row_count FROM \`${tableName}\``,
      );
      return { table: tableName, rows: Number(rowCount) };
    }),
  );
  const [products] = await db.execute(
    "SELECT id, name, selling_price, stock, min_stock FROM products ORDER BY id LIMIT 10",
  );
  const [users] = await db.execute(
    "SELECT id, name, email, status FROM users ORDER BY id",
  );

  console.table(server);
  console.table(tableCounts);
  console.table(products);
  console.table(users);
} finally {
  await db.end();
}

import { db } from "../config/connection.js";

// Ambil ringkasan total penjualan dan pengeluaran berdasarkan rentang tanggal.
export async function getDashboardSummary(dateFrom, dateTo, { userId, isAdmin }) {
  // Hitung total transaksi dan penjualan per metode bayar (COALESCE mencegah NULL jika belum ada data).
  let salesQuery = `
    SELECT COUNT(*) AS transaction_count,
           COALESCE(SUM(grand_total), 0) AS total_sales,
           COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN grand_total ELSE 0 END), 0) AS cash_total,
           COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'transfer' THEN grand_total ELSE 0 END), 0) AS transfer_total,
           COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'qris' THEN grand_total ELSE 0 END), 0) AS qris_total
    FROM sales
    WHERE sale_date >= ? AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)
  `;
  const salesParams = [dateFrom, dateTo];

  // Hitung total pengeluaran apotek per metode bayar.
  let expensesQuery = `
    SELECT COALESCE(SUM(amount), 0) AS total_expenses,
           COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN amount ELSE 0 END), 0) AS cash_expenses,
           COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'transfer' THEN amount ELSE 0 END), 0) AS transfer_expenses
    FROM expenses
    WHERE expense_date >= ? AND expense_date < DATE_ADD(?, INTERVAL 1 DAY)
  `;
  const expensesParams = [dateFrom, dateTo];

  // Jika bukan admin (misal kasir), filter hanya data miliknya sendiri.
  if (!isAdmin) {
    salesQuery += " AND user_id = ?";
    salesParams.push(userId);
    expensesQuery += " AND user_id = ?";
    expensesParams.push(userId);
  }

  // Jalankan query penjualan dan pengeluaran secara bersamaan.
  const [[salesRows], [expenseRows]] = await Promise.all([
    db.execute(salesQuery, salesParams),
    db.execute(expensesQuery, expensesParams),
  ]);
  const sales = salesRows[0];
  const expenses = expenseRows[0];

  return {
    transaction_count: sales.transaction_count,
    total_sales: sales.total_sales,
    cash_total: sales.cash_total,
    transfer_total: sales.transfer_total,
    qris_total: sales.qris_total,
    total_expenses: expenses.total_expenses,
    cash_expenses: expenses.cash_expenses,
    transfer_expenses: expenses.transfer_expenses,
  };
}

// Ambil data keuangan bulanan (omzet, pengeluaran, dan HPP modal obat) untuk grafik tahunan.
export async function getDashboardYearlySummary(
  year,
  { userId, isAdmin, today },
) {
  // Tentukan rentang tanggal (admin melihat 1 tahun, kasir hanya hari ini).
  const dateFrom = isAdmin ? `${year}-01-01` : today;
  const dateTo = isAdmin
    ? `${year + 1}-01-01`
    : new Date(
        Date.UTC(
          Number(today.slice(0, 4)),
          Number(today.slice(5, 7)) - 1,
          Number(today.slice(8, 10)) + 1,
        ),
      )
        .toISOString()
        .slice(0, 10);
  const salesParams = [dateFrom, dateTo];
  const expensesParams = [dateFrom, dateTo];
  const salesUserFilter = isAdmin ? "" : " AND s.user_id = ?";
  const expensesUserFilter = isAdmin ? "" : " AND e.user_id = ?";

  if (!isAdmin) {
    salesParams.push(userId);
    expensesParams.push(userId);
  }

  // Gabungkan omzet penjualan, pengeluaran, dan HPP modal obat terjual per bulan.
  const [rows] = await db.execute(
    `SELECT month,
            SUM(revenue) AS revenue,
            SUM(expenses) AS expenses,
            SUM(cost_of_goods_sold) AS cost_of_goods_sold
     FROM (
      -- Total penjualan per bulan
       SELECT MONTH(s.sale_date) AS month,
              SUM(s.grand_total) AS revenue,
              0 AS expenses,
              0 AS cost_of_goods_sold
       FROM sales s
       WHERE s.sale_date >= ? AND s.sale_date < ?
         ${salesUserFilter}
       GROUP BY MONTH(s.sale_date)

       UNION ALL

       -- Total pengeluaran operasional per bulan
       SELECT MONTH(e.expense_date) AS month,
              0 AS revenue,
              SUM(e.amount) AS expenses,
              0 AS cost_of_goods_sold
       FROM expenses e
       WHERE e.expense_date >= ? AND e.expense_date < ?
         ${expensesUserFilter}
       GROUP BY MONTH(e.expense_date)

       UNION ALL

       -- Total HPP modal obat yang terjual per bulan
       SELECT MONTH(s.sale_date) AS month,
              0 AS revenue,
              0 AS expenses,
              SUM(sdb.quantity * sdb.unit_cost) AS cost_of_goods_sold
       FROM sale_detail_batches sdb
       INNER JOIN sale_details sd ON sd.id = sdb.sale_detail_id
       INNER JOIN sales s ON s.id = sd.sale_id
       WHERE s.sale_date >= ? AND s.sale_date < ?
         ${salesUserFilter}
       GROUP BY MONTH(s.sale_date)
     ) AS monthly_totals
     GROUP BY month
     ORDER BY month`,
    [...salesParams, ...expensesParams, ...salesParams],
  );

  return rows;
}

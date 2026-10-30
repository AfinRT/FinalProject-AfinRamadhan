import { logError } from "../utils/logger.js";
import {
  getDashboardSummary,
  getDashboardYearlySummary,
} from "../models/dashboardModels.js";
import { getActiveUserRole } from "../models/userModel.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

// Memvalidasi apakah teks tanggal sesuai format YYYY-MM-DD dan valid secara kalender.
function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  if (year < 1000) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

// Menghasilkan rentang tanggal hari ini (dateFrom dan dateTo bernilai tanggal hari ini).
function getTodayPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;

  return { dateFrom: today, dateTo: today };
}

// Menghasilkan rentang tanggal dari awal bulan berjalan (tanggal 01) sampai hari ini.
function getCurrentMonthPeriod() {
  const today = getTodayPeriod().dateTo;
  return { dateFrom: `${today.slice(0, 7)}-01`, dateTo: today };
}

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

// Mengambil ringkasan statistik dashboard (penjualan, pengeluaran, laba bersih, dan rincian metode pembayaran).
export async function summary(req, res) {
  try {
    const userId = Number(req.auth?.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return sendError(res, 401, "Silakan login dengan token yang valid.");
    }

    const role = String((await getActiveUserRole(userId)) ?? "").toLowerCase();
    const isAdmin = role === "admin" || role === "apoteker";
    const isCashier = role === "kasir";
    if (!isAdmin && !isCashier) {
      return sendError(res, 403, "Role tidak memiliki akses ke ringkasan.");
    }

    const hasDateFrom = req.query.date_from !== undefined;
    const hasDateTo = req.query.date_to !== undefined;
    if (isAdmin && hasDateFrom !== hasDateTo) {
      return sendError(
        res,
        400,
        "date_from dan date_to harus dikirim bersamaan.",
      );
    }
    if (isCashier && (hasDateFrom || hasDateTo)) {
      return sendError(
        res,
        400,
        "Ringkasan kasir hanya tersedia untuk hari ini.",
      );
    }

    const period = isCashier
      ? getTodayPeriod()
      : hasDateFrom
        ? { dateFrom: req.query.date_from, dateTo: req.query.date_to }
        : getCurrentMonthPeriod();

    if (!isValidDate(period.dateFrom) || !isValidDate(period.dateTo)) {
      return sendError(
        res,
        400,
        "Format tanggal harus valid dan menggunakan YYYY-MM-DD.",
      );
    }
    if (period.dateFrom > period.dateTo) {
      return sendError(res, 400, "date_from tidak boleh melewati date_to.");
    }

    const totals = await getDashboardSummary(period.dateFrom, period.dateTo, {
      userId,
      isAdmin,
    });
    const totalSales = Number(totals.total_sales);
    const totalExpenses = Number(totals.total_expenses);
    const cashSales = Number(totals.cash_total);
    const transferSales = Number(totals.transfer_total);
    const qrisSales = Number(totals.qris_total);
    const cashExpenses = Number(totals.cash_expenses ?? 0);
    const transferExpenses = Number(totals.transfer_expenses ?? 0);
    const money = (value) => Number(Number(value).toFixed(2));

    return sendSuccess(res, 200, "Ringkasan penjualan berhasil diambil.", {
      date_from: period.dateFrom,
      date_to: period.dateTo,
      transaction_count: Number(totals.transaction_count),
      total_sales: money(totalSales),
      sales_by_method: {
        cash: money(cashSales),
        transfer: money(transferSales),
        qris: money(qrisSales),
      },
      total_expenses: money(totalExpenses),
      expenses_by_method: {
        cash: money(cashExpenses),
        transfer: money(transferExpenses),
      },
      total_finance: money(totalSales - totalExpenses),
      finance_breakdown: {
        net_cash: money(cashSales - cashExpenses),
        net_bank: money(transferSales + qrisSales - transferExpenses),
      },
    });
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil ringkasan penjualan.",
    );
  }
}

// Mengambil data grafik satu tahun dan mengisi bulan tanpa transaksi dengan nol.
export async function yearly(req, res) {
  try {
    const userId = Number(req.auth?.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return sendError(res, 401, "Silakan login dengan token yang valid.");
    }

    const role = String((await getActiveUserRole(userId)) ?? "").toLowerCase();
    const isAdmin = role === "admin" || role === "apoteker";
    if (!isAdmin && role !== "kasir") {
      return sendError(res, 403, "Role tidak memiliki akses ke ringkasan.");
    }

    const yearQuery = req.query.year;
    const year =
      yearQuery === undefined ? new Date().getFullYear() : Number(yearQuery);

    if (
      (yearQuery !== undefined &&
        (typeof yearQuery !== "string" || !/^\d{4}$/.test(yearQuery))) ||
      !Number.isSafeInteger(year) ||
      year < 1000 ||
      year > new Date().getFullYear()
    ) {
      return sendError(
        res,
        400,
        "Tahun harus berupa tahun valid dan tidak boleh melebihi tahun ini.",
      );
    }

    const currentYear = new Date().getFullYear();
    if (!isAdmin && year !== currentYear) {
      return sendError(
        res,
        400,
        "Kasir hanya dapat melihat data tahun berjalan.",
      );
    }

    const today = getTodayPeriod().dateFrom;
    const rows = await getDashboardYearlySummary(year, {
      userId,
      isAdmin,
      today,
    });
    const totalsByMonth = new Map(rows.map((row) => [Number(row.month), row]));
    const months = monthLabels.map((label, index) => {
      const totals = totalsByMonth.get(index + 1);
      const revenue = Number(totals?.revenue ?? 0);
      const costOfGoodsSold = Number(totals?.cost_of_goods_sold ?? 0);
      const expenses = Number(totals?.expenses ?? 0);

      return {
        month: index + 1,
        label,
        revenue,
        cost_of_goods_sold: costOfGoodsSold,
        expenses,
        profit: Number((revenue - costOfGoodsSold - expenses).toFixed(2)),
      };
    });

    return sendSuccess(res, 200, "Data grafik tahunan berhasil diambil.", {
      year,
      months,
    });
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil data grafik tahunan.",
    );
  }
}

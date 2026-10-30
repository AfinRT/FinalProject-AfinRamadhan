import { logError } from "../utils/logger.js";
import {
  createExpense,
  deleteExpense,
  getExpenseRole,
  getAllExpenses,
  updateExpense,
} from "../models/expenseModels.js";
import {
  sendError,
  sendPaginatedSuccess,
  sendSuccess,
} from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

const supportedRoles = new Set(["admin", "kasir"]);

// Validasi format tanggal YYYY-MM-DD dan validitas kalender.
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

// Parsing dan validasi parameter filter rentang tanggal pengeluaran.
export function parseExpenseDateFilter(query = {}) {
  const hasDateFrom = query.date_from !== undefined;
  const hasDateTo = query.date_to !== undefined;

  if (!hasDateFrom && !hasDateTo) {
    return { dateFrom: null, dateTo: null };
  }

  const dateFrom = hasDateFrom ? query.date_from : query.date_to;
  const dateTo = hasDateTo ? query.date_to : query.date_from;

  if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
    return { error: "Format tanggal harus valid dan menggunakan YYYY-MM-DD." };
  }
  if (dateFrom > dateTo) {
    return { error: "Tanggal awal tidak boleh melewati tanggal akhir." };
  }

  return { dateFrom, dateTo };
}

// Parsing parameter kata kunci pencarian pengeluaran.
export function parseExpenseSearch(query = {}) {
  const value = query.search;
  if (value === undefined) return { search: "" };
  if (typeof value !== "string" || value.length > 100) {
    return { error: "Kata pencarian harus berupa teks maksimal 100 karakter." };
  }

  return { search: value.trim() };
}

// Ambil ID dan hak akses user dari token login dan tabel roles.
async function getAccess(req) {
  const userId = Number(req.auth?.sub);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const role = await getExpenseRole(userId);
  if (!role) return null;

  const normalizedRole = role.toLowerCase();
  if (!supportedRoles.has(normalizedRole)) return null;

  return { userId, isAdmin: normalizedRole === "admin" };
}

// Siapkan data pengeluaran dengan nilai default sebelum disimpan ke database.
function prepareExpenseData(body = {}) {
  return {
    category: body.category,
    description: body.description ?? "",
    amount: body.amount,
    payment_method: body.payment_method ?? "cash",
    expense_date:
      body.expense_date ||
      new Date().toISOString().slice(0, 19).replace("T", " "),
  };
}

// Ambil semua data pengeluaran (admin melihat semua, kasir hanya melihat miliknya hari ini).
export async function index(req, res) {
  try {
    const access = await getAccess(req);
    if (!access) {
      return sendError(res, 403, "Role tidak memiliki akses ke pengeluaran.");
    }

    // Validasi filter tanggal, kata kunci pencarian, dan paginasi.
    const dateFilter = parseExpenseDateFilter(req.query);
    if (dateFilter.error) return sendError(res, 400, dateFilter.error);
    const searchFilter = parseExpenseSearch(req.query);
    if (searchFilter.error) return sendError(res, 400, searchFilter.error);
    const paginationInput = parsePagination(req.query);
    if (paginationInput.error) {
      return sendError(res, 400, paginationInput.error);
    }

    // Ambil data pengeluaran dari database sesuai hak akses role.
    const expenses = await getAllExpenses(
      access.userId,
      access.isAdmin,
      access.isAdmin ? dateFilter.dateFrom : null,
      access.isAdmin ? dateFilter.dateTo : null,
      searchFilter.search,
      paginationInput.page,
      paginationInput.pageSize,
    );
    return sendPaginatedSuccess(
      res,
      200,
      "Data pengeluaran berhasil diambil.",
      expenses.items,
      expenses.pagination,
    );
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil data pengeluaran.",
    );
  }
}

// Buat catatan pengeluaran baru untuk kasir atau admin yang sedang login.
export async function store(req, res) {
  try {
    const access = await getAccess(req);
    if (!access) {
      return sendError(
        res,
        403,
        "Role tidak memiliki akses membuat pengeluaran.",
      );
    }

    // Simpan data pengeluaran baru ke database.
    const expense = await createExpense(
      access.userId,
      prepareExpenseData(req.body),
    );

    return sendSuccess(res, 201, "Data pengeluaran berhasil dibuat.", expense);
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat membuat data pengeluaran.",
    );
  }
}

// Perbarui data pengeluaran berdasarkan ID (staf hanya dapat mengubah miliknya sendiri).
export async function replace(req, res) {
  try {
    const access = await getAccess(req);
    if (!access) {
      return sendError(
        res,
        403,
        "Role tidak memiliki akses mengubah pengeluaran.",
      );
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, "ID pengeluaran tidak valid.");
    }

    // Perbarui data pengeluaran di database.
    const expense = await updateExpense(
      id,
      access.userId,
      prepareExpenseData(req.body),
      access.isAdmin,
    );

    if (!expense) {
      return sendError(
        res,
        404,
        "Data pengeluaran tidak ditemukan atau Anda tidak memiliki akses untuk mengubahnya.",
      );
    }

    return sendSuccess(
      res,
      200,
      "Data pengeluaran berhasil diperbarui.",
      expense,
    );
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengubah data pengeluaran.",
    );
  }
}

// Hapus data pengeluaran berdasarkan ID (staf hanya dapat menghapus miliknya sendiri).
export async function destroy(req, res) {
  try {
    const access = await getAccess(req);
    if (!access) {
      return sendError(
        res,
        403,
        "Role tidak memiliki akses menghapus pengeluaran.",
      );
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, "ID pengeluaran tidak valid.");
    }

    // Hapus baris pengeluaran dari database.
    const deleted = await deleteExpense(id, access.userId, access.isAdmin);

    if (!deleted) {
      return sendError(res, 404, "Data pengeluaran tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Data pengeluaran berhasil dihapus.");
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat menghapus data pengeluaran.",
    );
  }
}

import { logError } from "../utils/logger.js";
import {
  createSale,
  deleteSale,
  findSaleById,
  getAllSales,
  getProductSalesAnalysis,
} from "../models/saleModels.js";
import { getExpenseRole } from "../models/expenseModels.js";
import {
  sendError,
  sendPaginatedSuccess,
  sendSuccess,
} from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

// Memastikan tanggal filter valid dan mengikuti format YYYY-MM-DD.
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

// Menentukan tanggal hari ini sebagai rentang ringkasan kasir.
function getTodayPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;

  return {
    dateFrom: today,
    dateTo: today,
  };
}

// Memvalidasi dan menormalkan data keranjang belanja sebelum diproses ke model.
function parseSale(body = {}) {
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { error: "Daftar item penjualan wajib diisi." };
  }

  const seenProducts = new Set();
  const items = [];

  // Ambil dan validasi setiap item obat di keranjang belanja.
  for (const item of body.items) {
    const productId = Number(item?.product_id);
    const quantity = Number(item?.quantity);
    const unitId = item?.unit_id == null ? null : Number(item.unit_id);
    const discount = Number(item?.discount ?? 0);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      (unitId !== null && (!Number.isInteger(unitId) || unitId <= 0)) ||
      !Number.isFinite(discount) ||
      discount < 0
    ) {
      return { error: "Produk, jumlah, atau diskon item tidak valid." };
    }
    const itemKey = `${productId}-${unitId ?? "base"}`;
    if (seenProducts.has(itemKey)) {
      return {
        error: "Produk yang sama tidak boleh muncul lebih dari sekali.",
      };
    }

    seenProducts.add(itemKey);
    items.push({ productId, quantity, unitId, discount });
  }

  // Validasi diskon, nominal bayar, dan metode pembayaran.
  const discount = Number(body.discount ?? 0);
  const paidAmount = Number(body.paid_amount);
  const paymentMethod = String(body.payment_method ?? "")
    .trim()
    .toLowerCase();

  if (!Number.isFinite(discount) || discount < 0) {
    return { error: "Diskon transaksi harus berupa angka non-negatif." };
  }
  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    return { error: "Jumlah pembayaran tidak valid." };
  }
  if (!["cash", "transfer", "qris"].includes(paymentMethod)) {
    return { error: "Metode pembayaran harus cash, transfer, atau qris." };
  }

  return { data: { items, discount, paidAmount, paymentMethod } };
}

// Mengambil daftar riwayat transaksi penjualan dengan filter dan paginasi.
export async function index(req, res) {
  try {
    const paginationInput = parsePagination(req.query);
    if (paginationInput.error) {
      return sendError(res, 400, paginationInput.error);
    }
    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return sendError(res, 401, "Silakan login dengan token yang valid.");
    }

    const role = String((await getExpenseRole(userId)) ?? "").toLowerCase();
    const hasFullAccess = role === "admin" || role === "apoteker";
    if (!hasFullAccess && role !== "kasir") {
      return sendError(res, 403, "Role tidak memiliki akses ke penjualan.");
    }

    // Parsing dan validasi parameter filter pencarian.
    const queryKeys = [
      "invoice",
      "product",
      "cashier",
      "date_from",
      "date_to",
      "payment_method",
    ];
    const query = {};
    for (const key of queryKeys) {
      const value = req.query[key];
      if (value !== undefined && typeof value !== "string") {
        return sendError(res, 400, `Filter ${key} harus berupa teks.`);
      }
      query[key] = String(value ?? "").trim();
    }

    if (
      query.payment_method &&
      !["cash", "transfer", "qris"].includes(query.payment_method.toLowerCase())
    ) {
      return sendError(res, 400, "Metode pembayaran tidak valid.");
    }

    // Filter tanggal hanya diizinkan untuk admin/apoteker.
    if (query.date_from || query.date_to) {
      if (!hasFullAccess) {
        return sendError(
          res,
          403,
          "Filter tanggal hanya tersedia untuk admin.",
        );
      }
      if (
        (query.date_from && !isValidDate(query.date_from)) ||
        (query.date_to && !isValidDate(query.date_to))
      ) {
        return sendError(
          res,
          400,
          "Format tanggal harus valid dan menggunakan YYYY-MM-DD.",
        );
      }
      if (query.date_from && query.date_to && query.date_from > query.date_to) {
        return sendError(res, 400, "date_from tidak boleh melewati date_to.");
      }
    }

    // Ambil data penjualan dari database.
    const sales = await getAllSales({
      userId,
      hasFullAccess,
      today: getTodayPeriod().dateFrom,
      filters: {
        invoice: query.invoice,
        product: query.product,
        cashier: hasFullAccess ? query.cashier : "",
        paymentMethod: query.payment_method.toLowerCase(),
        dateFrom: hasFullAccess ? query.date_from || query.date_to : "",
        dateTo: hasFullAccess ? query.date_to || query.date_from : "",
      },
      ...paginationInput,
    });
    return sendPaginatedSuccess(
      res,
      200,
      "Data penjualan berhasil diambil.",
      sales.items,
      sales.pagination,
    );
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat mengambil penjualan.");
  }
}

// Cek apakah user memiliki hak akses untuk melihat detail atau struk transaksi penjualan.
async function canViewSale(req, sale) {
  const userId = Number(req.auth?.sub);
  if (!Number.isInteger(userId) || userId <= 0) return false;

  const role = String((await getExpenseRole(userId)) ?? "").toLowerCase();
  if (role === "admin" || role === "apoteker") return true;
  if (role !== "kasir" || Number(sale.user_id) !== userId) return false;

  const saleDate =
    sale.sale_date instanceof Date
      ? [
          sale.sale_date.getFullYear(),
          String(sale.sale_date.getMonth() + 1).padStart(2, "0"),
          String(sale.sale_date.getDate()).padStart(2, "0"),
        ].join("-")
      : String(sale.sale_date ?? "").slice(0, 10);

  return saleDate === getTodayPeriod().dateFrom;
}

// Mengambil analisis jumlah unit terjual dan status kelarisan per produk.
export async function productAnalysis(req, res) {
  const paginationInput = parsePagination(req.query);
  if (paginationInput.error) {
    return sendError(res, 400, paginationInput.error);
  }

  const hasDateFrom = req.query.date_from !== undefined;
  const hasDateTo = req.query.date_to !== undefined;

  if (hasDateFrom !== hasDateTo) {
    return sendError(
      res,
      400,
      "date_from dan date_to harus dikirim bersamaan.",
    );
  }

  if (hasDateFrom) {
    if (!isValidDate(req.query.date_from) || !isValidDate(req.query.date_to)) {
      return sendError(
        res,
        400,
        "Format tanggal harus valid dan menggunakan YYYY-MM-DD.",
      );
    }

    if (req.query.date_from > req.query.date_to) {
      return sendError(res, 400, "date_from tidak boleh melewati date_to.");
    }
  }

  try {
    const search = req.query.search ?? "";
    const order = req.query.order ?? "DESC";
    const products = await getProductSalesAnalysis({
      dateFrom: hasDateFrom ? req.query.date_from : undefined,
      dateTo: hasDateFrom ? req.query.date_to : undefined,
      search,
      order,
      ...paginationInput,
    });
    return sendPaginatedSuccess(
      res,
      200,
      "Analisis jumlah produk terjual berhasil diambil.",
      products.items,
      products.pagination,
    );
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil jumlah produk terjual.",
    );
  }
}

// Mengambil detail lengkap satu transaksi penjualan berdasarkan ID.
export async function show(req, res) {
  const saleId = Number(req.params.id);
  if (!Number.isInteger(saleId) || saleId <= 0) {
    return sendError(res, 400, "ID penjualan tidak valid.");
  }

  try {
    const sale = await findSaleById(saleId);
    if (!sale || !(await canViewSale(req, sale))) {
      return sendError(res, 404, "Data penjualan tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Detail penjualan berhasil diambil.", sale);
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil detail penjualan.",
    );
  }
}

// Mengambil data ringkas transaksi untuk dicetak pada struk kasir.
export async function receipt(req, res) {
  const saleId = Number(req.params.id);
  if (!Number.isInteger(saleId) || saleId <= 0) {
    return sendError(res, 400, "ID penjualan tidak valid.");
  }

  try {
    const sale = await findSaleById(saleId);
    if (!sale || !(await canViewSale(req, sale))) {
      return sendError(res, 404, "Data penjualan tidak ditemukan.");
    }

    // Format data struk belanjaan.
    const receiptData = {
      invoice_number: sale.invoice_number,
      sale_date: sale.sale_date,
      cashier_name: sale.cashier_name,
      items: sale.items.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        discount: item.discount,
        subtotal: item.subtotal,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      grand_total: sale.grand_total,
      payment_method: sale.payment_method,
      paid_amount: sale.paid_amount,
      change_amount: sale.change_amount,
    };

    return sendSuccess(res, 200, "Data struk berhasil diambil.", receiptData);
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat mengambil data struk.");
  }
}

// Simpan transaksi penjualan baru dan potong stok obat berdasarkan metode FEFO.
export async function store(req, res) {
  const userId = Number(req.auth?.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    return sendError(res, 401, "Silakan login dengan token yang valid.");
  }

  // Validasi dan normalisasi data transaksi dari keranjang belanja.
  const { data, error } = parseSale(req.body);
  if (error) return sendError(res, 400, error);

  try {
    const createdSale = await createSale(userId, data);
    const sale = await findSaleById(createdSale.id);
    if (!sale) {
      return sendError(
        res,
        500,
        "Penjualan berhasil disimpan, tetapi detail transaksi gagal diambil.",
      );
    }
    return sendSuccess(res, 201, "Penjualan berhasil disimpan.", sale);
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.message);
    }

    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat menyimpan penjualan.");
  }
}

// Hapus transaksi penjualan dan kembalikan stok batch obat (khusus admin).
export async function destroy(req, res) {
  const userId = Number(req.auth?.sub);
  const saleId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return sendError(res, 401, "Silakan login dengan token yang valid.");
  }
  if (!Number.isInteger(saleId) || saleId <= 0) {
    return sendError(res, 400, "ID penjualan tidak valid.");
  }

  try {
    const sale = await deleteSale(saleId, userId);
    return sendSuccess(res, 200, "Penjualan berhasil dihapus.", sale);
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat menghapus penjualan.");
  }
}

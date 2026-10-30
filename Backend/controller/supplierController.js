import { logError } from "../utils/logger.js";
import {
  getAllSuppliers,
  findSupplierById,
  getAllSupplierPurchaseHistory,
  getSupplierPurchaseDetails,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../models/supplierModels.js";
import {
  sendError,
  sendPaginatedSuccess,
  sendSuccess,
} from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

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

// Ambil semua data supplier dengan pencarian dan paginasi.
export async function index(req, res) {
  try {
    const paginationInput = parsePagination(req.query);
    if (paginationInput.error) {
      return sendError(res, 400, paginationInput.error);
    }
    const search = req.query.search ?? "";
    const result = await getAllSuppliers({ search, ...paginationInput });
    return sendPaginatedSuccess(
      res,
      200,
      "Data supplier berhasil diambil.",
      result.items,
      result.pagination,
    );
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil data supplier.",
    );
  }
}

// Ambil riwayat faktur pembelian obat dengan filter supplier, produk, dan tanggal.
export async function allPurchaseHistory(req, res) {
  try {
    const paginationInput = parsePagination(req.query);
    if (paginationInput.error) {
      return sendError(res, 400, paginationInput.error);
    }
    const supplierIdQuery = req.query.supplier_id;
    const productQuery = req.query.product;
    const invoiceDateQuery = req.query.invoice_date;
    const supplierId =
      supplierIdQuery === undefined ? undefined : Number(supplierIdQuery);
    const productName =
      typeof productQuery === "string" ? productQuery.trim() : undefined;
    const invoiceDate =
      typeof invoiceDateQuery === "string" ? invoiceDateQuery : undefined;

    // Validasi parameter query input.
    if (
      supplierIdQuery !== undefined &&
      (typeof supplierIdQuery !== "string" ||
        !/^[1-9]\d*$/.test(supplierIdQuery) ||
        !Number.isSafeInteger(supplierId))
    ) {
      return sendError(
        res,
        400,
        "ID supplier harus berupa bilangan bulat positif.",
      );
    }

    if (productQuery !== undefined && typeof productQuery !== "string") {
      return sendError(res, 400, "Nama produk harus berupa teks.");
    }

    if (invoiceDateQuery !== undefined && !isValidDate(invoiceDateQuery)) {
      return sendError(
        res,
        400,
        "Tanggal invoice harus valid dengan format YYYY-MM-DD.",
      );
    }

    // Pastikan supplier ada jika ID supplier disertakan.
    if (supplierId !== undefined) {
      const supplier = await findSupplierById(supplierId);
      if (!supplier) {
        return sendError(res, 404, "Supplier tidak ditemukan.");
      }
    }

    // Ambil riwayat pembelian supplier dari database.
    const purchases = await getAllSupplierPurchaseHistory(
      supplierId,
      productName,
      invoiceDate,
      paginationInput.page,
      paginationInput.pageSize,
    );
    return sendPaginatedSuccess(
      res,
      200,
      supplierId === undefined
        ? "Riwayat pembelian semua supplier berhasil diambil."
        : "Riwayat pembelian supplier berhasil diambil.",
      purchases.items,
      purchases.pagination,
    );
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil semua riwayat pembelian.",
    );
  }
}

// Ambil rincian lengkap satu faktur pembelian obat milik supplier.
export async function purchaseDetails(req, res) {
  try {
    const supplierId = Number(req.params.id);
    const supplier = await findSupplierById(supplierId);

    if (!supplier) {
      return sendError(res, 404, "Supplier tidak ditemukan.");
    }

    const invoice = await getSupplierPurchaseDetails(
      supplierId,
      req.params.invoiceNumber,
    );

    if (!invoice) {
      return sendError(res, 404, "Riwayat faktur pembelian tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Detail faktur berhasil diambil.", invoice);
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil detail faktur pembelian.",
    );
  }
}

// Buat data supplier baru setelah memvalidasi input.
export async function store(req, res) {
  try {
    const { name, phone, email, address } = req.body;

    const supplier = await createSupplier({
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      address: String(address).trim(),
    });

    return sendSuccess(res, 201, "Supplier berhasil dibuat.", supplier);
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat membuat supplier.");
  }
}

// Perbarui data supplier berdasarkan ID.
export async function replace(req, res) {
  try {
    const id = Number(req.params.id);

    const { name, phone, email, address } = req.body;

    const supplier = await updateSupplier(id, {
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      address: String(address).trim(),
    });

    if (!supplier) {
      return sendError(res, 404, "Supplier tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Supplier berhasil diperbarui.", supplier);
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat mengubah supplier.");
  }
}

// Hapus data supplier berdasarkan ID.
export async function destroy(req, res) {
  try {
    const id = Number(req.params.id);

    const deleted = await deleteSupplier(id);

    if (!deleted) {
      return sendError(res, 404, "Supplier tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Supplier berhasil dihapus.");
  } catch (error) {
    // Tangani error jika supplier masih terkait dengan data produk obat.
    if (error?.code === "ER_ROW_IS_REFERENCED_2" || error?.errno === 1451) {
      return sendError(
        res,
        409,
        "Supplier tidak dapat dihapus karena masih digunakan oleh produk.",
      );
    }
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat menghapus supplier.");
  }
}

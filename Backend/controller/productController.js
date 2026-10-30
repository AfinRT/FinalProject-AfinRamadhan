import { logError } from "../utils/logger.js";
import {
  createProduct,
  searchProducts,
  updateProduct,
  receiveProductStock,
  getExpiringProductBatches,
  getLowStockProducts,
  getProductBatches,
  updateProductBatch,
  deleteProductBatch,
} from "../models/productModels.js";
import {
  EMPTY_LIST_MESSAGE,
  sendError,
  sendPaginatedSuccess,
  sendSuccess,
} from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

// Cari dan tampilkan daftar produk obat berdasarkan filter pencarian, kategori, supplier, dan pengurutan.
export async function index(req, res) {
  try {
    const paginationInput = parsePagination(req.query);
    if (paginationInput.error) {
      return sendError(res, 400, paginationInput.error);
    }
    const barcode = req.query.barcode ?? "";
    const categoryId = req.query.category_id ?? "";
    const supplierId = req.query.supplier_id ?? "";
    const sort = req.query.sort ?? "";
    const sortBy = req.query.sort_by ?? "";
    const order = req.query.order ?? "";
    const normalizedSort =
      sort || (sortBy && order ? `${sortBy}:${order}` : "");

    const products = await searchProducts({
      name: req.query.search ?? "",
      barcode,
      categoryId,
      supplierId,
      sort: normalizedSort,
      ...paginationInput,
    });

    return sendPaginatedSuccess(
      res,
      200,
      "Data produk berhasil diambil.",
      products.items,
      products.pagination,
    );
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);

    return sendError(res, 500, "Terjadi kesalahan pada server.");
  }
}

// Ambil daftar batch obat yang mendekati kedaluwarsa atau sudah kedaluwarsa.
export async function expiring(req, res) {
  try {
    const paginationInput = parsePagination(req.query);
    if (paginationInput.error) {
      return sendError(res, 400, paginationInput.error);
    }
    const supplierId = req.query.supplier_id ?? "";
    const batchesData = await getExpiringProductBatches({
      search: req.query.search ?? "",
      supplierId,
      ...paginationInput,
    });
    return sendPaginatedSuccess(
      res,
      200,
      "Data batch kedaluwarsa berhasil diambil.",
      batchesData.items,
      batchesData.pagination,
    );
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);

    return sendError(res, 500, "Terjadi kesalahan pada server.");
  }
}

// Ambil daftar produk obat yang stoknya berada pada atau di bawah batas minimum.
export async function lowStock(req, res) {
  try {
    const paginationInput = parsePagination(req.query);
    if (paginationInput.error) {
      return sendError(res, 400, paginationInput.error);
    }
    const supplierId = req.query.supplier_id ?? "";
    const products = await getLowStockProducts({
      search: req.query.search ?? "",
      supplierId,
      ...paginationInput,
    });
    return sendPaginatedSuccess(
      res,
      200,
      "Data produk dengan stok menipis berhasil diambil.",
      products.items,
      products.pagination,
    );
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);

    return sendError(res, 500, "Terjadi kesalahan pada server.");
  }
}

// Tambah produk obat baru ke katalog dan buat batch awal.
export async function store(req, res) {
  try {
    const product = await createProduct(req.body);

    return sendSuccess(res, 201, "Produk berhasil dibuat.", product);
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);

    return sendError(res, 500, "Terjadi kesalahan pada server.");
  }
}

// Catat penerimaan batch stok masuk baru untuk produk obat dari supplier.
export async function stockIn(req, res) {
  try {
    const product = await receiveProductStock(Number(req.params.id), req.body);
    return sendSuccess(res, 201, "Stok produk berhasil ditambahkan.", product);
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat menambahkan stok.");
  }
}

// Perbarui data produk obat, stok, dan satuan multi-unit berdasarkan ID.
export async function replace(req, res) {
  try {
    const id = Number(req.params.id);

    const product = await updateProduct(id, req.body);

    if (!product) {
      return sendError(res, 404, "Produk tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Produk berhasil diperbarui.", product);
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);

    return sendError(res, 500, "Terjadi kesalahan pada server.");
  }
}

// Ambil daftar seluruh batch aktif untuk produk obat tertentu berdasarkan ID produk.
export async function batches(req, res) {
  try {
    const productId = Number(
      req.params.id ||
        req.params.productId ||
        req.query.product_id ||
        req.query.productId,
    );
    if (!productId) {
      return sendError(res, 400, "ID produk wajib disertakan.");
    }
    const data = await getProductBatches(productId);
    return sendSuccess(
      res,
      200,
      data.length === 0 ? EMPTY_LIST_MESSAGE : "Data batch berhasil dimuat.",
      data,
    );
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan pada server.");
  }
}

// Perbarui data batch obat spesifik (nomor invoice, tanggal exp, kuantitas, atau modal).
export async function updateBatch(req, res) {
  try {
    const batchId = Number(req.params.batchId || req.params.id);
    const updated = await updateProductBatch(batchId, req.body);
    return sendSuccess(res, 200, "Data batch berhasil diperbarui.", updated);
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan pada server.");
  }
}

// Hapus data baris batch obat tertentu dan kurangi stok utama produk.
export async function destroyBatch(req, res) {
  try {
    const batchId = Number(req.params.id || req.params.batchId);
    await deleteProductBatch(batchId);
    return sendSuccess(res, 200, "Batch berhasil dihapus.");
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.message);

    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan pada server.");
  }
}

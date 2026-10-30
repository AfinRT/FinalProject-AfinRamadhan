import { logError } from "../utils/logger.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from "../models/categoryModels.js";
import {
  sendError,
  sendPaginatedSuccess,
  sendSuccess,
} from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

// Ambil semua data kategori dengan fitur pencarian dan paginasi.
export async function index(req, res) {
  try {
    const paginationInput = parsePagination(req.query);
    if (paginationInput.error) {
      return sendError(res, 400, paginationInput.error);
    }
    const search = req.query.search ?? "";
    const result = await getAllCategories({ search, ...paginationInput });
    return sendPaginatedSuccess(
      res,
      200,
      "Data kategori berhasil diambil.",
      result.items,
      result.pagination,
    );
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil data kategori.",
    );
  }
}

// Buat kategori baru setelah memvalidasi nama kategori.
export async function store(req, res) {
  try {
    const { name, description } = req.body;

    if (!name || String(name).trim() === "") {
      return sendError(res, 400, "Nama kategori wajib diisi.");
    }

    const category = await createCategory({
      name: String(name).trim(),
      description: String(description ?? "").trim(),
    });

    return sendSuccess(res, 201, "Kategori berhasil dibuat.", category);
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat membuat kategori.");
  }
}

// Perbarui data nama dan deskripsi kategori berdasarkan ID.
export async function replace(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, "ID kategori tidak valid.");
    }

    const { name, description } = req.body;

    if (!name || String(name).trim() === "") {
      return sendError(res, 400, "Nama kategori wajib diisi.");
    }

    const category = await updateCategory(id, {
      name: String(name).trim(),
      description: String(description ?? "").trim(),
    });

    if (!category) {
      return sendError(res, 404, "Kategori tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Kategori berhasil diperbarui.", category);
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat mengubah kategori.");
  }
}

// Hapus kategori berdasarkan ID dari database.
export async function destroy(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, "ID kategori tidak valid.");
    }

    const deleted = await deleteCategory(id);

    if (!deleted) {
      return sendError(res, 404, "Kategori tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Kategori berhasil dihapus.");
  } catch (error) {
    // Tangani jika kategori masih digunakan oleh produk obat.
    if (error?.code === "ER_ROW_IS_REFERENCED_2" || error?.errno === 1451) {
      return sendError(
        res,
        409,
        "Kategori tidak dapat dihapus karena masih digunakan oleh produk.",
      );
    }
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat menghapus kategori.");
  }
}

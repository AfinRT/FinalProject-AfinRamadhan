import { logError } from "../utils/logger.js";
import {
  createUser,
  deleteUser,
  getAllUsers,
  updateUser,
} from "../models/userModel.js";
import {
  sendError,
  sendPaginatedSuccess,
  sendSuccess,
} from "../utils/apiResponse.js";
import { parsePagination } from "../utils/pagination.js";

// Ambil semua data pengguna dengan filter pencarian dan paginasi.
export async function index(req, res) {
  try {
    const paginationInput = parsePagination(req.query);
    if (paginationInput.error) {
      return sendError(res, 400, paginationInput.error);
    }
    const search = req.query.search ?? "";
    const result = await getAllUsers({ search, ...paginationInput });
    return sendPaginatedSuccess(
      res,
      200,
      "Data pengguna berhasil diambil.",
      result.items,
      result.pagination,
    );
  } catch (error) {
    logError("Controller request failed", error);
    return sendError(
      res,
      500,
      "Terjadi kesalahan saat mengambil data pengguna.",
    );
  }
}

// Buat akun pengguna baru dengan role yang dipilih.
export async function store(req, res) {
  try {
    const { name, email, password, role_id } = req.body;

    if (!name || String(name).trim() === "") {
      return sendError(res, 400, "Nama pengguna wajib diisi.");
    }

    const user = await createUser({
      name: String(name).trim(),
      email: String(email).trim(),
      password: String(password),
      roleId: Number(role_id),
    });
    if (!user) {
      return sendError(res, 409, "Email sudah digunakan.");
    }

    return sendSuccess(res, 201, "Pengguna berhasil dibuat.", user);
  } catch (error) {
    // Tangani jika terjadi duplikasi email.
    if (error?.code === "ER_DUP_ENTRY" || error?.errno === 1062) {
      return sendError(res, 409, "Email sudah digunakan.");
    }
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat membuat pengguna.");
  }
}

// Perbarui data profil akun pengguna berdasarkan ID.
export async function replace(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, "ID pengguna tidak valid.");
    }

    const { name, email, password, role_id, status } = req.body;

    if (!name || String(name).trim() === "") {
      return sendError(res, 400, "Nama pengguna wajib diisi.");
    }

    // Mencegah admin menonaktifkan akunnya sendiri yang sedang login.
    const authUserId = Number(req.auth?.sub);
    if (id === authUserId && status === "inactive") {
      return sendError(
        res,
        400,
        "Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.",
      );
    }

    const user = await updateUser(id, {
      name: String(name).trim(),
      email: String(email).trim(),
      password: typeof password === "string" ? password : "",
      roleId: Number(role_id),
      status: status ? String(status).trim().toLowerCase() : undefined,
    });

    if (!user) {
      return sendError(res, 404, "Pengguna tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Pengguna berhasil diperbarui.", user);
  } catch (error) {
    // Tangani jika email baru yang dimasukkan sudah digunakan akun lain.
    if (error?.code === "ER_DUP_ENTRY" || error?.errno === 1062) {
      return sendError(res, 409, "Email sudah digunakan.");
    }
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat mengubah pengguna.");
  }
}

// Hapus akun pengguna berdasarkan ID (mencegah hapus akun sendiri dan konflik data).
export async function destroy(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, "ID pengguna tidak valid.");
    }

    // Mencegah admin menghapus akun miliknya sendiri yang sedang login.
    const authUserId = Number(req.auth?.sub);
    if (id === authUserId) {
      return sendError(res, 400, "Anda tidak dapat menghapus akun Anda sendiri.");
    }

    const deleted = await deleteUser(id);

    if (!deleted) {
      return sendError(res, 404, "Pengguna tidak ditemukan.");
    }

    return sendSuccess(res, 200, "Pengguna berhasil dihapus.");
  } catch (error) {
    // Tangani jika akun pengguna masih memiliki transaksi yang mereferensikannya.
    if (error?.code === "ER_ROW_IS_REFERENCED_2" || error?.errno === 1451) {
      return sendError(
        res,
        409,
        "Pengguna tidak dapat dihapus karena memiliki riwayat transaksi terkait. Silakan nonaktifkan akun pengguna melalui tombol Edit.",
      );
    }
    logError("Controller request failed", error);
    return sendError(res, 500, "Terjadi kesalahan saat menghapus pengguna.");
  }
}

import bcrypt from "bcryptjs";
import { findUserByEmail } from "../models/userModel.js";
import { issueToken } from "../auth/tokenService.js";
import { HttpError } from "../utils/HttpError.js";
import { sendSuccess } from "../utils/apiResponse.js";

// Pilih data user yang aman dikirim ke client tanpa menyertakan password.
function userResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role_id: user.role_id,
    status: user.status,
  };
}

// Autentikasi user, lalu kembalikan token untuk request berikutnya.
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user) {
    throw new HttpError(401, "Email atau password salah.");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new HttpError(401, "Email atau password salah.");
  }

  // Akun nonaktif tidak boleh mendapatkan token login.
  if (user.status !== "active") {
    throw new HttpError(403, "Akun tidak aktif.");
  }

  const token = issueToken(user.id);

  return sendSuccess(res, 200, "Login berhasil.", {
    token,
    tokenType: "Bearer",
    user: userResponse(user),
  });
}

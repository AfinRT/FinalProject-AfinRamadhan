import { sendError } from "../utils/apiResponse.js";

// Memvalidasi kredensial login dan menormalkan email sebelum autentikasi.
export function validateLogin(req, res, next) {
  const { email, password } = req.body ?? {};
  const errors = [];

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    errors.push({ field: "email", message: "Email tidak valid." });
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72
  ) {
    errors.push({
      field: "password",
      message: "Password wajib memiliki panjang 8-72 karakter.",
    });
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Data yang dikirim tidak valid.", errors);
  }

  req.body.email = email.trim().toLowerCase();
  return next();
}

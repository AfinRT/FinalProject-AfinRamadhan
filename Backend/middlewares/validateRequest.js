import { validationResult } from "express-validator";
import { sendError } from "../utils/apiResponse.js";

// Mengirim daftar error validasi atau meneruskan request yang valid.
export function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true }).map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    return sendError(res, 400, "Validasi gagal.", errors);
  }
  next();
}

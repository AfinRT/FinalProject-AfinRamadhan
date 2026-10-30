import { getActiveUserRole } from "../models/userModel.js";
import { sendError } from "../utils/apiResponse.js";

// Membatasi akses route ke pengguna dengan salah satu role yang diizinkan.
export function authorizeRoles(...allowedRoles) {
  // Memastikan role pengguna masih aktif sebelum melanjutkan request.
  return async function roleAuthorization(req, res, next) {
    try {
      const role = await getActiveUserRole(Number(req.auth?.sub));
      if (!role || !allowedRoles.includes(role)) {
        return sendError(
          res,
          403,
          `Akses hanya untuk role: ${allowedRoles.join(", ")}.`,
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

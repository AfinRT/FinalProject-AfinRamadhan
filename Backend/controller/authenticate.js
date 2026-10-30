import { verifyToken } from "../auth/tokenService.js";
import { HttpError } from "../utils/HttpError.js";

// Validasi Bearer token dan simpan klaim login untuk handler berikutnya.
export function authenticate(req, res, next) {
  const match = /^Bearer\s+(.+)$/i.exec(req.get("authorization") ?? "");
  const claims = match ? verifyToken(match[1]) : null;
  if (!claims) {
    return next(new HttpError(401, "Silakan login dengan token yang valid."));
  }
  req.auth = claims;
  next();
}

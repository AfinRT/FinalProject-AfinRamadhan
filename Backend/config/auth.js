import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

// Kunci rahasia untuk menandatangani dan memeriksa token login.
export const JWT_SECRET = process.env.JWT_SECRET;

// Lama waktu token login berlaku; default-nya 6 jam.
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "6h";

// Mengembalikan secret JWT atau menghentikan proses jika konfigurasi belum ada atau tidak aman.
export function getJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET belum diatur di .env.");
  }
  if (JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET terlalu pendek! Minimal harus 32 karakter demi keamanan.");
  }
  return JWT_SECRET;
}

// Validasi saat startup agar aplikasi langsung gagal jika secret tidak aman (fail-fast).
getJwtSecret();

import { body, param } from "express-validator";
import { roleExists } from "../models/userModel.js";

// Memastikan request body berupa object JSON.
const objectRule = () =>
  body()
    .custom(
      (value) =>
        value !== null && typeof value === "object" && !Array.isArray(value),
    )
    .withMessage("Body harus berupa object JSON.");

// Membuat aturan validasi nama pengguna.
const nameRule = () =>
  body("name")
    .isString()
    .withMessage("Nama harus berupa teks.")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nama harus memiliki panjang 2 sampai 100 karakter.");

// Membuat aturan validasi dan normalisasi email pengguna.
const emailRule = (required) => {
  const rule = body("email");
  if (!required) rule.optional({ values: "false" });

  return rule
    .trim() 
    .isString()
    .withMessage("Email harus berupa teks.")
    .bail()
    .notEmpty()
    .withMessage("Email tidak boleh kosong.")
    .bail()
    .isEmail()
    .withMessage("Format email tidak valid (contoh: nama@domain.com).")
    .bail()
    .normalizeEmail({ gmail_remove_dots: false });
};

// Memastikan role ID valid dan tersedia di database.
const roleIdRule = () =>
  body("role_id")
    .isInt({ min: 1 })
    .withMessage("Role wajib dipilih dan harus valid.")
    .bail()
    .toInt()
    .bail()
    .custom(async (roleId) => {
      if (!(await roleExists(roleId))) {
        throw new Error("Role yang dipilih tidak tersedia.");
      }
      return true;
    });

// Membuat aturan validasi password, wajib saat buat akun dan opsional saat update.
const passwordRule = (required) => {
  const rule = body("password");
  if (!required) rule.optional({ values: "false" });

  return rule
    .isString()
    .withMessage("Password harus berupa teks.")
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage("Password harus memiliki panjang 8 sampai 72 karakter.")
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Password harus mengandung kombinasi huruf besar, huruf kecil, angka, dan karakter spesial (seperti @, $, !, %, *, ?, &).",
    );
};

// Membuat aturan validasi status akun (aktif atau nonaktif).
const statusRule = () =>
  body("status")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Status akun harus berupa teks.")
    .bail()
    .trim()
    .isIn(["active", "inactive"])
    .withMessage("Status akun hanya boleh 'active' atau 'inactive'.");

// Menggabungkan seluruh aturan validasi untuk pembuatan akun.
export const validateCreateUser = () => [
  objectRule(),
  nameRule(),
  emailRule(),
  passwordRule(true),
  roleIdRule(),
];

// Menggabungkan aturan validasi untuk pembaruan akun.
export const validateUpdateUser = () => [
  objectRule(),
  nameRule(),
  emailRule(),
  passwordRule(false),
  roleIdRule(),
  statusRule(),
];

// Memastikan parameter ID pengguna berupa bilangan bulat positif yang aman.
export const validateUserId = param("id")
  .custom(
    (value) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)),
  )
  .withMessage("ID pengguna harus berupa bilangan bulat positif.")
  .toInt();

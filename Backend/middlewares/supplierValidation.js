import { body, param } from "express-validator";

// Membuat aturan validasi nama supplier.
export const nameRules = () => {
  return body("name")
    .trim()
    .notEmpty()
    .withMessage("Nama wajib diisi.")
    .bail()
    .isLength({ min: 3, max: 50 })
    .withMessage("Nama harus memiliki panjang antara 3 dan 50 karakter.");
};

// Membuat aturan validasi nomor telepon supplier Indonesia.
export const phoneRules = () => {
  return body("phone")
    .trim()
    .notEmpty()
    .withMessage("Nomor telepon wajib diisi.")
    .bail()
    .isMobilePhone("id-ID")
    .withMessage("Format nomor telepon tidak valid.");
};

// Membuat aturan validasi email supplier.
export const emailRules = () => {
  return body("email")
    .trim()
    .notEmpty()
    .withMessage("Email wajib diisi.")
    .bail()
    .isEmail()
    .withMessage("Format email tidak valid.");
};

// Membuat aturan validasi alamat supplier.
export const addressRules = () => {
  return body("address").trim().notEmpty().withMessage("Alamat wajib diisi.");
};

// Menggabungkan validasi semua field wajib supplier.
export const validateSupplier = () => [
  nameRules(),
  phoneRules(),
  emailRules(),
  addressRules(),
];

// Memastikan parameter ID supplier berupa bilangan bulat positif yang aman.
export const validateId = [
  param("id")
    .custom(
      (value) =>
        /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)),
    )
    .withMessage("ID harus berupa bilangan bulat positif.")
    .toInt(),
];

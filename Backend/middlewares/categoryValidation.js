import { body, param } from "express-validator";

// Membuat aturan validasi nama kategori.
export const nameRules = () => {
  return body("name")
    .isString()
    .withMessage("Nama kategori harus berupa string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Nama kategori wajib diisi.")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Nama kategori harus memiliki panjang antara 2 dan 100 karakter.",
    );
};

// Membuat aturan validasi deskripsi kategori.
export const descriptionRules = () => {
  return body("description")
    .isString()
    .withMessage("Deskripsi harus berupa string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Deskripsi wajib diisi.")
    .bail()
    .isLength({ min: 5, max: 255 })
    .withMessage("Deskripsi harus memiliki panjang antara 5 dan 255 karakter.");
};

// Memastikan request body berupa object JSON.
const objectRule = () =>
  body()
    .custom(
      (value) =>
        value !== null && typeof value === "object" && !Array.isArray(value),
    )
    .withMessage("Body harus berupa object JSON.");

// Menggabungkan validasi bentuk body, nama, dan deskripsi kategori.
export const validateCategory = () => [
  objectRule(),
  nameRules(),
  descriptionRules(),
];

// Memastikan ID kategori pada URL berupa bilangan bulat positif yang aman.
export const validateId = param("id")
  .custom(
    (value) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)),
  )
  .withMessage("ID harus berupa bilangan bulat positif.");

import { body, param } from "express-validator";

const allowedFields = new Set([
  "category",
  "description",
  "amount",
  "payment_method",
  "expense_date",
]);

// Memastikan request body berupa object JSON.
const objectRule = () =>
  body()
    .custom(
      (value) =>
        value !== null && typeof value === "object" && !Array.isArray(value),
    )
    .withMessage("Body harus berupa object JSON.");

// Menolak field yang tidak didukung oleh endpoint pengeluaran.
const allowedFieldsRule = () =>
  body().custom((value) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return true;
    }

    const unexpectedField = Object.keys(value).find(
      (field) => !allowedFields.has(field),
    );
    if (unexpectedField) {
      throw new Error(`Field ${unexpectedField} tidak diizinkan.`);
    }

    return true;
  });

// Membuat aturan validasi kategori pengeluaran.
export const categoryRules = () =>
  body("category")
    .isString()
    .withMessage("Kategori pengeluaran harus berupa string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Kategori pengeluaran wajib diisi.")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Kategori pengeluaran harus memiliki panjang antara 2 dan 100 karakter.",
    );

// Membuat aturan validasi deskripsi pengeluaran.
export const descriptionRules = () =>
  body("description")
    .isString()
    .withMessage("Deskripsi harus berupa string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Deskripsi pengeluaran wajib diisi.")
    .bail()
    .isLength({ max: 255 })
    .withMessage("Deskripsi maksimal 255 karakter.");

// Membuat aturan validasi jumlah pengeluaran.
export const amountRules = () =>
  body("amount")
    .notEmpty()
    .withMessage("Jumlah pengeluaran wajib diisi.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage(
      "Jumlah pengeluaran (amount) harus berupa angka yang valid dan tidak boleh negatif.",
    )
    .toFloat();

// Membuat aturan validasi metode pembayaran pengeluaran.
export const paymentMethodRules = () =>
  body("payment_method")
    .optional({ values: "null" })
    .isString()
    .withMessage("Metode pembayaran harus berupa string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Metode pembayaran tidak boleh kosong.")
    .bail()
    .custom((value) => ["cash", "transfer"].includes(value.toLowerCase()))
    .withMessage("Metode pembayaran harus cash atau transfer.")
    .customSanitizer((value) => value.toLowerCase());

// Membuat aturan validasi tanggal pengeluaran.
export const expenseDateRules = () =>
  body("expense_date")
    .optional({ values: "null" })
    .isString()
    .withMessage("Tanggal pengeluaran harus berupa teks.")
    .bail()
    .trim()
    .custom((value) => {
      const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/,
      );
      if (!match) return false;

      const [, year, month, day, hour = "00", minute = "00", second = "00"] =
        match;
      const date = new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day)),
      );

      return (
        Number(year) >= 1000 &&
        date.getUTCFullYear() === Number(year) &&
        date.getUTCMonth() === Number(month) - 1 &&
        date.getUTCDate() === Number(day) &&
        Number(hour) <= 23 &&
        Number(minute) <= 59 &&
        Number(second) <= 59
      );
    })
    .withMessage(
      "Tanggal pengeluaran harus menggunakan format YYYY-MM-DD atau YYYY-MM-DD HH:mm:ss yang valid.",
    );

// Menggabungkan validasi body dan seluruh field pengeluaran.
export const validateExpense = () => [
  objectRule(),
  allowedFieldsRule(),
  categoryRules(),
  descriptionRules(),
  amountRules(),
  paymentMethodRules(),
  expenseDateRules(),
];

// Memastikan ID pengeluaran pada URL berupa bilangan bulat positif yang aman.
export const validateId = param("id")
  .custom(
    (value) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)),
  )
  .withMessage("ID harus berupa bilangan bulat positif.")
  .toInt();

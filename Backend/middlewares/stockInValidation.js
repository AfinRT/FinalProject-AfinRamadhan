import { body } from "express-validator";

const allowedFields = new Set([
  "invoice_number",
  "invoice_date",
  "box_quantity",
  "conversion_factor",
  "purchase_price",
  "exp_date",
]);

// Memastikan request body berupa object JSON.
const objectRule = () =>
  body()
    .custom(
      (value) =>
        value !== null && typeof value === "object" && !Array.isArray(value),
    )
    .withMessage("Body harus berupa object JSON.");

// Menolak field selain yang didukung oleh proses stock-in.
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

// Memvalidasi nomor faktur wajib.
const invoiceNumberRule = () =>
  body("invoice_number")
    .isString()
    .withMessage("Nomor faktur harus berupa teks.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Nomor faktur wajib diisi.")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Nomor faktur maksimal 100 karakter.");

// Memvalidasi tanggal faktur wajib dalam format YYYY-MM-DD.
const invoiceDateRule = () =>
  body("invoice_date")
    .isString()
    .withMessage("Tanggal faktur harus berupa teks.")
    .bail()
    .notEmpty()
    .withMessage("Tanggal faktur wajib diisi.")
    .bail()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("Tanggal faktur harus menggunakan format YYYY-MM-DD.");

// Memvalidasi tanggal kedaluwarsa wajib dalam format YYYY-MM-DD.
const expDateRule = () =>
  body("exp_date")
    .isString()
    .withMessage("Tanggal kedaluwarsa harus berupa teks.")
    .bail()
    .notEmpty()
    .withMessage("Tanggal kedaluwarsa wajib diisi.")
    .bail()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("Tanggal kedaluwarsa harus menggunakan format YYYY-MM-DD.");

// Memvalidasi jumlah kemasan yang masuk.
const boxQuantityRule = () =>
  body("box_quantity")
    .isInt({ min: 1 })
    .withMessage("Jumlah kemasan harus berupa bilangan bulat positif.")
    .toInt();

// Memvalidasi konversi isi kemasan ke unit dasar.
const conversionFactorRule = () =>
  body("conversion_factor")
    .isInt({ min: 1 })
    .withMessage("Isi per kemasan harus berupa bilangan bulat positif.")
    .toInt();

// Memvalidasi total modal faktur untuk batch yang diterima.
const purchasePriceRule = () =>
  body("purchase_price")
    .isFloat({ min: 0.01 })
    .withMessage("Total modal faktur harus lebih besar dari 0.")
    .toFloat();

// Menggabungkan validasi body dan seluruh field stock-in.
export const validateStockIn = () => [
  objectRule(),
  allowedFieldsRule(),
  invoiceNumberRule(),
  invoiceDateRule(),
  boxQuantityRule(),
  conversionFactorRule(),
  purchasePriceRule(),
  expDateRule(),
];

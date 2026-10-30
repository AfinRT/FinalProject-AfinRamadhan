import { body } from "express-validator";

const requiredFields = [
  "invoice_number",
  "invoice_date",
  "quantity_received",
  "quantity_remaining",
  "exp_date",
  "unit_cost",
];
const allowedFields = new Set(requiredFields);

// Memastikan request body berupa object JSON dan seluruh field batch dikirim.
const objectRule = () =>
  body().custom((value) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Body harus berupa object JSON.");
    }

    const missingField = requiredFields.find(
      (field) => !Object.hasOwn(value, field),
    );
    if (missingField) {
      throw new Error(`Field ${missingField} wajib diisi.`);
    }

    const unexpectedField = Object.keys(value).find(
      (field) => !allowedFields.has(field),
    );
    if (unexpectedField) {
      throw new Error(`Field ${unexpectedField} tidak diizinkan.`);
    }

    return true;
  });

// Memvalidasi nomor faktur; null diperbolehkan jika batch tidak memiliki nomor.
const invoiceNumberRule = () =>
  body("invoice_number")
    .optional({ values: "null" })
    .isString()
    .withMessage("Nomor faktur harus berupa teks.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Nomor faktur tidak boleh kosong.")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Nomor faktur maksimal 100 karakter.");

// Memvalidasi tanggal opsional dalam format YYYY-MM-DD.
const dateRule = (field, label) =>
  body(field)
    .optional({ values: "null" })
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage(`${label} harus menggunakan format YYYY-MM-DD yang valid.`);

// Memvalidasi jumlah barang dalam batch.
const quantityRule = (field, label) =>
  body(field)
    .notEmpty()
    .withMessage(`${label} wajib diisi.`)
    .bail()
    .isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })
    .withMessage(`${label} harus berupa bilangan bulat non-negatif.`)
    .toInt();

// Memvalidasi harga modal per unit.
const unitCostRule = () =>
  body("unit_cost")
    .notEmpty()
    .withMessage("Harga modal per unit wajib diisi.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Harga modal per unit harus berupa angka non-negatif.")
    .toFloat();

// Memastikan sisa stok tidak melebihi jumlah stok yang diterima.
const remainingQuantityRule = () =>
  body("quantity_remaining").custom((value, { req }) => {
    const received = Number(req.body?.quantity_received);
    const remaining = Number(value);
    if (
      Number.isFinite(received) &&
      Number.isFinite(remaining) &&
      remaining > received
    ) {
      throw new Error("Sisa stok tidak boleh lebih besar dari stok diterima.");
    }
    return true;
  });

export const validateProductBatch = () => [
  objectRule(),
  invoiceNumberRule(),
  dateRule("invoice_date", "Tanggal faktur"),
  quantityRule("quantity_received", "Stok diterima"),
  quantityRule("quantity_remaining", "Sisa stok"),
  remainingQuantityRule(),
  dateRule("exp_date", "Tanggal kedaluwarsa"),
  unitCostRule(),
];

import { body, param } from "express-validator";

// Memvalidasi item, diskon, pembayaran, metode bayar, dan duplikasi produk.
export const validateSale = () => [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Daftar item penjualan wajib diisi sebagai array."),
  body("items.*.product_id")
    .isInt({ min: 1 })
    .withMessage("ID produk harus berupa bilangan bulat positif.")
    .toInt(),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Jumlah item harus berupa bilangan bulat positif.")
    .toInt(),
  body("items.*.unit_id")
    .optional({ values: "null" })
    .isInt({ min: 1 })
    .withMessage("Unit produk tidak valid.")
    .toInt(),
  body("items.*.discount")
    .optional({ values: "null" })
    .isFloat({ min: 0 })
    .withMessage("Diskon item harus berupa angka non-negatif.")
    .toFloat(),
  body("items").custom((items) => {
    if (!Array.isArray(items)) return true;
    const productIds = items.map(
      (item) => `${item?.product_id}-${item?.unit_id ?? "base"}`,
    );
    if (new Set(productIds).size !== productIds.length) {
      throw new Error(
        "Item dengan produk dan satuan yang sama tidak boleh muncul lebih dari sekali.",
      );
    }
    return true;
  }),
  body("discount")
    .optional({ values: "null" })
    .isFloat({ min: 0 })
    .withMessage("Diskon transaksi harus berupa angka non-negatif.")
    .toFloat(),
  body("paid_amount")
    .notEmpty()
    .withMessage("Jumlah pembayaran wajib diisi.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Jumlah pembayaran harus berupa angka non-negatif.")
    .toFloat(),
  body("payment_method")
    .isString()
    .withMessage("Metode pembayaran harus berupa teks.")
    .bail()
    .trim()
    .custom((value) =>
      ["cash", "transfer", "qris"].includes(value.toLowerCase()),
    )
    .withMessage("Metode pembayaran harus cash, transfer, atau qris.")
    .customSanitizer((value) => value.toLowerCase()),
];

// Memastikan parameter ID penjualan berupa bilangan bulat positif yang aman.
export const validateSaleId = [
  param("id")
    .custom(
      (value) =>
        /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)),
    )
    .withMessage("ID penjualan harus berupa bilangan bulat positif.")
    .toInt(),
];

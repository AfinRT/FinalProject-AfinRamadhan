import { body, param } from "express-validator";

function requiredSaleUnitNames(baseUnit) {
  const normalizedUnit = String(baseUnit ?? "")
    .trim()
    .toLowerCase();
  if (normalizedUnit === "tablet") return ["strip", "box"];
  if (normalizedUnit === "kapsul" || normalizedUnit === "strip") {
    return ["box"];
  }
  return [];
}

// Membuat aturan validasi barcode produk.
export const barcodeRules = () => {
  return body("barcode")
    .isString()
    .withMessage("Barcode harus berupa string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Barcode tidak boleh kosong.")
    .bail()
    .isLength({ min: 3, max: 50 })
    .withMessage("Barcode harus memiliki panjang antara 3 dan 50 karakter.");
};

// Membuat aturan validasi nama produk.
export const nameRules = () => {
  return body("name")
    .isString()
    .withMessage("Nama harus berupa string/teks.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Nama tidak boleh kosong.")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nama harus memiliki panjang antara 2 dan 100 karakter.");
};

// Membuat aturan validasi unit produk yang didukung aplikasi.
export const unitRules = () => {
  return body("unit")
    .isString()
    .withMessage("Unit harus berupa string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Unit pilihan harus dipilih, tidak boleh kosong.")
    .bail()
    .isIn(["Pcs", "Botol", "Strip", "Box", "Tablet", "Kaplet", "Kapsul"])
    .withMessage("Unit yang dipilih tidak valid atau tidak terdaftar.");
};

// Membuat aturan validasi harga beli produk.
export const purchasePriceRules = () => {
  return body("purchase_price")
    .notEmpty()
    .withMessage("Harga beli wajib diisi.")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Harga beli harus berupa angka dan tidak boleh minus.")
    .toFloat();
};

// Membuat aturan validasi stok awal produk.
export const stockRules = () => {
  return body("stock")
    .notEmpty()
    .withMessage("Stok wajib diisi.")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Stok harus berupa angka bulat dan tidak boleh minus.")
    .toInt();
};

// Membuat aturan validasi batas stok minimum.
export const minStockRules = () => {
  return body("min_stock")
    .notEmpty()
    .withMessage("Stok minimum wajib diisi.")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Stok minimum harus berupa angka bulat dan tidak boleh minus.")
    .toInt();
};

// Membuat aturan validasi nomor faktur pembelian.
export const invoiceNumberRules = () =>
  body("invoice_number")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Nomor faktur harus berupa teks.")
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Nomor faktur maksimal 100 karakter.");

// Membuat aturan validasi tanggal faktur pembelian.
export const invoiceDateRules = () =>
  body("invoice_date")
    .optional({ values: "falsy" })
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("Tanggal faktur harus menggunakan format YYYY-MM-DD.");

// Membuat aturan validasi tanggal kedaluwarsa dalam format ISO.
export const expDateRules = () =>
  body("exp_date")
    .optional({ values: "falsy" })
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("Tanggal kedaluwarsa harus menggunakan format YYYY-MM-DD.");

// Membuat aturan validasi ID kategori.
export const categoryIdRules = () => {
  return body("category_id")
    .notEmpty()
    .withMessage("Kategori wajib dipilih.")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Pilihan kategori tidak valid.")
    .toInt();
};

// Membuat aturan validasi ID supplier.
export const supplierIdRules = () => {
  return body("supplier_id")
    .notEmpty()
    .withMessage("Supplier wajib dipilih.")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Pilihan supplier tidak valid.")
    .toInt();
};

// Menggabungkan seluruh aturan validasi untuk pembuatan atau penggantian produk.
export const validateProduct = () => [
  barcodeRules(),
  nameRules(),
  unitRules(),
  purchasePriceRules(),
  stockRules(),
  minStockRules(),
  expDateRules(),
  invoiceDateRules(),
  categoryIdRules(),
  supplierIdRules(),
  invoiceNumberRules(),
  body("sale_units")
    .optional()
    .isArray()
    .withMessage("Daftar satuan jual harus berupa array."),
  body("sale_units.*.unit_name")
    .isString()
    .withMessage("Nama satuan jual harus berupa teks.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Nama satuan jual tidak boleh kosong.")
    .bail()
    .isLength({ max: 30 })
    .withMessage("Nama satuan jual maksimal 30 karakter."),
  body("sale_units.*.base_quantity")
    .isInt({ min: 1 })
    .withMessage("Konversi satuan harus berupa bilangan bulat positif.")
    .toInt(),
  body("sale_units").custom((saleUnits, { req }) => {
    const units = Array.isArray(saleUnits) ? saleUnits : [];
    const requiredUnits = requiredSaleUnitNames(req.body.unit);
    const names = units.map((saleUnit) =>
      String(saleUnit?.unit_name ?? "")
        .trim()
        .toLowerCase(),
    );

    for (const requiredUnit of requiredUnits) {
      if (!names.includes(requiredUnit)) {
        throw new Error(
          `Satuan jual ${requiredUnit} wajib tersedia untuk ${req.body.unit}.`,
        );
      }
    }

    if (names.some((name) => !requiredUnits.includes(name))) {
      throw new Error(
        `Satuan jual untuk ${req.body.unit} hanya boleh: ${requiredUnits.join(", ") || "satuan dasar"}.`,
      );
    }

    if (new Set(names).size !== names.length) {
      throw new Error("Nama satuan jual tidak boleh duplikat.");
    }

    if (
      names.includes(
        String(req.body.unit ?? "")
          .trim()
          .toLowerCase(),
      )
    ) {
      throw new Error("Nama satuan jual tidak boleh duplikat.");
    }
    return true;
  }),
];

// Memastikan parameter ID produk berupa bilangan bulat positif yang aman.
export const validateId = [
  param("id")
    .custom(
      (value) =>
        /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)),
    )
    .withMessage("ID harus berupa bilangan bulat positif.")
    .toInt(),
];

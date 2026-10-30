// Berisi perhitungan produk/unit kasir, termasuk pengelompokan varian dan alokasi stok.
export const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

// Memformat tanggal kedaluwarsa menjadi format yang mudah dibaca (contoh: 25 Des 2026).
export function formatExpDate(value) {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// Menghitung status dan sisa hari menjelang kedaluwarsa untuk memicu peringatan/trigger.
export function getExpInfo(expDateString) {
  if (!expDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(String(expDateString).replace(" ", "T"));
  expDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(expDate.getTime())) return null;

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = formatExpDate(expDateString);

  return {
    formattedDate,
    diffDays,
    isExpired: diffDays < 0,
    isToday: diffDays === 0,
    isNearExp: diffDays <= 30,
  };
}

// Menormalkan pilihan unit jual produk dan memastikan unit dasar selalu tersedia.
function getProductSaleUnits(product) {
  const units = (Array.isArray(product.sale_units) ? product.sale_units : [])
    .filter((unit) => Number(unit.base_quantity) > 0)
    .map((unit) => ({
      ...unit,
      base_quantity: Number(unit.base_quantity),
      key: `${String(unit.unit_name).trim().toLocaleLowerCase()}:${Number(unit.base_quantity)}`,
    }));
  const baseUnit = String(product.unit || "unit").trim();

  if (
    !units.some(
      (unit) =>
        unit.is_base_unit ||
        (unit.base_quantity === 1 &&
          unit.unit_name.trim().toLocaleLowerCase() ===
            baseUnit.toLocaleLowerCase()),
    )
  ) {
    units.unshift({
      id: null,
      unit_name: baseUnit,
      base_quantity: 1,
      is_base_unit: true,
      key: `${baseUnit.toLocaleLowerCase()}:1`,
    });
  }

  return units;
}

// Mencari metadata unit tertentu berdasarkan kunci yang dipilih.
function getProductUnit(product, selectedUnitKey) {
  return getProductSaleUnits(product).find(
    (unit) => unit.key === selectedUnitKey,
  );
}

// Menggabungkan produk setara dan mengumpulkan pilihan unit dari seluruh varian aktifnya (> 30 hari).
export function groupProducts(products) {
  const groups = new Map();

  for (const product of products) {
    const key = JSON.stringify([
      String(product.name ?? "")
        .trim()
        .toLocaleLowerCase(),
      String(product.barcode ?? "").trim(),
      String(product.unit ?? "")
        .trim()
        .toLocaleLowerCase(),
    ]);
    const group = groups.get(key);

    const productStock = Number(product.stock) || 0;
    const batchCount =
      Number(product.active_batch_count) || (productStock > 0 ? 1 : 0);
    const criticalCount = Number(product.critical_batch_count || 0);

    if (group) {
      group.variants.push(product);
      group.stock += productStock;
      group.activeBatchCount += batchCount;
      group.criticalBatchCount += criticalCount;

      // Ambil tanggal exp aktif terdekat (FEFO) dari varian yang memiliki stok aktif (> 30 hari)
      if (productStock > 0 && product.exp_date && product.has_active_batch !== false) {
        if (!group.exp_date || new Date(product.exp_date) < new Date(group.exp_date)) {
          group.exp_date = product.exp_date;
        }
      }

      // Simpan tanggal batch kritis terdekat
      if (product.critical_exp_date) {
        if (
          !group.criticalExpDate ||
          new Date(product.critical_exp_date) < new Date(group.criticalExpDate)
        ) {
          group.criticalExpDate = product.critical_exp_date;
        }
      }
    } else {
      groups.set(key, {
        id: key,
        name: product.name,
        barcode: product.barcode,
        unit: product.unit,
        selling_price: Number(product.selling_price),
        stock: productStock,
        activeBatchCount: batchCount,
        criticalBatchCount: criticalCount,
        criticalExpDate: product.critical_exp_date || null,
        exp_date: product.exp_date ?? null,
        hasActiveBatch: product.has_active_batch ?? (productStock > 0),
        variants: [product],
      });
    }
  }

  return [...groups.values()].map((group) => {
    const units = new Map();
    for (const variant of group.variants) {
      for (const unit of getProductSaleUnits(variant)) {
        if (!units.has(unit.key)) units.set(unit.key, unit);
      }
    }

    group.saleUnits = [...units.values()];
    return group;
  });
}

// Memilih unit dasar sebagai pilihan awal, atau unit pertama jika unit dasar tidak ada.
export function getDefaultUnitKey(productGroup) {
  return (
    productGroup.saleUnits.find((unit) => unit.is_base_unit)?.key ??
    productGroup.saleUnits[0]?.key
  );
}

// Menghitung stok yang dapat dijual dalam unit pilihan dari semua varian produk (> 30 hari).
export function getAvailableQuantity(productGroup, selectedUnitKey) {
  return productGroup.variants.reduce((total, product) => {
    const unit = getProductUnit(product, selectedUnitKey);
    return unit
      ? total + Math.floor((Number(product.stock) || 0) / unit.base_quantity)
      : total;
  }, 0);
}

// Membagi jumlah pesanan ke varian-varian aktif yang memiliki stok sesuai urutan FEFO (> 30 hari).
export function allocateQuantity(productGroup, quantity, selectedUnitKey) {
  let remaining = quantity;
  const allocations = [];

  // Urutkan varian yang memiliki stok aktif berdasarkan tanggal kedaluwarsa terdekat (FEFO > 30 hari)
  const activeVariants = [...productGroup.variants]
    .filter((product) => (Number(product.stock) || 0) > 0)
    .sort((a, b) => {
      if (!a.exp_date) return 1;
      if (!b.exp_date) return -1;
      return new Date(a.exp_date) - new Date(b.exp_date);
    });

  for (const product of activeVariants) {
    if (remaining <= 0) break;
    const unit = getProductUnit(product, selectedUnitKey);
    if (!unit) continue;
    const available = Math.floor(
      (Number(product.stock) || 0) / unit.base_quantity,
    );
    const allocated = Math.min(remaining, available);
    if (allocated > 0) {
      allocations.push({
        product_id: product.id,
        quantity: allocated,
        unit_id: unit.id ?? undefined,
      });
      remaining -= allocated;
    }
  }

  return allocations;
}

// Menghitung total baris keranjang dengan mempertimbangkan konversi unit dan varian.
export function getLineTotal(productGroup, quantity, selectedUnitKey) {
  return allocateQuantity(productGroup, quantity, selectedUnitKey).reduce(
    (total, allocation) => {
      const product = productGroup.variants.find(
        (variant) => variant.id === allocation.product_id,
      );
      const unit = getProductUnit(product, selectedUnitKey);
      return (
        total +
        allocation.quantity * unit.base_quantity * Number(product.selling_price)
      );
    },
    0,
  );
}

// Membentuk label harga tunggal atau rentang harga untuk unit penjualan tertentu.
export function getPriceLabel(
  productGroup,
  selectedUnitKey = getDefaultUnitKey(productGroup),
) {
  const prices = [
    ...new Set(
      productGroup.variants.flatMap((product) => {
        const unit = getProductUnit(product, selectedUnitKey);
        return unit ? [Number(product.selling_price) * unit.base_quantity] : [];
      }),
    ),
  ].sort((left, right) => left - right);

  if (prices.length === 0) return "-";
  if (prices.length === 1) return currency.format(prices[0]);
  return `${currency.format(prices[0])}–${currency.format(prices.at(-1))}`;
}

// Memformat nominal rupiah tanpa angka pecahan untuk tampilan ringkas kasir.
export function formatMoney(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

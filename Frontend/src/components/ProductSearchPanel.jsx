// Mencari produk berdasarkan nama atau barcode lalu menampilkan hasil untuk dimasukkan ke keranjang.
import Button from "./Button.jsx";
import { AlertTriangle, PackageSearch, Plus, ShoppingCart } from "lucide-react";
import FilterField from "./FilterField.jsx";
import { getExpInfo } from "../utils/kasirProducts.js";

export default function ProductSearchPanel({
  search,
  onSearchChange,
  searchInputRef,
  loadingProducts,
  products,
  getPriceLabel,
  onAddProduct,
}) {
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">Produk</h2>
          <p className="mt-1 text-xs text-slate-500">
            Cari berdasarkan nama produk atau barcode.
          </p>
        </div>
        <ShoppingCart className="size-5 text-blue-600" aria-hidden="true" />
      </div>

      <FilterField
        ariaLabel="Cari produk berdasarkan nama atau barcode"
        inputRef={searchInputRef}
        onChange={onSearchChange}
        placeholder="Cari nama atau barcode produk..."
        value={search}
        wrapperClassName="relative block"
        controlClassName="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />

      <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white">
        {!search.trim() ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500">
            Ketik nama produk atau barcode untuk mulai mencari.
          </div>
        ) : loadingProducts ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Memuat produk...
          </p>
        ) : products.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <PackageSearch className="mx-auto size-7 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">
              Produk tidak ditemukan.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {products.slice(0, 12).map((product) => {
              const salableStock = Number(product.stock) || 0;
              const activeExpInfo = getExpInfo(product.exp_date);
              const fallbackCriticalDate =
                product.criticalExpDate ||
                (activeExpInfo?.isNearExp || activeExpInfo?.isExpired
                  ? product.exp_date
                  : null);
              const hasCritical =
                Number(product.criticalBatchCount) > 0 ||
                (salableStock <= 0 && Boolean(fallbackCriticalDate));
              const criticalInfo = getExpInfo(fallbackCriticalDate);

              const isCriticalWithNewBatch = salableStock > 0 && hasCritical;
              const isAllCriticalOrExpired = salableStock <= 0 && hasCritical;

              return (
                <li
                  key={product.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 transition ${
                    isAllCriticalOrExpired
                      ? "bg-red-50/50 hover:bg-red-50"
                      : isCriticalWithNewBatch
                        ? "bg-amber-50/40 hover:bg-amber-50/70"
                        : "hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {product.name}
                      </p>
                      {isCriticalWithNewBatch && (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold border border-amber-300 bg-amber-100 text-amber-800"
                          title={`Terdapat batch yang ${criticalInfo?.isExpired ? "sudah kedaluwarsa" : "mendekati kedaluwarsa"} (${criticalInfo?.formattedDate}${!criticalInfo?.isExpired && criticalInfo?.diffDays !== undefined ? ` · ${criticalInfo?.diffDays} hari lagi` : ""}). Sistem otomatis mengarahkan ke batch baru.`}
                        >
                          <AlertTriangle
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                          Ada Batch Akan Exp {criticalInfo?.formattedDate}
                        </span>
                      )}
                      {isAllCriticalOrExpired && (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold border border-red-300 bg-red-100 text-red-700"
                          title="Semua batch obat ini berada dalam masa kritis (<= 30 hari) atau sudah kedaluwarsa, dilarang dijual."
                        >
                          <AlertTriangle
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                          {criticalInfo?.isExpired
                            ? `Kedaluwarsa: Exp ${criticalInfo?.formattedDate} (Dilarang Jual)`
                            : `Kritis ≤ 30 Hari: Exp ${criticalInfo?.formattedDate || "-"} (Dilarang Jual)`}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-y-0.5 text-xs text-slate-500">
                      <span>
                        {getPriceLabel(product)} / {product.unit || "unit"}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span
                        className={
                          salableStock < 1 ? "font-medium text-red-600" : ""
                        }
                      >
                        Stok layak jual: {salableStock}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => onAddProduct(product)}
                    disabled={salableStock < 1}
                    aria-label={`Tambah ${product.name}`}
                    title={
                      salableStock < 1
                        ? hasCritical && criticalInfo?.isExpired
                          ? "Obat sudah kedaluwarsa, dilarang dijual"
                          : "Obat tidak memiliki stok yang layak jual (> 30 hari)"
                        : `Tambah ${product.name}`
                    }
                    className={`ghost-action-button ${
                      salableStock < 1
                        ? "text-slate-300 hover:bg-transparent cursor-not-allowed"
                        : isCriticalWithNewBatch
                          ? "text-amber-700 hover:bg-amber-100"
                          : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

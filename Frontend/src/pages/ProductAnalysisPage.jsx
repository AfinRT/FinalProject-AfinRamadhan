// Menampilkan laporan analisis penjualan produk (peringkat produk terlaris/tersedikit), rentang bulan, dan paginasi.
import { Package, RefreshCw } from "lucide-react";
import Button from "../components/Button.jsx";
import FilterField from "../components/FilterField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Pagination from "../components/Pagination.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useProductAnalysis from "../hooks/useProductAnalysis.js";

const columns = [
  { key: "product", label: "Nama Produk" },
  { key: "category", label: "Kategori" },
  { key: "supplier", label: "Distributor" },
  { key: "quantity", label: "Jumlah terjual", align: "center" },
  { key: "unit", label: "Satuan", align: "center" },
  { key: "status", label: "Status", align: "center" },
];

export default function ProductAnalysisPage() {
  const {
    month,
    defaultMonth,
    handleMonthChange,
    sortOrder,
    handleSortOrderChange,
    search,
    handleSearchChange,
    loading,
    error,
    setCurrentPage,
    activePage,
    totalPages,
    firstVisible,
    lastVisible,
    pageSize,
    totalFilteredCount,
    pageProducts,
    hasActiveFilters,
    resetFilters,
    refreshProductAnalysis,
    quantityFormatter,
  } = useProductAnalysis();

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Laporan penjualan"
        title="Analisis Produk Terjual"
        description="Bandingkan jumlah unit yang terjual untuk setiap produk dalam periode pilihan."
      />

      {error && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={refreshProductAnalysis}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} /> Coba lagi
          </Button>
        </div>
      )}

      <section className="mt-6" aria-label="Analisis jumlah produk terjual">
        <FilterField
          type="group"
          className="flex flex-wrap items-end gap-3 border-b border-slate-200 pb-5"
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
        >
          <FilterField
            label="Cari produk"
            onChange={handleSearchChange}
            placeholder="Nama produk atau barcode"
            value={search}
          />
          <FilterField
            label="Bulan"
            max={defaultMonth}
            onChange={handleMonthChange}
            type="month"
            value={month}
            wrapperClassName="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-600"
            required
          />
          <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-600">
            Urutkan jumlah
            <select
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              onChange={(event) => handleSortOrderChange(event.target.value)}
              value={sortOrder}
            >
              <option value="DESC">Terbanyak</option>
              <option value="ASC">Tersedikit</option>
            </select>
          </label>
        </FilterField>

        <div className="table-shell mt-5">
          <div className="table-scroll">
            <table className="data-table-crud">
              <TableHeader columns={columns} />
              <TableBody
                loading={loading}
                data={pageProducts}
                columnsCount={columns.length}
                loadingText="Memuat analisis produk..."
                emptyText={
                  <>
                    <Package aria-hidden="true" className="empty-state-icon" />
                    <p className="data-table-empty-title">
                      {search
                        ? "Produk tidak ditemukan"
                        : "Belum ada produk terjual pada periode ini"}
                    </p>
                    <p className="data-table-empty-description">
                      {search
                        ? "Coba kata pencarian yang lain."
                        : "Pilih rentang tanggal lain untuk melihat laporan penjualan."}
                    </p>
                  </>
                }
                renderRow={(product) => (
                  <tr className="data-table-row" key={product.product_id}>
                    <td className="data-table-cell">
                      <p className="font-semibold text-slate-800">
                        {product.product_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.barcode || "Tanpa barcode"}
                      </p>
                    </td>
                    <td className="data-table-cell text-slate-600">
                      {product.category_name || "-"}
                    </td>
                    <td className="data-table-cell text-slate-600">
                      {product.supplier_name || "-"}
                    </td>
                    <td className="data-table-cell text-center font-semibold text-slate-800">
                      {quantityFormatter.format(
                        Number(product.quantity_sold) || 0,
                      )}
                    </td>
                    <td className="data-table-cell text-center text-slate-600">
                      {product.satuan_terkecil || "-"}
                    </td>
                    <td className="data-table-cell text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${product.popularity_status === "Laris" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {product.popularity_status}
                      </span>
                    </td>
                  </tr>
                )}
              />
            </table>
          </div>
          <footer className="data-table-footer">
            <span>
              {loading
                ? " "
                : `Menampilkan ${firstVisible}–${lastVisible} dari ${totalFilteredCount} produk`}
            </span>
            {totalFilteredCount > pageSize && (
              <Pagination
                activePage={activePage}
                onPageChange={setCurrentPage}
                totalPages={totalPages}
              />
            )}
          </footer>
        </div>
      </section>
    </main>
  );
}

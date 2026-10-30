// Menampilkan daftar produk kedaluwarsa atau mendekati kedaluwarsa, pemfilteran, dan paginasi.
import { AlertTriangle, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import Pagination from "../components/Pagination.jsx";
import FilterField from "../components/FilterField.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useExpired from "../hooks/useExpired.js";

const expiredColumns = [
  { key: "product", label: "Nama produk" },
  { key: "supplier", label: "Pemasok" },
  { key: "expiredDate", label: "Tanggal kedaluwarsa", align: "center" },
  { key: "daysUntilExpiration", label: "Sisa Waktu", align: "center" },
  { key: "status", label: "Status", align: "center" },
];

export default function ExpiredPage() {
  const {
    suppliers,
    supplierNames,
    loading,
    error,
    productSearch,
    handleProductSearchChange,
    supplierFilter,
    handleSupplierFilterChange,
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
    refreshExpired,
    formatSaleDate,
    daysRemaining,
  } = useExpired();

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Pemantauan persediaan"
        title="Produk Kedaluwarsa"
        description="Pantau produk yang sudah kedaluwarsa atau mendekati tanggal kedaluwarsa."
      />

      {error && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={refreshExpired}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} /> Coba lagi
          </Button>
        </div>
      )}

      <section className="mt-6" aria-label="Daftar produk dengan status kedaluwarsa">
        <FilterField
          type="group"
          className="crud-filter-bar"
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
        >
          <FilterField
            label="Cari produk"
            onChange={handleProductSearchChange}
            placeholder="Cari nama atau barcode"
            value={productSearch}
          />
          <FilterField
            emptyOption="Semua pemasok"
            label="Pemasok"
            onChange={handleSupplierFilterChange}
            options={suppliers.map((supplier) => ({
              value: supplier.id,
              label: supplier.name,
            }))}
            type="select"
            value={supplierFilter}
          />
        </FilterField>

        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table-crud">
              <TableHeader columns={expiredColumns} />
              <TableBody
                loading={loading}
                data={pageProducts}
                columnsCount={expiredColumns.length}
                loadingText="Memuat data kedaluwarsa..."
                emptyText={
                  <>
                    <AlertTriangle
                      aria-hidden="true"
                      className="empty-state-icon"
                    />
                    <p className="data-table-empty-title">
                      {hasActiveFilters
                        ? "Produk tidak ditemukan"
                        : "Tidak ada produk kedaluwarsa"}
                    </p>
                    <p className="data-table-empty-description">
                      {hasActiveFilters
                        ? "Coba ubah filter pencarian."
                        : "Semua produk belum ada yang mendekati tanggal kedaluwarsa."}
                    </p>
                  </>
                }
                renderRow={(product) => {
                  const supplierName =
                    supplierNames.get(String(product.supplier_id)) || "-";

                  return (
                    <tr className="data-table-row" key={product.id}>
                      <td className="data-table-cell">
                        <p className="font-semibold text-slate-800">
                          {product.product_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {product.barcode || "Tanpa barcode"}
                        </p>
                      </td>
                      <td className="data-table-cell text-slate-600">
                        {supplierName}
                      </td>
                      <td className="data-table-cell text-slate-600 text-center">
                        {formatSaleDate(product.exp_date)}
                      </td>
                      <td className="data-table-cell text-slate-600 text-center">
                        {daysRemaining(product.exp_date)}
                      </td>
                      <td className="data-table-cell text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${product.status === "Mendekati kedaluwarsa" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}
                        >
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  );
                }}
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

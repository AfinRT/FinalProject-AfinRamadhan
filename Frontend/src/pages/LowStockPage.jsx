// Menampilkan daftar produk dengan stok menipis atau habis, beserta pemfilteran dan paginasi.
import { AlertTriangle, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import Pagination from "../components/Pagination.jsx";
import FilterField from "../components/FilterField.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useLowStock from "../hooks/useLowStock.js";

const lowStockColumns = [
  { key: "product", label: "Nama produk" },
  { key: "supplier", label: "Pemasok" },
  { key: "status", label: "Status", align: "center" },
  { key: "currentStock", label: "Total stok", align: "center" },
  { key: "minStock", label: "Batas minimum", align: "center" },
];

export default function LowStockPage() {
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
    refreshLowStock,
  } = useLowStock();

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Pemantauan persediaan"
        title="Stok Menipis"
        description="Pantau produk yang jumlah stoknya sudah mencapai batas minimum."
      />

      {error && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={refreshLowStock}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} /> Coba lagi
          </Button>
        </div>
      )}

      <section className="mt-6" aria-label="Daftar produk dengan stok menipis">
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
              <TableHeader columns={lowStockColumns} />
              <TableBody
                loading={loading}
                data={pageProducts}
                columnsCount={lowStockColumns.length}
                loadingText="Memuat data stok..."
                emptyText={
                  <>
                    <AlertTriangle
                      aria-hidden="true"
                      className="empty-state-icon"
                    />
                    <p className="data-table-empty-title">
                      {hasActiveFilters
                        ? "Produk tidak ditemukan"
                        : "Tidak ada stok menipis"}
                    </p>
                    <p className="data-table-empty-description">
                      {hasActiveFilters
                        ? "Coba ubah filter pencarian."
                        : "Semua produk masih berada di atas batas stok minimum."}
                    </p>
                  </>
                }
                renderRow={(product) => {
                  const stock = Number(product.stock) || 0;
                  const minStock = Number(product.min_stock) || 0;
                  const supplierName =
                    supplierNames.get(String(product.supplier_id)) || "-";

                  return (
                    <tr className="data-table-row" key={product.id}>
                      <td className="data-table-cell">
                        <p className="font-semibold text-slate-800">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {product.barcode || "Tanpa barcode"}
                        </p>
                      </td>
                      <td className="data-table-cell text-slate-600">
                        {supplierName}
                      </td>
                      <td className="data-table-cell text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stock <= 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {stock <= 0 ? "Habis" : "Menipis"}
                        </span>
                      </td>
                      <td
                        className={`data-table-cell text-center font-semibold  ${stock < minStock ? "text-red-700" : " text-slate-800"}`}
                      >
                        {stock}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          {product.unit || ""}
                        </span>
                      </td>
                      <td className="data-table-cell text-center text-slate-600">
                        {minStock}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          {product.unit || ""}
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

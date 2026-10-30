// Menampilkan riwayat invoice pembelian per pemasok, pemfilteran, paginasi, dan detail modal invoice.
import { Building2, Eye, Package, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button.jsx";
import DetailModal from "../components/DetailModal.jsx";
import Pagination from "../components/Pagination.jsx";
import FilterField from "../components/FilterField.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useOrderHistory from "../hooks/useOrderHistory.js";

const orderColumns = [
  { key: "invoice", label: "Invoice" },
  { key: "supplier", label: "Pemasok" },
  { key: "invoiceDate", label: "Tanggal Invoice" },
  { key: "items", label: "Item", align: "right" },
  { key: "total", label: "Total", align: "right" },
  { key: "actions", label: "Aksi", align: "right" },
];

const orderDetailColumns = [
  { key: "product", label: "Produk" },
  { key: "quantity", label: "Jumlah", align: "right" },
  { key: "unitCost", label: "Harga satuan", align: "right" },
  { key: "subtotal", label: "Subtotal", align: "right" },
  { key: "expiration", label: "Kedaluwarsa" },
];

export default function OrderHistoryPage() {
  const {
    suppliers,
    loading,
    error,
    productSearch,
    handleProductSearchChange,
    supplierFilter,
    handleSupplierFilterChange,
    invoiceDate,
    handleInvoiceDateChange,
    setCurrentPage,
    activePage,
    totalPages,
    firstVisible,
    lastVisible,
    pageSize,
    totalFilteredCount,
    pageOrders,
    hasActiveFilters,
    selectedOrder,
    detailLoading,
    detailError,
    resetFilters,
    refreshOrderHistory,
    openOrderDetails,
    closeOrderDetails,
    formatDate,
    currency,
  } = useOrderHistory();

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Riwayat transaksi"
        title="Pembelian Pemasok"
        description="Pantau invoice dan barang yang diterima dari setiap pemasok."
      />

      {error && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={refreshOrderHistory}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} /> Coba lagi
          </Button>
        </div>
      )}

      <section className="mt-6" aria-label="Daftar riwayat pembelian">
        <FilterField
          type="group"
          className="flex flex-wrap items-center gap-4 border-b border-slate-200 pb-4"
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
        >
          <FilterField
            label="Nama obat"
            onChange={handleProductSearchChange}
            placeholder="Cari nama obat..."
            value={productSearch}
          />
          <FilterField
            emptyOption="Semua pemasok"
            label="Distributor"
            onChange={handleSupplierFilterChange}
            options={suppliers.map((supplier) => ({
              value: supplier.id,
              label: supplier.name,
            }))}
            type="select"
            value={supplierFilter}
          />
          <FilterField
            ariaLabel="Tanggal invoice"
            label="Tanggal invoice"
            onChange={handleInvoiceDateChange}
            type="date"
            value={invoiceDate}
            wrapperClassName="grid min-w-0 gap-1 text-[11px] font-medium text-slate-500"
          />
        </FilterField>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="table-scroll">
            <table className="data-table min-w-190 border-collapse">
              <TableHeader columns={orderColumns} />
              <TableBody
                loading={loading}
                data={pageOrders}
                columnsCount={orderColumns.length}
                loadingText="Memuat riwayat pembelian..."
                emptyText={
                  <>
                    <Building2
                      aria-hidden="true"
                      className="mx-auto mb-2 size-6 text-slate-400"
                    />
                    <p className="font-medium text-slate-700">
                      {hasActiveFilters
                        ? "Riwayat tidak ditemukan"
                        : "Belum ada riwayat pembelian"}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {hasActiveFilters
                        ? "Coba kata pencarian yang lain."
                        : "Invoice pembelian akan muncul setelah barang diterima."}
                    </p>
                  </>
                }
                renderRow={(order, index) => (
                  <tr
                    className="data-table-row"
                    key={`${order.supplier_id}-${order.invoice_number || "no-invoice"}-${order.invoice_date}-${index}`}
                  >
                    <td className="data-table-cell whitespace-nowrap font-semibold text-slate-800">
                      {order.invoice_number || "Tanpa invoice"}
                    </td>
                    <td className="data-table-cell">{order.supplier_name}</td>
                    <td className="data-table-cell-nowrap">
                      {formatDate(order.invoice_date)}
                    </td>
                    <td className="data-table-cell text-right">
                      {order.total_items}
                    </td>
                    <td className="data-table-cell-amount">
                      {currency.format(Number(order.total_amount) || 0)}
                    </td>
                    <td className="data-table-cell text-right">
                      <Button
                        className="action-button text-amber-700 hover:bg-amber-50"
                        icon={Eye}
                        iconSize={15}
                        ariaLabel={`Lihat invoice ${order.invoice_number || "tanpa nomor"} dari ${order.supplier_name}`}
                        onClick={() => openOrderDetails(order)}
                        label="Detail"
                      />
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
                : `Menampilkan ${firstVisible}–${lastVisible} dari ${totalFilteredCount} invoice`}
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

      {selectedOrder && (
        <DetailModal
          eyebrow="Detail pembelian"
          error={detailError}
          loading={detailLoading}
          loadingText="Memuat detail invoice..."
          onClose={closeOrderDetails}
          subtitle={`${selectedOrder.supplier_name} · ${formatDate(selectedOrder.invoice_date)}`}
          title={selectedOrder.invoice_number || "Tanpa invoice"}
        >
          <>
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 text-sm text-slate-600">
              <Package
                aria-hidden="true"
                className="text-slate-400"
                size={17}
              />
              {selectedOrder.items?.length || 0} jenis produk
              <span className="ml-auto font-semibold text-slate-800">
                {currency.format(Number(selectedOrder.total_amount) || 0)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table min-w-150">
                <TableHeader columns={orderDetailColumns} />
                <TableBody
                  loading={false}
                  data={selectedOrder.items ?? []}
                  columnsCount={orderDetailColumns.length}
                  loadingText="Memuat item..."
                  emptyText="Tidak ada item pada invoice ini."
                  renderRow={(item) => (
                    <tr key={item.batch_id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">
                          {item.product_name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.barcode || "-"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        {item.quantity_received} {item.unit || ""}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        {currency.format(Number(item.unit_cost) || 0)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-800">
                        {currency.format(Number(item.total_amount) || 0)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {item.exp_date || "-"}
                      </td>
                    </tr>
                  )}
                />
              </table>
            </div>
          </>
        </DetailModal>
      )}
    </main>
  );
}

// Memuat, memfilter, memaginasi, dan menampilkan transaksi beserta detail serta struk.
import Button from "../components/Button.jsx";
import { Eye, Printer, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import DetailModal from "../components/DetailModal.jsx";
import SalesFilters from "../components/SalesFilters.jsx";
import Pagination from "../components/Pagination.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useSales from "../hooks/useSales.js";

const salesColumns = [
  { key: "invoice", label: "Invoice" },
  { key: "date", label: "Tanggal" },
  { key: "payment", label: "Pembayaran" },
  { key: "total", label: "Total", align: "right" },
  { key: "cashier", label: "Kasir", align: "center" },
  { key: "actions", label: "Aksi", align: "center" },
];
const saleDetailColumns = [
  { key: "product", label: "Produk" },
  { key: "quantity", label: "Qty", align: "right" },
  { key: "price", label: "Harga", align: "right" },
  { key: "discount", label: "Diskon", align: "right" },
  { key: "subtotal", label: "Subtotal", align: "right" },
];

export default function SalesPage({ user }) {
  const {
    hasFullAccess,
    isCashier,
    isAdmin,
    error,
    refreshSales,
    invoiceSearch,
    setInvoiceSearch,
    productSearch,
    setProductSearch,
    cashierSearch,
    setCashierSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    paymentFilter,
    setPaymentFilter,
    setCurrentPage,
    hasActiveFilters,
    loading,
    pageSales,
    filteredSalesCount,
    activePage,
    totalPages,
    pageSize,
    showSaleDetails,
    deleteSale,
    currency,
    formatSaleDate,
    paymentLabels,
    selectedSale,
    loadingDetails,
    detailError,
    closeSaleDetails,
    printSaleReceipt,
    printingReceipt,
  } = useSales(user);

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Catatan transaksi"
        title="Penjualan Produk"
        description={
          isCashier
            ? "Transaksi hari ini yang diproses oleh Anda."
            : "Semua transaksi penjualan yang tercatat."
        }
      />

      {error && (
        <div className="page-error-alert" role="alert">
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={refreshSales}
            type="button"
          >
            Coba lagi
          </Button>
        </div>
      )}

      <section className="mt-6" aria-label="Daftar transaksi penjualan">
        <SalesFilters
          hasFullAccess={hasFullAccess}
          invoiceSearch={invoiceSearch}
          setInvoiceSearch={setInvoiceSearch}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          cashierSearch={cashierSearch}
          setCashierSearch={setCashierSearch}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          setCurrentPage={setCurrentPage}
          hasActiveFilters={hasActiveFilters}
        />
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="data-table min-w-3xl border-collapse">
              <TableHeader columns={salesColumns} />
              <TableBody
                loading={loading}
                data={pageSales}
                columnsCount={salesColumns.length}
                loadingText="Memuat transaksi..."
                emptyText={
                  hasActiveFilters
                    ? "Tidak ada transaksi yang cocok."
                    : "Belum ada transaksi penjualan."
                }
                renderRow={(sale) => (
                  <tr className="data-table-row" key={sale.id}>
                    <td className="data-table-cell whitespace-nowrap font-semibold text-slate-800">
                      {sale.invoice_number || `#${sale.id}`}
                    </td>
                    <td className="data-table-cell-nowrap">
                      {formatSaleDate(sale.sale_date)}
                    </td>
                    <td className="data-table-cell">
                      {paymentLabels[
                        String(sale.payment_method).toLowerCase()
                      ] ||
                        sale.payment_method ||
                        "-"}
                    </td>
                    <td className="data-table-cell-amount">
                      {currency.format(Number(sale.grand_total) || 0)}
                    </td>
                    <td className="data-table-cell text-center">
                      {sale.cashier_name || "-"}
                    </td>
                    <td className="data-table-cell whitespace-nowrap flex justify-center gap-2">
                      <Button
                        className="action-button text-amber-700 hover:bg-amber-50"
                        icon={Eye}
                        iconSize={15}
                        ariaLabel={`Lihat detail invoice ${sale.invoice_number || sale.id}`}
                        onClick={() => showSaleDetails(sale)}
                        label="Detail"
                      />
                      {isAdmin && (
                        <Button
                          className="action-button text-red-700 hover:bg-red-50"
                          icon={Trash2}
                          iconSize={15}
                          ariaLabel={`Hapus invoice ${sale.invoice_number || sale.id}`}
                          onClick={() => deleteSale(sale)}
                          label="Hapus"
                        />
                      )}
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
                : `Menampilkan ${filteredSalesCount === 0 ? 0 : (activePage - 1) * pageSize + 1}–${Math.min(activePage * pageSize, filteredSalesCount)} dari ${filteredSalesCount} transaksi`}
            </span>
            {filteredSalesCount > pageSize && (
              <Pagination
                activePage={activePage}
                onPageChange={setCurrentPage}
                totalPages={totalPages}
              />
            )}
          </footer>
        </div>
      </section>

      {selectedSale && (
        <DetailModal
          actions={
            !loadingDetails &&
            !detailError && (
              <Button
                className="action-button"
                disabled={printingReceipt}
                onClick={() => printSaleReceipt(selectedSale)}
                type="button"
              >
                <Printer aria-hidden="true" size={15} />
                {printingReceipt ? "Menyiapkan..." : "Cetak struk"}
              </Button>
            )
          }
          eyebrow="Detail transaksi"
          error={detailError}
          loading={loadingDetails}
          loadingText="Memuat detail transaksi..."
          onClose={closeSaleDetails}
          title={selectedSale.invoice_number || `#${selectedSale.id}`}
        >
          <>
            <div className="mb-5 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-caption-muted">Tanggal</p>
                <p className="detail-value">
                  {formatSaleDate(selectedSale.sale_date)}
                </p>
              </div>
              <div>
                <p className="text-caption-muted">Kasir</p>
                <p className="detail-value">
                  {selectedSale.cashier_name || "-"}
                </p>
              </div>
              <div>
                <p className="text-caption-muted">Pembayaran</p>
                <p className="detail-value">
                  {paymentLabels[
                    String(selectedSale.payment_method).toLowerCase()
                  ] ||
                    selectedSale.payment_method ||
                    "-"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="data-table min-w-xl">
                <TableHeader columns={saleDetailColumns} />
                <TableBody
                  loading={false}
                  data={selectedSale.items ?? []}
                  columnsCount={saleDetailColumns.length}
                  loadingText="Memuat item..."
                  emptyText="Tidak ada item pada transaksi ini."
                  renderRow={(item) => (
                    <tr className="text-slate-600" key={item.id}>
                      <td className="data-table-cell-compact-right font-medium text-slate-800">
                        {item.product_name}
                      </td>
                      <td className="data-table-cell-compact-right">
                        {Number(item.unit_quantity ?? item.quantity) || 0}{" "}
                        {item.unit || ""}
                      </td>
                      <td className="data-table-cell-compact-right whitespace-nowrap">
                        {currency.format(Number(item.price) || 0)}
                      </td>
                      <td className="data-table-cell-compact-right whitespace-nowrap">
                        {currency.format(Number(item.discount) || 0)}
                      </td>
                      <td className="data-table-cell-compact-right whitespace-nowrap font-semibold">
                        {currency.format(Number(item.subtotal) || 0)}
                      </td>
                    </tr>
                  )}
                />
              </table>
            </div>

            <div className="ml-auto mt-5 grid max-w-xs gap-2 text-sm">
              <div className="flex justify-between gap-4 text-slate-500">
                <span>Subtotal</span>
                <span>
                  {currency.format(Number(selectedSale.subtotal) || 0)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-slate-500">
                <span>Diskon transaksi</span>
                <span>
                  {currency.format(Number(selectedSale.discount) || 0)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 font-bold text-slate-800">
                <span>Total</span>
                <span>
                  {currency.format(Number(selectedSale.grand_total) || 0)}
                </span>
              </div>
            </div>
          </>
        </DetailModal>
      )}
    </main>
  );
}

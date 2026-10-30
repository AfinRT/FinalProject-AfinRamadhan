// Merangkai pencarian produk, keranjang, pembayaran, dan pratinjau struk pada halaman kasir.
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Button from "../components/Button.jsx";
import CheckoutPanel from "../components/CheckoutPanel.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ProductSearchPanel from "../components/ProductSearchPanel.jsx";
import ReceiptPreviewModal from "../components/ReceiptPreviewModal.jsx";
import { TableBody, TableHeader } from "../components/DataTable.jsx";
import useKasir from "../hooks/useKasir.js";

const cartColumns = [
  { key: "product", label: "Nama produk" },
  { key: "price", label: "Harga", align: "right" },
  { key: "quantity", label: "Jumlah", align: "center" },
  { key: "unit", label: "Unit", align: "center" },
  { key: "total", label: "Total harga", align: "right" },
  { key: "actions", label: "Hapus", align: "right" },
];

export default function KasirPage() {
  const {
    searchInputRef,
    search,
    handleSearchChange,
    groupedProducts,
    loadingProducts,
    getPriceLabel,
    addProduct,
    cart,
    currency,
    getLineTotal,
    startNewTransaction,
    changeQuantity,
    changeUnit,
    removeProduct,
    submitSale,
    subtotal,
    discount,
    setDiscount,
    total,
    paymentMethod,
    setPaymentMethod,
    paidAmount,
    handlePaidAmountChange,
    change,
    formatMoney,
    saving,
    paidValue,
    receiptPreview,
  } = useKasir();

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Transaksi penjualan"
        title="Kasir"
        description="Pilih produk, periksa pesanan, lalu selesaikan pembayaran."
      />

      <div className="grid items-start mt-6 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <ProductSearchPanel
            search={search}
            onSearchChange={handleSearchChange}
            searchInputRef={searchInputRef}
            loadingProducts={loadingProducts}
            products={groupedProducts}
            getPriceLabel={getPriceLabel}
            onAddProduct={addProduct}
          />
          <div className="mt-7 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-800">
              Daftar pesanan{" "}
              <span className="text-slate-500">({cart.length})</span>
            </h3>
            {cart.length > 0 && (
              <Button
                type="button"
                onClick={startNewTransaction}
                className="text-xs font-semibold text-slate-500 hover:text-red-700"
              >
                Kosongkan
              </Button>
            )}
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="data-table min-w-155">
              <TableHeader columns={cartColumns} />
              <TableBody
                loading={false}
                data={cart}
                columnsCount={cartColumns.length}
                loadingText="Memuat keranjang..."
                emptyText={
                  <>
                    <ShoppingCart className="mx-auto size-7 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">
                      Belum ada produk dalam pesanan.
                    </p>
                  </>
                }
                renderRow={({ product, quantity, unitKey }) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {product.barcode
                          ? `Barcode ${product.barcode} · ${product.unit || "unit"}`
                          : product.unit || "unit"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {getPriceLabel(product, unitKey)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          className="action-button"
                          icon={Minus}
                          iconSize={12}
                          onClick={() => changeQuantity(product.id, -1)}
                          ariaLabel={`Kurangi jumlah ${product.name}`}
                        />
                        <span className="min-w-5 text-center font-medium text-slate-800">
                          {quantity}
                        </span>
                        <Button
                          className="action-button"
                          icon={Plus}
                          iconSize={12}
                          onClick={() => changeQuantity(product.id, 1)}
                          ariaLabel={`Tambah jumlah ${product.name}`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={unitKey}
                        onChange={(event) =>
                          changeUnit(product.id, event.target.value)
                        }
                        aria-label={`Unit ${product.name}`}
                        className="max-w-28 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        {product.saleUnits.map((unit) => (
                          <option key={unit.key} value={unit.key}>
                            {unit.unit_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="data-table-cell-compact-right font-semibold text-slate-800">
                      {currency.format(
                        getLineTotal(product, quantity, unitKey),
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        className="action-button"
                        icon={Trash2}
                        iconSize={16}
                        onClick={() => removeProduct(product.id)}
                        ariaLabel={`Hapus ${product.name}`}
                      />
                    </td>
                  </tr>
                )}
              />
            </table>
          </div>
        </section>

        <CheckoutPanel
          onSubmit={submitSale}
          currency={currency}
          subtotal={subtotal}
          discount={discount}
          onDiscountChange={setDiscount}
          total={total}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          paidAmount={paidAmount}
          onPaidAmountChange={handlePaidAmountChange}
          change={change}
          formatMoney={formatMoney}
          saving={saving}
          cartLength={cart.length}
          paidValue={paidValue}
        />
      </div>
      <ReceiptPreviewModal
        receipt={receiptPreview}
        onClose={() => window.location.reload()}
      />
    </main>
  );
}

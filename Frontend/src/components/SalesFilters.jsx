// Menyediakan filter daftar penjualan dan kontrol untuk mengembalikan filter ke kondisi awal.
import FilterField from "./FilterField.jsx";

export default function SalesFilters({
  hasFullAccess,
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
}) {
  // Menghapus seluruh kriteria pencarian dan mengembalikan tabel ke halaman pertama.
  function resetFilters() {
    setInvoiceSearch("");
    setProductSearch("");
    setCashierSearch("");
    setDateFrom("");
    setDateTo("");
    setPaymentFilter("");
    setCurrentPage(1);
  }

  return (
    <FilterField
      type="group"
      className={`mb-4 grid w-full gap-3 sm:grid-cols-2 ${
        hasFullAccess
          ? "2xl:grid-cols-[repeat(3,minmax(124px,1fr))_minmax(420px,2fr)_minmax(150px,1fr)_minmax(120px,auto)]"
          : "xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
      }`}
      hasActiveFilters={hasActiveFilters}
      onReset={resetFilters}
    >
      <FilterField
        label="Nomor invoice"
        onChange={(value) => {
          setInvoiceSearch(value);
          setCurrentPage(1);
        }}
        placeholder="Cari nomor invoice..."
        value={invoiceSearch}
      />
      <FilterField
        label="Nama obat"
        onChange={(value) => {
          setProductSearch(value);
          setCurrentPage(1);
        }}
        placeholder="Cari nama obat..."
        value={productSearch}
      />
      {hasFullAccess && (
        <FilterField
          label="Nama kasir"
          onChange={(value) => {
            setCashierSearch(value);
            setCurrentPage(1);
          }}
          placeholder="Cari nama kasir..."
          value={cashierSearch}
        />
      )}
      {hasFullAccess && (
        <div className="grid min-w-0 gap-1.5 sm:col-span-2 sm:w-105 2xl:col-span-1">
          <div className="grid grid-cols-2 gap-3">
            <FilterField
              ariaDescribedBy="sales-date-hint"
              ariaLabel="Tanggal penjualan"
              label="Dari tanggal"
              max={dateTo}
              onChange={(value) => {
                setDateFrom(value);
                setCurrentPage(1);
              }}
              type="date"
              value={dateFrom}
              wrapperClassName="grid min-w-0 gap-1 text-[11px] font-medium text-slate-500"
            />
            <FilterField
              ariaDescribedBy="sales-date-hint"
              ariaLabel="Tanggal akhir"
              label="Sampai tanggal"
              min={dateFrom}
              onChange={(value) => {
                setDateTo(value);
                setCurrentPage(1);
              }}
              type="date"
              value={dateTo}
              wrapperClassName="grid min-w-0 gap-1 text-[11px] font-medium text-slate-500"
            />
          </div>
          <p className="sr-only" id="sales-date-hint">
            Isi satu tanggal untuk satu hari, atau keduanya untuk rentang.
          </p>
        </div>
      )}
      <FilterField
        emptyOption="Semua metode"
        label="Metode pembayaran"
        onChange={(value) => {
          setPaymentFilter(value);
          setCurrentPage(1);
        }}
        options={[
          { value: "cash", label: "Tunai" },
          { value: "transfer", label: "Transfer" },
          { value: "qris", label: "QRIS" },
        ]}
        type="select"
        value={paymentFilter}
      />
    </FilterField>
  );
}

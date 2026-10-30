import Button from "./Button.jsx";
import { useEffect, useState } from "react";
import { Banknote, CreditCard, QrCode, RotateCcw, X } from "lucide-react";
import qrisDummy from "../assets/qrisdummy.jpeg";
import rekeningDummy from "../assets/rekeningdummy.jpeg";

const paymentMethods = [
  { value: "cash", label: "Tunai", icon: Banknote },
  { value: "transfer", label: "Transfer", icon: CreditCard },
  { value: "qris", label: "QRIS", icon: QrCode },
];
const cashDenominations = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
const denominationFormatter = new Intl.NumberFormat("id-ID");

export default function CheckoutPanel({
  onSubmit,
  currency,
  subtotal,
  discount,
  onDiscountChange,
  total,
  paymentMethod,
  onPaymentMethodChange,
  paidAmount,
  onPaidAmountChange,
  change,
  formatMoney,
  saving,
  cartLength,
  paidValue,
}) {
  const [paymentInfoType, setPaymentInfoType] = useState(null);

  // Tombol Escape menutup dialog pembayaran.
  useEffect(() => {
    if (!paymentInfoType) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setPaymentInfoType(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paymentInfoType]);

  return (
    <form onSubmit={onSubmit} className="page-panel min-w-0 p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">Detail pembayaran</h2>
          <p className="mt-1 text-xs text-slate-500">
            Rincian akan tersimpan sebagai transaksi penjualan.
          </p>
        </div>
        <CreditCard className="size-5 text-blue-600" aria-hidden="true" />
      </div>

      <div className="space-y-3 rounded-lg bg-slate-50 p-4">
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-slate-500">Sub total</span>
          <span className="font-medium text-slate-800">
            {currency.format(subtotal)}
          </span>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Diskon transaksi</span>
          <span className="flex w-36 items-center rounded-lg border border-slate-300 bg-white px-2">
            <span className="text-xs text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={
                discount ? denominationFormatter.format(Number(discount)) : ""
              }
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "");
                onDiscountChange(digits ? Number(digits) : "");
              }}
              className="w-full bg-transparent py-2 pl-2 text-right text-sm outline-none"
              aria-label="Diskon transaksi"
            />
          </span>
        </label>
        <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
          <span className="font-semibold text-slate-800">Total bayar</span>
          <span className="text-lg font-bold text-blue-700">
            {currency.format(total)}
          </span>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-slate-700">
          Metode bayar
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {paymentMethods.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              onClick={() => {
                onPaymentMethodChange(value);
                setPaymentInfoType(null);
              }}
              aria-pressed={paymentMethod === value}
              className={`secondary-action-button flex flex-col gap-1.5 border ${
                paymentMethod === value
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Button>
          ))}
        </div>
      </fieldset>

      {(paymentMethod === "qris" || paymentMethod === "transfer") && (
        <Button
          className="secondary-action-button mt-4 w-full border border-blue-600 text-blue-700 hover:bg-blue-50"
          onClick={() => setPaymentInfoType(paymentMethod)}
          type="button"
        >
          {paymentMethod === "qris" ? (
            <QrCode aria-hidden="true" size={17} />
          ) : (
            <CreditCard aria-hidden="true" size={17} />
          )}
          {paymentMethod === "qris" ? "Tampilkan QRIS" : "Tampilkan rekening"}
        </Button>
      )}

      <label className="mt-5 block text-sm font-semibold text-slate-700">
        Nominal bayar
        <div className="relative mt-2">
          <div className="flex h-11 items-center rounded-lg border border-slate-300 bg-white pl-3 pr-10 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <span className="text-sm select-none text-slate-500">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={
                paymentMethod === "cash"
                  ? paidAmount
                    ? new Intl.NumberFormat("id-ID").format(Number(paidAmount))
                    : ""
                  : total > 0
                    ? new Intl.NumberFormat("id-ID").format(total)
                    : ""
              }
              onChange={(event) => onPaidAmountChange(event.target.value)}
              placeholder="Masukkan jumlah pembayaran"
              readOnly={paymentMethod !== "cash"}
              className="h-full w-full bg-transparent px-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              required
            />
          </div>
          {paymentMethod === "cash" && paidAmount && (
            <Button
              type="button"
              onClick={() => onPaidAmountChange("")}
              className="ghost-action-button absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Reset nominal"
            >
              <RotateCcw aria-hidden="true" size={16} />
            </Button>
          )}
        </div>
      </label>

      {paymentMethod === "cash" && (
        <fieldset className="mt-3">
          <legend className="text-xs font-medium text-slate-600">
            Tambah Nominal Tunai
          </legend>

          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {cashDenominations.map((denomination) => (
              <Button
                aria-label={`Tambah Rp ${denominationFormatter.format(denomination)}`}
                className="secondary-action-button border border-slate-300 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
                key={denomination}
                onClick={() =>
                  onPaidAmountChange(String(paidValue + denomination))
                }
                type="button"
              >
                {denominationFormatter.format(denomination)}
              </Button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm">
        <span className="text-slate-500">
          {change >= 0 ? "Kembalian" : "Kurang bayar"}
        </span>
        <span
          className={`font-semibold ${
            change >= 0 ? "text-slate-800" : "text-red-600"
          }`}
        >
          {change >= 0 ? "" : "-"}
          {formatMoney(Math.abs(change))}
        </span>
      </div>

      <Button
        type="submit"
        disabled={saving || cartLength === 0 || paidValue < total}
        className="primary-action-button mt-5 w-full"
      >
        {saving ? "Menyimpan transaksi..." : "Simpan pembayaran"}
      </Button>

      {paymentInfoType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPaymentInfoType(null);
            }
          }}
        >
          <section
            aria-labelledby="payment-info-modal-title"
            aria-modal="true"
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
            role="dialog"
          >
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <h2
                className="text-lg font-semibold text-slate-800"
                id="payment-info-modal-title"
              >
                {paymentInfoType === "qris"
                  ? "Pembayaran QRIS"
                  : "Rekening Transfer"}
              </h2>
              <Button
                aria-label="Tutup QRIS"
                className="modal-close-button"
                onClick={() => setPaymentInfoType(null)}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </Button>
            </header>
            <div className="p-4 sm:p-6">
              <img
                alt={
                  paymentInfoType === "qris"
                    ? "QRIS dummy untuk simulasi pembayaran"
                    : "Nomor rekening tujuan transfer"
                }
                className="mx-auto max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm"
                src={paymentInfoType === "qris" ? qrisDummy : rekeningDummy}
              />
            </div>
          </section>
        </div>
      )}
    </form>
  );
}

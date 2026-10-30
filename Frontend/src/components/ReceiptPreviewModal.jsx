import { ArrowLeft, Printer, X } from "lucide-react";
import { useRef } from "react";
import Button from "./Button.jsx";
import { buildReceiptDocument } from "../utils/receipt.js";

export default function ReceiptPreviewModal({ receipt, onClose }) {
  const previewFrame = useRef(null);

  if (!receipt) return null;

  function printReceipt() {
    const frame = previewFrame.current;
    if (!frame) return;

    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      window.print();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="receipt-preview-title"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Transaksi berhasil
            </p>
            <h2
              className="mt-1 truncate text-lg font-semibold text-slate-800"
              id="receipt-preview-title"
            >
              Pratinjau struk
            </h2>
          </div>
          <Button
            aria-label="Tutup pratinjau struk"
            className="modal-close-button"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[80mm] overflow-hidden bg-white shadow-md">
            <iframe
              className="block h-[58vh] min-h-80 w-full border-0"
              ref={previewFrame}
              srcDoc={buildReceiptDocument(receipt, { autoPrint: false })}
              title="Pratinjau struk penjualan"
            />
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button
            className="secondary-action-button"
            onClick={onClose}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Kembali
          </Button>
          <Button
            className="primary-action-button"
            onClick={printReceipt}
            type="button"
          >
            <Printer aria-hidden="true" size={16} />
            Cetak
          </Button>
        </footer>
      </section>
    </div>
  );
}

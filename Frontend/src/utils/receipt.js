// Membentuk dokumen HTML struk siap-pratinjau atau siap-cetak dari data transaksi.
const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const paymentLabels = {
  cash: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
};

// Memformat tanggal transaksi dalam lokal Indonesia dan mempertahankan nilai tak valid.
function formatSaleDate(value) {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// Meng-escape teks agar nilai transaksi tidak ditafsirkan sebagai markup HTML.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

// Merender seluruh informasi transaksi, item, ringkasan pembayaran, dan opsi cetak.
export function buildReceiptDocument(receipt, { autoPrint = true } = {}) {
  const items = (receipt.items ?? [])
    .map(
      (item) => `
        <div class="item">
          <div>${escapeHtml(item.product_name)}</div>
          <div class="item-row">
            <span>${Number(item.quantity) || 0} ${escapeHtml(item.unit || "")} × ${currency.format(Number(item.price) || 0)}</span>
            <span>${currency.format(Number(item.subtotal) || 0)}</span>
          </div>
          ${Number(item.discount) > 0 ? `<div class="muted">Diskon item: ${currency.format(Number(item.discount))}</div>` : ""}
        </div>`,
    )
    .join("");
  const paymentMethod =
    paymentLabels[String(receipt.payment_method).toLowerCase()] ||
    receipt.payment_method ||
    "-";
  const printScript = autoPrint
    ? `<script>
        window.addEventListener("load", () => {
          window.focus();
          window.print();
        }, { once: true });
      </script>`
    : "";

  return `<!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Struk ${escapeHtml(receipt.invoice_number || "Penjualan")}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          * { box-sizing: border-box; }
          body { width: 72mm; margin: 0 auto; color: #111; font: 11px/1.4 Arial, sans-serif; }
          h1 { margin: 0; text-align: center; font-size: 16px; }
          .center { text-align: center; }
          .muted { color: #555; }
          .rule { margin: 8px 0; border-top: 1px dashed #555; }
          .meta, .item-row, .total-row { display: flex; justify-content: space-between; gap: 8px; }
          .item { margin: 8px 0; }
          .item-row { margin-top: 2px; }
          .totals { margin-top: 8px; }
          .grand-total { margin-top: 5px; padding-top: 5px; border-top: 1px dashed #555; font-weight: bold; }
          .footer { margin-top: 14px; text-align: center; }
        </style>
      </head>
      <body>
        <main>
          <h1>STRUK PENJUALAN</h1>
          <div class="center">${escapeHtml(receipt.invoice_number || "-")}</div>
          <div class="rule"></div>
          <div class="meta"><span>Tanggal</span><span>${escapeHtml(formatSaleDate(receipt.sale_date))}</span></div>
          <div class="meta"><span>Kasir</span><span>${escapeHtml(receipt.cashier_name || "-")}</span></div>
          <div class="rule"></div>
          ${items}
          <div class="rule"></div>
          <div class="totals">
            <div class="total-row"><span>Subtotal</span><span>${currency.format(Number(receipt.subtotal) || 0)}</span></div>
            <div class="total-row"><span>Diskon</span><span>${currency.format(Number(receipt.discount) || 0)}</span></div>
            <div class="total-row grand-total"><span>Total</span><span>${currency.format(Number(receipt.grand_total) || 0)}</span></div>
            <div class="total-row"><span>Pembayaran (${escapeHtml(paymentMethod)})</span><span>${currency.format(Number(receipt.paid_amount) || 0)}</span></div>
            <div class="total-row"><span>Kembalian</span><span>${currency.format(Number(receipt.change_amount) || 0)}</span></div>
          </div>
          <div class="footer">Terima kasih</div>
        </main>
        ${printScript}
      </body>
    </html>`;
}

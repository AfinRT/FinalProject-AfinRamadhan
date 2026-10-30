// Menampilkan rincian metode pembayaran untuk penjualan, pengeluaran, dan saldo kas riil dalam satu panel terpadu.
import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";

export default function PaymentMethodBreakdown({
  summary,
  totalSales: propTotalSales,
  salesByMethod: propSalesByMethod,
  totalExpenses: propTotalExpenses,
  expensesByMethod: propExpensesByMethod,
  totalFinance: propTotalFinance,
  financeBreakdown: propFinanceBreakdown,
  loading,
  currency,
  className = "",
}) {
  const totalSales = Number(propTotalSales ?? summary?.total_sales) || 0;
  const salesByMethod = propSalesByMethod ?? summary?.sales_by_method ?? {};

  const totalExpenses =
    Number(propTotalExpenses ?? summary?.total_expenses) || 0;
  const expensesByMethod =
    propExpensesByMethod ?? summary?.expenses_by_method ?? {};

  const totalFinance = Number(propTotalFinance ?? summary?.total_finance) || 0;
  const financeBreakdown =
    propFinanceBreakdown ?? summary?.finance_breakdown ?? {};

  const sections = [
    {
      key: "sales",
      title: "Penjualan",
      dotColor: "bg-green-500",
      total: totalSales,
      items: [
        {
          key: "cash",
          label: "Tunai",
          icon: Banknote,
          color: "bg-green-600",
          amount: Number(salesByMethod.cash) || 0,
        },
        {
          key: "transfer",
          label: "Transfer",
          icon: CreditCard,
          color: "bg-blue-600",
          amount: Number(salesByMethod.transfer) || 0,
        },
        {
          key: "qris",
          label: "QRIS",
          icon: Wallet,
          color: "bg-cyan-600",
          amount: Number(salesByMethod.qris) || 0,
        },
      ],
    },
    {
      key: "expenses",
      title: "Pengeluaran",
      dotColor: "bg-amber-500",
      total: totalExpenses,
      items: [
        {
          key: "cash",
          label: "Tunai",
          icon: Banknote,
          color: "bg-amber-500",
          amount: Number(expensesByMethod.cash) || 0,
        },
        {
          key: "transfer",
          label: "Transfer",
          icon: CreditCard,
          color: "bg-blue-600",
          amount: Number(expensesByMethod.transfer) || 0,
        },
      ],
    },
    {
      key: "cash",
      title: "Total Kas",

      dotColor: "bg-blue-500",
      total: totalFinance,
      items: [
        {
          key: "cash",
          label: "Tunai",
          icon: Banknote,
          color: "bg-emerald-600",
          amount: Number(financeBreakdown.net_cash) || 0,
        },
        {
          key: "bank",
          label: "Rekening",
          icon: Landmark,
          color: "bg-blue-600",
          amount: Number(financeBreakdown.net_bank) || 0,
        },
      ],
    },
  ];

  return (
    <section
      className={`page-panel mt-5 flex flex-col p-4 sm:p-5 lg:p-6 ${className}`}
      aria-labelledby="payment-breakdown-title"
    >
      <div className="border-b border-(--color-border) pb-4">
        <h2
          className="text-base font-semibold tracking-tight text-(--color-text-primary)"
          id="payment-breakdown-title"
        >
          Rincian Transaksi
        </h2>
        <p className="mt-1 text-sm text-(--color-text-secondary)">
          Informasi arus transaksi dan saldo keuangan berdasarkan metode pembayaran.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3 lg:divide-x lg:divide-(--color-border) lg:gap-0">
        {sections.map((section, idx) => (
          <div
            className={`flex min-w-0 flex-1 flex-col ${
              idx > 0 ? "lg:pl-6" : ""
            } ${idx < sections.length - 1 ? "lg:pr-6" : ""}`}
            key={section.key}
          >
            {/* Header Kolom */}
            <div className="flex items-center justify-between gap-2 border-b border-(--color-border) pb-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${section.dotColor}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-(--color-text-primary)">
                    {section.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* List Item - Menggunakan flex-1 agar kolom 2 item mengisi penuh tinggi kolom 3 item */}
            <div className="flex flex-1 flex-col divide-y divide-(--color-border)">
              {section.items.map((item) => {
                const Icon = item.icon;
                const percentage =
                  section.total > 0
                    ? Math.max(
                        0,
                        Math.min(100, (item.amount / section.total) * 100),
                      )
                    : 0;

                return (
                  <div
                    className="flex flex-1 flex-col justify-center py-3.5 min-w-0"
                    key={item.key}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon
                          className="shrink-0 text-(--color-text-secondary)"
                          size={16}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-(--color-text-primary) whitespace-nowrap">
                          {item.label}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            item.amount < 0
                              ? "text-red-600"
                              : "text-(--color-text-primary)"
                          }`}
                        >
                          {loading ? "—" : currency.format(item.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-300`}
                        style={{ width: `${loading ? 0 : percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Membuat ringkasan statistik sesuai peran dan periode, lalu menyusun kartu serta grafik.
import Button from "../components/Button.jsx";
import { useEffect, useState } from "react";
import {
  ChartNoAxesCombined,
  CreditCard,
  Receipt,
  RefreshCw,
  Wallet,
} from "lucide-react";
import PaymentMethodBreakdown from "../components/PaymentMethodBreakdown.jsx";
import StatisticsCards from "../components/StatisticsCards.jsx";
import StatisticsPeriodControl from "../components/StatisticsPeriodControl.jsx";
import StatisticsTrendChart from "../components/StatisticsTrendChart.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { getSalesSummary } from "../services/statisticsService.js";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// Mengubah tanggal menjadi nilai input date lokal tanpa pergeseran zona waktu.
function formatDateInput(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

// Membuat rentang awal dari tanggal pertama bulan berjalan hingga hari ini.
function getInitialRange() {
  const today = new Date();
  return {
    from: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: formatDateInput(today),
  };
}

export default function StatistikPage({ user }) {
  const isAdmin = Number(user?.role_id) === 1;
  const isPharmacist = Number(user?.role_id) === 2;
  const hasFullAccess = isAdmin || isPharmacist;
  const [dateRange, setDateRange] = useState(getInitialRange);
  const [appliedRange, setAppliedRange] = useState(getInitialRange);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setLoading(true);
      setError("");

      try {
        const result = await getSalesSummary(
          hasFullAccess
            ? { dateFrom: appliedRange.from, dateTo: appliedRange.to }
            : {},
        );
        if (!cancelled) setSummary(result);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [appliedRange, hasFullAccess, refreshKey]);

  // Memvalidasi dan menerapkan rentang tanggal yang dipilih admin.
  function applyDateRange(event) {
    event.preventDefault();
    if (dateRange.from > dateRange.to) {
      setError("Tanggal awal tidak boleh melewati tanggal akhir.");
      return;
    }
    setAppliedRange({ ...dateRange });
  }

  // Mengubah salah satu batas tanggal tanpa menghilangkan batas lainnya.
  function updateDateRange(field, value) {
    setDateRange((current) => ({ ...current, [field]: value }));
  }

  // Mengembalikan filter tanggal ke rentang awal bulan berjalan.
  function resetDateRange() {
    const initial = getInitialRange();
    setDateRange(initial);
    setAppliedRange(initial);
  }

  const initialRange = getInitialRange();
  const hasActiveFilters =
    dateRange.from !== initialRange.from ||
    dateRange.to !== initialRange.to ||
    appliedRange.from !== initialRange.from ||
    appliedRange.to !== initialRange.to;

  const totalSales = Number(summary?.total_sales) || 0;
  const cards = [
    {
      label: "Total penjualan",
      value: currency.format(totalSales),
      note: "Nilai transaksi berhasil",
      icon: Wallet,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Transaksi",
      value: Number(summary?.transaction_count ?? 0).toLocaleString("id-ID"),
      note: "Jumlah transaksi",
      icon: Receipt,
      color: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "Total pengeluaran",
      value: currency.format(Number(summary?.total_expenses) || 0),
      note: "Pengeluaran tercatat",
      icon: CreditCard,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Total Kas",
      value: currency.format(Number(summary?.total_finance) || 0),
      note: "Penjualan dikurangi pengeluaran",
      icon: ChartNoAxesCombined,
      color: "bg-blue-100 text-blue-700",
    },
  ];

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Ringkasan operasional"
        title="Statistik Penjualan"
        description={
          hasFullAccess
            ? "Ringkasan seluruh penjualan untuk periode yang dipilih."
            : "Ringkasan penjualan Anda hari ini."
        }
        actions={
          <StatisticsPeriodControl
            isAdmin={hasFullAccess}
            dateRange={dateRange}
            onDateChange={updateDateRange}
            onSubmit={applyDateRange}
            onReset={resetDateRange}
            hasActiveFilters={hasActiveFilters}
            dateFrom={summary?.date_from}
          />
        }
      />

      {error && (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <span>{error}</span>
          <Button
            className="page-error-retry"
            onClick={() => setRefreshKey((key) => key + 1)}
            type="button"
          >
            <RefreshCw size={15} /> Coba lagi
          </Button>
        </div>
      )}

      <StatisticsCards cards={cards} loading={loading} />

      <PaymentMethodBreakdown
        summary={summary}
        loading={loading}
        currency={currency}
      />
      {hasFullAccess && <StatisticsTrendChart />}
    </main>
  );
}

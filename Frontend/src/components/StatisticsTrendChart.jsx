// Memuat dan menggambar tren bulanan penjualan, laba, serta pengeluaran dalam SVG.
import Button from "./Button.jsx";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getYearlySalesSummary } from "../services/statisticsService.js";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const chartLines = [
  { key: "revenue", label: "Penjualan", color: "var(--chart-sales)" },
  { key: "profit", label: "Laba bersih", color: "var(--chart-revenue)" },
  { key: "expenses", label: "Pengeluaran", color: "var(--chart-expenses)" },
];

const chartBounds = { left: 64, right: 12, top: 16, bottom: 30 };

// Mengubah indeks bulan menjadi koordinat horizontal pada area grafik.
function getXPosition(index, count) {
  const plotWidth = 720 - chartBounds.left - chartBounds.right;
  return chartBounds.left + (plotWidth * index) / Math.max(count - 1, 1);
}

// Mengubah nilai metrik menjadi koordinat vertikal sesuai skala grafik.
function getYPosition(value, minimum, maximum) {
  const plotHeight = 240 - chartBounds.top - chartBounds.bottom;
  return (
    chartBounds.top + plotHeight * (1 - (value - minimum) / (maximum - minimum))
  );
}

// Menyusun koordinat bulanan sebagai instruksi path untuk garis SVG.
function createPath(months, key, minimum, maximum) {
  return months
    .map((month, index) => {
      const x = getXPosition(index, months.length);
      const value = Number(month[key]) || 0;
      const y = getYPosition(value, minimum, maximum);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function StatisticsTrendChart() {
  const [yearData, setYearData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadYearlySummary() {
      setLoading(true);
      setError("");

      try {
        const result = await getYearlySalesSummary(
          {},
          { signal: controller.signal },
        );
        if (!Array.isArray(result?.months)) {
          throw new Error("Format data grafik dari server tidak valid.");
        }

        setYearData(result);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadYearlySummary();
    return () => controller.abort();
  }, [refreshKey]);

  const months = yearData?.months ?? [];
  const chartValues = months.flatMap((month) =>
    chartLines.map(({ key }) => Number(month[key]) || 0),
  );
  const minimum = Math.min(0, ...chartValues);
  const maximum = Math.max(1, ...chartValues);
  const annualRevenue = months.reduce(
    (total, month) => total + (Number(month.revenue) || 0),
    0,
  );
  const annualProfit = months.reduce(
    (total, month) => total + (Number(month.profit) || 0),
    0,
  );

  return (
    <section
      className="page-panel mt-5 p-5 sm:p-6"
      aria-labelledby="sales-chart-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-(--color-border) pb-4">
        <div>
          <h2
            className="mt-1 text-lg font-semibold text-(--color-text-primary)"
            id="sales-chart-title"
          >
            Grafik Penjualan
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
            Tahun {yearData?.year ?? new Date().getFullYear()}
          </p>
        </div>
        {!loading && !error && yearData && (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-(--color-text-secondary)">
                Total penjualan
              </p>
              <p className="mt-1 text-sm font-semibold text-(--color-text-primary)">
                {currency.format(annualRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-(--color-text-secondary)">
                Laba bersih
              </p>
              <p className="mt-1 text-sm font-semibold text-(--color-success)">
                {currency.format(annualProfit)}
              </p>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div
          className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"
          role="alert"
        >
          <p className="text-sm text-(--color-danger)">{error}</p>
          <Button
            className="action-button"
            onClick={() => setRefreshKey((key) => key + 1)}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} /> Coba lagi
          </Button>
        </div>
      ) : loading ? (
        <div
          className="grid min-h-56 place-items-center text-sm text-(--color-text-secondary)"
          aria-live="polite"
        >
          Memuat laporan penjualan...
        </div>
      ) : months.length === 0 ? (
        <div className="grid min-h-56 place-items-center text-sm text-(--color-text-secondary)">
          Belum ada data penjualan untuk ditampilkan.
        </div>
      ) : (
        <>
          <div
            className="mt-5 flex flex-wrap gap-x-5 gap-y-2"
            aria-label="Legenda grafik"
          >
            {chartLines.map((line) => (
              <span
                className="inline-flex items-center gap-2 text-xs text-(--color-text-secondary)"
                key={line.key}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: line.color }}
                />
                {line.label}
              </span>
            ))}
          </div>
          <div className="mt-3 w-full overflow-hidden">
            <svg
              aria-label={`Grafik penjualan, laba bersih, dan pengeluaran tahun ${yearData.year}`}
              className="block h-auto w-full"
              role="img"
              viewBox="0 0 720 240"
              preserveAspectRatio="none"
            >
              {[0, 1, 2, 3].map((step) => {
                const y = chartBounds.top + (194 * step) / 3;
                const value = maximum - ((maximum - minimum) * step) / 3;
                return (
                  <g key={step}>
                    <line
                      x1={chartBounds.left}
                      x2="708"
                      y1={y}
                      y2={y}
                      stroke="var(--chart-grid)"
                      strokeDasharray="3 5"
                    />
                    <text
                      x="12"
                      y={y - 5}
                      fill="var(--color-text-secondary)"
                      fontSize="10"
                    >
                      {compactCurrency.format(value)}
                    </text>
                  </g>
                );
              })}
              {chartLines.map((line) => (
                <g key={line.key}>
                  <path
                    d={createPath(months, line.key, minimum, maximum)}
                    fill="none"
                    stroke={line.color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                  />
                  {months.map((month, index) => {
                    const x = getXPosition(index, months.length);
                    const value = Number(month[line.key]) || 0;
                    const y = getYPosition(value, minimum, maximum);
                    return (
                      <circle
                        cx={x}
                        cy={y}
                        fill="var(--color-surface)"
                        key={`${line.key}-${month.month}`}
                        r="3"
                        stroke={line.color}
                        strokeWidth="2"
                      >
                        <title>{`${line.label}, ${month.label}: ${currency.format(value)}`}</title>
                      </circle>
                    );
                  })}
                </g>
              ))}
              {months.map((month, index) => {
                const x = getXPosition(index, months.length);
                return (
                  <text
                    fill="var(--color-text-secondary)"
                    fontSize="10"
                    key={`${month.month}-${month.label}`}
                    textAnchor="middle"
                    x={x}
                    y="235"
                  >
                    {month.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </>
      )}
    </section>
  );
}

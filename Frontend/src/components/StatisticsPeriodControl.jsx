// Menampilkan rentang tanggal untuk admin atau tanggal ringkasan yang berlaku bagi kasir.
import Button from "./Button.jsx";
import { CalendarDays, RotateCcw } from "lucide-react";
import FilterField from "./FilterField.jsx";

export default function StatisticsPeriodControl({
  isAdmin,
  dateRange,
  onDateChange,
  onSubmit,
  onReset,
  hasActiveFilters,
  dateFrom,
}) {
  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        <CalendarDays size={16} className="text-blue-600" />
        {dateFrom ?? "Hari ini"}
      </div>
    );
  }

  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={onSubmit}>
      <FilterField
        label="Dari tanggal"
        onChange={(value) => onDateChange("from", value)}
        required
        type="date"
        value={dateRange.from}
        wrapperClassName="grid gap-1 text-xs font-semibold text-slate-600"
        controlClassName="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />

      <FilterField
        label="Sampai tanggal"
        onChange={(value) => onDateChange("to", value)}
        required
        type="date"
        value={dateRange.to}
        wrapperClassName="grid gap-1 text-xs font-semibold text-slate-600"
        controlClassName="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
      <div className="flex items-center gap-1.5 text-sm text-slate-600">
        <Button type="submit" className="primary-action-button">
          <CalendarDays size={16} /> Terapkan
        </Button>
        {onReset && (
          <Button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="secondary-action-button bg-slate-200 hover:bg-slate-300"
          >
            <RotateCcw size={16} />
          </Button>
        )}
      </div>
    </form>
  );
}

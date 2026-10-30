import Button from "./Button.jsx";
import { RotateCcw, Search } from "lucide-react";

const searchClassName =
  "h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const controlClassName =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export default function FilterField({
  type = "search",
  children,
  label,
  value,
  onChange,
  placeholder = "",
  options = [],
  emptyOption = "",
  wrapperClassName,
  controlClassName: customControlClassName,
  ariaLabel,
  ariaDescribedBy,
  min,
  max,
  required = false,
  inputRef,
  className,
  hasActiveFilters,
  onReset,
}) {
  if (type === "group") {
    return (
      <div className={className}>
        {children}
        <Button
          className="secondary-action-button self-end"
          disabled={!hasActiveFilters}
          onClick={onReset}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={16} />
          Reset filter
        </Button>
      </div>
    );
  }

  const labelClassName =
    wrapperClassName || "grid gap-1.5 text-xs font-semibold text-slate-600";

  return (
    <label className={labelClassName}>
      <span>{label}</span>
      {type === "select" ? (
        <select
          aria-label={ariaLabel}
          className={customControlClassName || controlClassName}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          <option value="">{emptyOption}</option>
          {options.map((option) => (
            <option key={option.value} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "date" || type === "month" ? (
        <input
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel}
          className={customControlClassName || controlClassName}
          max={max || undefined}
          min={min || undefined}
          onChange={(event) => onChange(event.target.value)}
          ref={inputRef}
          required={required}
          type={type}
          value={value}
        />
      ) : (
        <span className="relative block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label={ariaLabel}
            className={customControlClassName || searchClassName}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            ref={inputRef}
            type="search"
            value={value}
          />
        </span>
      )}
    </label>
  );
}

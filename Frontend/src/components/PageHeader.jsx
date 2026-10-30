// Header halaman yang dapat dipakai ulang dengan judul, deskripsi, metadata, dan aksi.
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  size = "default",
  align = "start",
  bordered = true,
  className = "",
}) {
  const titleClassName =
    size === "large"
      ? "text-3xl font-semibold leading-tight text-slate-800 sm:text-4xl"
      : size === "compact"
        ? "text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
        : "mt-2 text-3xl font-semibold text-slate-800 sm:text-4xl";
  const descriptionClassName =
    size === "large"
      ? "mt-3 max-w-xl text-base leading-7 text-slate-600"
      : size === "compact"
        ? "mt-2 text-sm text-gray-500"
        : "mt-2 text-sm text-slate-500";
  const eyebrowClassName =
    size === "large"
      ? "mb-3 text-xs font-bold uppercase tracking-[1.2px] text-blue-700"
      : "text-xs font-bold uppercase tracking-[1.2px] text-blue-700";
  const borderClassName = bordered
    ? size === "large"
      ? "border-b border-slate-200 pb-10"
      : "border-b border-slate-200 pb-6"
    : "";
  const alignmentClassName =
    align === "center"
      ? "items-center text-center"
      : "sm:flex-row sm:items-end";

  return (
    <header
      className={`flex flex-col justify-between gap-5 ${alignmentClassName} ${borderClassName} ${className}`}
    >
      <div className={align === "center" ? "w-full" : "min-w-0"}>
        {eyebrow && <p className={eyebrowClassName}>{eyebrow}</p>}
        <h1 className={titleClassName}>{title}</h1>
        {description && <p className={descriptionClassName}>{description}</p>}
        {meta}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

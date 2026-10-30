import Button from "./Button.jsx";

export default function Pagination({
  activePage,
  totalPages,
  onPageChange,
  className = "pagination-controls",
}) {
  return (
    <nav aria-label="Navigasi halaman" className={className}>
      <Button
        className="action-button hover:bg-slate-100"
        disabled={activePage === 1}
        onClick={() => onPageChange(activePage - 1)}
        label="Sebelumnya"
      />
      <span className="text-xs text-slate-500">
        {activePage} / {totalPages}
      </span>
      <Button
        className="action-button hover:bg-slate-100"
        disabled={activePage === totalPages}
        onClick={() => onPageChange(activePage + 1)}
        label="Berikutnya"
      />
    </nav>
  );
}

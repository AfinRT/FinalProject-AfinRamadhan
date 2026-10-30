import { useEffect } from "react";
import { X } from "lucide-react";
import Button from "./Button.jsx";

export default function DetailModal({
  actions,
  children,
  error,
  eyebrow,
  loading = false,
  loadingText = "Memuat detail...",
  onClose,
  subtitle,
  title,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="detail-modal-title"
        aria-modal="true"
        className="modal-panel max-w-3xl rounded-xl"
        role="dialog"
      >
        <header className="modal-header">
          <div className="min-w-0">
            <p className="modal-eyebrow">{eyebrow}</p>
            <h2 className="modal-title break-all" id="detail-modal-title">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <Button
              aria-label="Tutup detail"
              className="modal-close-button"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </div>
        </header>
        <div className="modal-body">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {loadingText}
            </p>
          ) : error ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : (
            children
          )}
        </div>
      </section>
    </div>
  );
}

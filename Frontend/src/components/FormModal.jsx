import { useEffect } from "react";
import { X } from "lucide-react";
import Button from "./Button.jsx";

export default function FormModal({
  children,
  error,
  eyebrow,
  onClose,
  onSubmit,
  open,
  saving,
  title,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !saving) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, saving]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        aria-labelledby="form-modal-title"
        aria-modal="true"
        className="modal-form-panel"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">{eyebrow}</p>
            <h2 className="modal-title" id="form-modal-title">
              {title}
            </h2>
          </div>
          <Button
            aria-label="Tutup formulir"
            className="modal-close-button"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </header>

        <form className="modal-body" onSubmit={onSubmit}>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          {children}
        </form>
      </section>
    </div>
  );
}

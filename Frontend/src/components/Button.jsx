// Tombol bersama dengan properti standar elemen button.
export default function Button({
  children,
  icon: Icon,
  iconSize = 16,
  label,
  ariaLabel,
  className = "",
  disabled = false,
  type = "button",
  ...props
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      disabled={disabled}
      type={type}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" size={iconSize} />}
      {label ?? children}
    </button>
  );
}

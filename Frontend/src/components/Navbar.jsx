// Menampilkan judul halaman aktif, identitas pengguna, dan tombol navigasi samping.
import { Menu, UserRound } from "lucide-react";
import { useLocation } from "react-router-dom";

const roleNames = { 1: "Admin", 2: "Apoteker", 3: "Kasir" };
const pageTitles = {
  "/statistik": "Dashboard",
  "/kasir": "Kasir",
  "/sales": "Penjualan",
  "/pengeluaran": "Pengeluaran",
};

export default function Navbar({ user, onToggleSidebar }) {
  const roleName = roleNames[Number(user?.role_id)] ?? "Pengguna";
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-(--color-border) bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Ciutkan atau buka navigasi"
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-(--color-border) text-(--color-text-secondary) transition hover:bg-slate-50 hover:text-(--color-primary)"
          onClick={onToggleSidebar}
          type="button"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-(--color-text-secondary)">
            Apotek POS <span className="px-1 text-slate-300">/</span> {title}
          </p>
          <h1 className="truncate text-base font-semibold text-(--color-text-primary)">
            {title}
          </h1>
        </div>
      </div>
      <div className="hidden min-w-0 items-center gap-2 sm:flex">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
          <UserRound aria-hidden="true" size={16} />
        </span>
        <span
          aria-hidden="true"
          className="h-7 border-r border-(--color-border)"
        />
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold text-(--color-text-primary)">
            {user?.name || "Pengguna"}
          </p>
          <p className="truncate text-xs text-(--color-text-secondary)">
            {roleName}
          </p>
        </div>
      </div>
    </header>
  );
}

// Menyediakan navigasi utama, menyaring menu menurut peran, dan mendukung tampilan ringkas.
import {
  ChartColumnBig,
 LineChart,
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Wallet,
  Package,
  AlertTriangle,
  Building2,
  ChevronDown,
  CalendarX,
  FileText,
  Pill,
  Tags,
  UsersRound,
  X,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/logo.png";

export default function Sidebar({
  user,
  isOpen,
  collapsed,
  onClose,
  onLogout,
}) {
  const roleIdNum = Number(user?.role_id);
  const { pathname } = useLocation();
  const [inventoryOpen, setInventoryOpen] = useState(null);
  const items = [
    {
      label: "Dashboard",
      to: "/statistik",
      icon: LayoutDashboard,
      show: roleIdNum === 1 || roleIdNum === 2 || roleIdNum === 3,
    },
    {
      group: "Inventaris Obat",
      icon: Package,
      show: roleIdNum === 1 || roleIdNum === 2,
      menus: [
        {
          label: "Daftar Obat",
          to: "/obat/katalog",
          icon: Pill,
          show: roleIdNum === 1 || roleIdNum === 2,
        },
        {
          label: "Stok Kritis",
          to: "/obat/stok-menipis",
          icon: AlertTriangle,
          show: roleIdNum === 1 || roleIdNum === 2,
        },
        {
          label: "Tenggat Kedaluwarsa",
          to: "/obat/kedaluwarsa",
          icon: CalendarX,
          show: roleIdNum === 1 || roleIdNum === 2,
        },
      ],
    },
    { label: "Kasir", to: "/kasir", icon: ShoppingCart, show: roleIdNum === 3 },
    {
      label: "Penjualan",
      to: "/sales",
      icon: ChartColumnBig,
      show: roleIdNum === 1 || roleIdNum === 2 || roleIdNum === 3,
    },
    {
      label: "Analisis Produk",
      to: "/analisis-produk",
      icon: LineChart,
      show: roleIdNum === 1 || roleIdNum === 2,
    },
    {
      label: "Pengeluaran",
      to: "/pengeluaran",
      icon: Wallet,
      show: roleIdNum === 1 || roleIdNum === 3,
    },
    {
      label: "Kategori Obat",
      to: "/kategori",
      icon: Tags,
      show: roleIdNum === 1 || roleIdNum === 2,
    },
    {
      label: "Riwayat Pembelian",
      to: "/riwayat-pembelian",
      icon: FileText,
      show: roleIdNum === 1 || roleIdNum === 2,
    },
    {
      label: "Distributor",
      to: "/distributor",
      icon: Building2,
      show: roleIdNum === 1 || roleIdNum === 2,
    },

    {
      label: "Users",
      to: "/users",
      icon: UsersRound,
      show: roleIdNum === 1,
    },
  ].filter((item) => item.show);

  return (
    <>
      <button
        aria-label="Tutup menu navigasi"
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col bg-(--color-sidebar) text-white transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isOpen ? "translate-x-0" : ""} ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white p-1">
              <img alt="" className="size-full object-contain" src={logo} />
            </span>
            <span className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <span className="block text-2xl font-bold leading-tight text-white">
                PHARMATECH
              </span>
              <span className="block truncate text-xs  leading-tight text-slate-300">
                Solusi Praktis Kelola Apotek
              </span>
            </span>
          </div>
          <button
            aria-label="Tutup navigasi"
            className="grid size-8 place-items-center rounded-md text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Navigasi utama">
          {items.map((item) => {
            if (item.menus) {
              const Icon = item.icon;
              const hasActiveMenu = item.menus.some(
                (menu) => pathname === menu.to,
              );
              const isExpanded =
                inventoryOpen !== null ? inventoryOpen : hasActiveMenu;

              return (
                <div key={item.group}>
                  <button
                    aria-expanded={isExpanded}
                    className={`nav-link w-full ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                    onClick={() =>
                      setInventoryOpen((open) =>
                        open === null ? !hasActiveMenu : !open,
                      )
                    }
                    title={collapsed ? item.group : undefined}
                    type="button"
                  >
                    <Icon size={18} className="shrink-0" aria-hidden="true" />
                    <span className={collapsed ? "lg:hidden" : ""}>
                      {item.group}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`ml-auto size-4 transition-transform ${isExpanded ? "rotate-180" : ""} ${collapsed ? "lg:hidden" : ""}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-3 border-l border-white/10 pl-2">
                      {item.menus.map(({ label, to, icon: MenuIcon }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={onClose}
                          title={collapsed ? label : undefined}
                          className={({ isActive }) =>
                            `nav-link ${collapsed ? "lg:justify-center lg:px-0" : ""} ${isActive ? "nav-active" : ""}`
                          }
                        >
                          <MenuIcon
                            size={18}
                            className="shrink-0"
                            aria-hidden="true"
                          />
                          <span className={collapsed ? "lg:hidden" : ""}>
                            {label}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const { label, to, icon: Icon } = item;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `nav-link ${collapsed ? "lg:justify-center lg:px-0" : ""} ${isActive ? "nav-active" : ""}`
                }
              >
                <Icon size={18} className="shrink-0" aria-hidden="true" />
                <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div
          className={`border-t border-white/10 p-4 ${collapsed ? "lg:px-2" : ""}`}
        >
          <button
            aria-label="Keluar"
            className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${collapsed ? "lg:px-0" : "lg:justify-start"}`}
            onClick={onLogout}
            title="Keluar"
            type="button"
          >
            <LogOut aria-hidden="true" size={17} />
            <span className={collapsed ? "lg:hidden" : ""}>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}

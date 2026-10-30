// Menyediakan kerangka halaman setelah sesi terverifikasi, termasuk navigasi responsif.
import { useState } from "react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

export default function AppShell({
  children,
  user,
  sessionVerified,
  onLogout,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!sessionVerified) {
    return (
      <div
        className="grid min-h-screen place-items-center bg-(--color-background) text-sm text-(--color-text-secondary)"
        role="status"
      >
        Memeriksa sesi...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-background)">
      {user ? (
        <div className="flex min-h-screen">
          <Sidebar
            user={user}
            isOpen={sidebarOpen}
            collapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            onLogout={() => {
              setSidebarOpen(false);
              onLogout();
            }}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <Navbar
              user={user}
              onLogout={() => {
                setSidebarOpen(false);
                onLogout();
              }}
              onToggleSidebar={() => {
                if (window.matchMedia("(min-width: 1024px)").matches) {
                  setSidebarCollapsed((current) => !current);
                } else {
                  setSidebarOpen((current) => !current);
                }
              }}
            />
            <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

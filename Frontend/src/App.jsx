// Mengatur rute aplikasi dan membatasi halaman berdasarkan sesi serta peran pengguna.
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import StatistikPage from "./pages/StatisticsPage.jsx";
import KasirPage from "./pages/KasirPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import ExpensePage from "./pages/ExpensePage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import SupplierPage from "./pages/SupplierPage.jsx";
import EmployeePage from "./pages/UserPage.jsx";
import MedicineCatalogPage from "./pages/MedicineCatalogPage.jsx";
import LowStockPage from "./pages/LowStockPage.jsx";
import ExpiredPage from "./pages/ExpiredPage.jsx";
import OrderHistoryPage from "./pages/OrderHistoryPage.jsx";
import ProductAnalysisPage from "./pages/ProductAnalysisPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import useAuthSession from "./hooks/useAuthSession.js";

function App() {
  const { user, sessionVerified, handleLogin, handleLogout } = useAuthSession();

  return (
    <AppShell
      user={user}
      sessionVerified={sessionVerified}
      onLogout={handleLogout}
    >
      {user ? (
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/" element={<Navigate to="/statistik" replace />} />
          <Route
            path="/statistik"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 2, 3]}>
                <StatistikPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kasir"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[3]}>
                <KasirPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 2, 3]}>
                <SalesPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analisis-produk"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 2]}>
                <ProductAnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pengeluaran"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 3]}>
                <ExpensePage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/obat/katalog"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 2]}>
                <MedicineCatalogPage user={user} />
              </ProtectedRoute>
            }
          />
           <Route
            path="/obat/stok-menipis"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 2]}>
                <LowStockPage user={user} />
              </ProtectedRoute>
            }
          />
             
           <Route
            path="/obat/kedaluwarsa"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 2]}>
                <ExpiredPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/riwayat-pembelian"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 2]}>
                <OrderHistoryPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kategori"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 2]}>
                <CategoryPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributor"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1, 2]}>
                <SupplierPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute user={user} allowedRoleIds={[1]}>
                <EmployeePage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <h1 className="py-20 text-center text-2xl font-bold text-(--color-text-primary)">
                404 — Halaman tidak ditemukan
              </h1>
            }
          />
        </Routes>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </AppShell>
  );
}

export default App;

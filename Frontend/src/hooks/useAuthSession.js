import { useState } from "react";

const AUTH_USER_KEY = "authUser";
const AUTH_TOKEN_KEY = "authToken"; // Konsisten menggunakan key token

// Memulihkan data user lokal agar sesi tetap tampil setelah halaman dimuat ulang.
function readStoredUser() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const storedUser = localStorage.getItem(AUTH_USER_KEY);
  
  // PENTING: Jika salah satu hilang, anggap tidak login
  if (!token || !storedUser) return null;

  try {
    const user = JSON.parse(storedUser);
    return user && typeof user === "object" ? user : null;
  } catch {
    return null;
  }
}

export default function useAuthSession() {
  const [user, setUser] = useState(readStoredUser);
  const sessionVerified = true;

  // PERBAIKAN: Pastikan menerima 'token' dan 'authenticatedUser' saat login berhasil
  function handleLogin(authenticatedUser, token) {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  }

  // Menghapus seluruh data autentikasi lokal saat pengguna keluar.
  function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  }

  return { user, sessionVerified, handleLogin, handleLogout };
}

# Apotek POS — Frontend Application

Aplikasi antarmuka kasir dan manajemen apotek berbasis **React**, **Vite**, dan **Tailwind CSS**, yang terhubung ke Backend Express API lokal di `http://localhost:3000`.

---

## 🛠️ Prasyarat
- Node.js (v18+)
- Backend Apotek POS aktif di `http://localhost:3000`

---

## 🚀 Panduan Menjalankan

1. **Install Dependensi:**
   ```bash
   cd Frontend
   npm install
   ```

2. **File Environment (`.env`):**
   Pastikan file `.env` sudah ada dan mengarah ke API lokal:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. **Jalankan Aplikasi:**
   ```bash
   npm run dev
   ```
   Aplikasi akan terbuka di browser pada: **`http://localhost:5173`**

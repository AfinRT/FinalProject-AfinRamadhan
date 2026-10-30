# Panduan Setup Project di Device Baru

## 1. Prasyarat
- **Node.js** (v18+)
- **MySQL Server** (via Laragon atau XAMPP)

---

## 2. Setup Backend

1. Buka terminal, masuk ke folder `Backend` dan pasang dependensi:
   ```bash
   cd Backend
   npm install
   ```

2. Buat file `.env` dari contoh template:
   ```bash
   copy .env.example .env
   ```
   *(Pastikan MySQL di Laragon/XAMPP sudah menyala. Jika MySQL menggunakan password, sesuaikan `DB_PASSWORD` di `.env`)*.

3. Buat database dan isi data awal otomatis:
   ```bash
   npm run db:setup
   ```

4. Jalankan server backend:
   ```bash
   npm run dev
   ```
   *Backend aktif di: `http://localhost:3000`*

---

## 3. Setup Frontend

Buka terminal baru:
```bash
cd Frontend
npm install
npm run dev
```
*Frontend aktif di: `http://localhost:5173`*

---

## 4. Akun Login Default

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@apotek.com` | `@Password123` |
| **Apoteker** | `apoteker@apotek.com` | `@Password123` |
| **Kasir** | `kasir@apotek.com` | `@Password123` |

---

## 5. Akses Layanan

- **Aplikasi Kasir (Frontend):** http://localhost:5173
- **Dokumentasi API (Swagger):** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health

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

   _(Pastikan MySQL di Laragon/XAMPP sudah menyala. Jika MySQL menggunakan password, sesuaikan `DB_PASSWORD` di `.env`)_.

3. Buat database dan isi data awal otomatis:

   ```bash
   npm run db:setup
   npm run db:check
   ```

4. Jalankan server backend:
   ```bash
   npm run dev
   ```
   _Backend aktif di: `http://localhost:3000`_

---

## 3. Akun Login Default

| Role         | Email                 | Password       |
| :----------- | :-------------------- | :------------- |
| **Admin**    | `admin@apotek.com`    | `@Password123` |
| **Apoteker** | `apoteker@apotek.com` | `@Password123` |
| **Kasir**    | `kasir@apotek.com`    | `@Password123` |

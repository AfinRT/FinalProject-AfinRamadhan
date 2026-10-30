// Menangani validasi kredensial, permintaan autentikasi, dan tampilan halaman login.
import { useState } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import LoginForm from "../components/LoginForm.jsx";
import { login } from "../services/authService.js";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);

  // Memvalidasi input lalu mengirim kredensial ke API autentikasi.
  async function handleSubmit(e) {
    e.preventDefault();

    const err = {};
    if (email.trim() === "") err.email = "Email wajib diisi";
    if (password.length < 8) err.password = "Password minimal 8 karakter";
    setError(err);
    if (Object.keys(err).length > 0) return;

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      onLogin(result.user, result.token);
    } catch (loginError) {
      setError({
        umum:
          loginError instanceof TypeError
            ? "Tidak dapat terhubung ke server. Coba lagi."
            : loginError.message || "Login gagal. Periksa kembali data Anda.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-8">
      <section className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold leading-tight text-slate-900">
            Halo, Selamat Datang Kembali!
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Gunakan email dan kata sandi yang terdaftar.
          </p>
        </header>

        {error.umum && (
          <div
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={17}
            />
            <p className="font-medium">{error.umum}</p>
          </div>
        )}

        <div className="my-5 border-t border-slate-100" />

        <LoginForm
          email={email}
          onEmailChange={setEmail}
          password={password}
          onPasswordChange={setPassword}
          errors={error}
          loading={loading}
          onSubmit={handleSubmit}
        />

        <footer className="mt-7 flex items-center justify-center gap-2 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
          <ShieldCheck
            aria-hidden="true"
            className="shrink-0 text-slate-400"
            size={15}
          />
          <span>Jika ada kendala akses silahkan hubungi owner.</span>
        </footer>
      </section>
    </main>
  );
}

export default LoginPage;

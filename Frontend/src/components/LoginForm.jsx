// Mengumpulkan email dan kata sandi, menampilkan validasi, serta mengirim formulir login.
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Button from "./Button.jsx";

export default function LoginForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  errors,
  loading,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className={`h-12 w-full rounded-lg border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
            errors.email
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
          }`}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs font-medium text-red-700">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            minLength={8}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className={`h-12 w-full rounded-lg border bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
              errors.password
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
            }`}
          />
          <Button
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={showPassword}
            className="ghost-action-button absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={18} />
            ) : (
              <Eye aria-hidden="true" size={18} />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs font-medium text-red-700">
            {errors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="primary-action-button mt-2 w-full"
      >
        {loading ? (
          <>
            <svg
              className="size-5 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Memproses...</span>
          </>
        ) : (
          "Masuk"
        )}
      </Button>
    </form>
  );
}

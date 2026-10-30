// Menyatukan permintaan JSON API dengan token autentikasi dan penanganan respons gagal.
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export async function requestJson(path, options = {}) {
  const token = localStorage.getItem("authToken");
  const fullUrl =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && !path.includes("/auth/login")) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      window.location.replace("/login");
    }

    throw new Error(result?.message || "Permintaan gagal. Silakan coba lagi.");
  }

  return result?.data;
}

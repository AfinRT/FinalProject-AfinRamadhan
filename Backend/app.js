// SUDAH DISEDIAKAN — menjalankan backend dan menyajikan frontend.
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import productRoutes from "./routes/productRoutes.js";
import productBatchRoutes from "./routes/productBatchRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { HttpError } from "./utils/HttpError.js";
import { sendError, sendSuccess } from "./utils/apiResponse.js";
import { logError, logInfo } from "./utils/logger.js";
import { db } from "./config/connection.js";
import openapi from "./docs/openapi.json" with { type: "json" };

const app = express();

// Konfigurasi CORS: izinkan domain frontend dari environment atau izinkan semua origin jika belum diset.
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : null;

app.use(
  cors({
    origin: allowedOrigins
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error("Akses ditolak oleh kebijakan CORS."));
        }
      : true,
    credentials: true,
  }),
);

// Mengubah body JSON request menjadi object yang dapat dibaca controller.
app.use(express.json());

// Memeriksa status server sekaligus koneksi database.
app.get("/health", async (req, res) => {
  try {
    await db.execute("SELECT 1");
    return sendSuccess(res, 200, "Server is healthy", {
      status: "ok",
      database: "ok",
    });
  } catch (error) {
    logError("Health check database failed", error);
    return sendError(res, 503, "Layanan database tidak tersedia.");
  }
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: "Final Project API Documentation",
    swaggerOptions: { validatorUrl: null },
  }),
);

// Menghubungkan setiap kelompok endpoint ke prefix URL masing-masing.
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-batches", productBatchRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/users", userRoutes);

// Mengirim respons standar untuk URL yang tidak terdaftar.
app.use((req, res) => {
  sendError(res, 404, "Endpoint tidak ditemukan.");
});

// Menangani JSON rusak, error HTTP yang diketahui, dan error server lainnya.
app.use((error, req, res, next) => {
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    error.type === "entity.parse.failed"
  ) {
    return sendError(res, 400, "Body harus berupa JSON yang valid.");
  }

  if (error?.type === "entity.too.large") {
    return sendError(res, 413, "Body request terlalu besar.");
  }

  if (error instanceof HttpError) {
    return sendError(res, error.status, error.message);
  }

  logError("Unhandled request error", error, {
    method: req.method,
    path: req.originalUrl,
  });
  sendError(res, 500, "Terjadi kesalahan pada server.");
});

const port = Number(process.env.PORT || 3000);

// Menggunakan port hosting bila tersedia dan menerima koneksi dari luar container.
if (!process.env.VERCEL) {
  app.listen(port, "0.0.0.0", () => {
    logInfo("API server started", { url: `http://localhost:${port}` });
  });
}

export default app;

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler.js";
import { router } from "./routes/index.js";

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  "https://satori-inky.vercel.app", // production
  "http://localhost:5173", // local dev (Vite)
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────
app.use("/api/v1", router);

// ─── Health Check ────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    data: { timestamp: new Date().toISOString() },
  });
});

// ─── Error Handler ───────────────────────────────────────
app.use(errorHandler);

export default app;

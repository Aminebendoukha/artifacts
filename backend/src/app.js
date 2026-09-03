import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import ordersRouter from "./routes/orders.js";
import invoicesRouter from "./routes/invoices.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import activitiesRouter from "./routes/activities.js";
import notificationsRouter from "./routes/notifications.js";
import uploadRouter from "./routes/upload.js";

import { uploadsDir } from "./lib/storage.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { auth } from "./middleware/auth.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use(
  helmet({
    /*
     * The frontend and backend use different origins locally:
     * localhost:5173 -> localhost:3001.
     *
     * The API currently exposes /uploads as static content, so disabling
     * Helmet's default same-origin resource policy prevents legitimate
     * frontend requests from being blocked. When uploads move to private
     * object storage, revisit this policy.
     */
    crossOriginResourcePolicy: false,
  }),
);

const corsOptions = {
  origin(origin, callback) {
    /*
     * Requests without an Origin header include server-to-server calls,
     * curl, health checks, and same-origin tools. Browser-originated
     * requests must match the configured allowlist.
     */
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error("Origin is not allowed by CORS.");
    error.status = 403;
    callback(error);
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(
  express.json({
    limit: "2mb",
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Please try again in 15 minutes.",
    status: 429,
  },
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "orbit-backend",
    timestamp: new Date().toISOString(),
  });
});

/*
 * Authentication routes must remain before the global `auth` middleware.
 * Rate limiting is attached only to the public credential endpoints so
 * normal authenticated API traffic is unaffected.
 */
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRouter);

/*
 * Every route below requires a valid JWT, including file access. This
 * protects client attachments from being anonymously downloaded.
 */
app.use(auth);

app.use("/uploads", express.static(uploadsDir));
app.use("/api/orders", ordersRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api", uploadRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
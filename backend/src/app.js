import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "node:path";
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

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
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
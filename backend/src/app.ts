import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import physioRoutes from "./routes/physios";
import clubRoutes from "./routes/clubs";
import requestRoutes from "./routes/requests";
import bookingRoutes from "./routes/bookings";
import ratingRoutes from "./routes/ratings";
import adminRoutes from "./routes/admin";
import notificationRoutes from "./routes/notifications";
import { errorHandler } from "./middleware/errorHandler";
import { UPLOADS_DIR } from "./middleware/upload";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(UPLOADS_DIR));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRoutes);
  app.use("/physios", physioRoutes);
  app.use("/clubs", clubRoutes);
  app.use("/requests", requestRoutes);
  app.use("/bookings", bookingRoutes);
  app.use("/ratings", ratingRoutes);
  app.use("/admin", adminRoutes);
  app.use("/notifications", notificationRoutes);

  app.use(errorHandler);

  return app;
}

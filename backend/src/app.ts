import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import physioRoutes from "./routes/physios";
import clubRoutes from "./routes/clubs";
import requestRoutes from "./routes/requests";
import bookingRoutes from "./routes/bookings";
import ratingRoutes from "./routes/ratings";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRoutes);
  app.use("/physios", physioRoutes);
  app.use("/clubs", clubRoutes);
  app.use("/requests", requestRoutes);
  app.use("/bookings", bookingRoutes);
  app.use("/ratings", ratingRoutes);

  app.use(errorHandler);

  return app;
}

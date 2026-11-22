import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { pool } from "./db/pool.js";
import { openapi } from "./docs/openapi.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookings.js";
import rideRoutes from "./routes/rides.js";
import savedRoutes from "./routes/saved.js";
import userRoutes from "./routes/users.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // behind Render/Heroku's proxy, so rate limiting sees the real client IP

  // Public Swagger UI (mounted before helmet because its inline scripts would be blocked by a strict CSP).
  app.get("/api/docs.json", (_req, res) => res.json(openapi));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: "UniHop API docs", swaggerOptions: { persistAuthorization: true } }));

  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigins.includes("*") ? true : config.corsOrigins,
    exposedHeaders: ["X-Total-Count"],
  }));
  if (!config.isTest) app.use(morgan(config.isProd ? "combined" : "dev")); // request logging
  app.use(express.json({ limit: "100kb" })); // JSON body parsing

  app.get("/", (_req, res) => res.json({ name: "UniHop API", docs: "/api/docs", health: "/api/health" }));
  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/rides", rideRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/saved", savedRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

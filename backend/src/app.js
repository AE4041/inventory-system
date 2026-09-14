import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import userRoutes from "./routes/users.routes.js";
import storeRoutes from "./routes/stores.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import productRoutes from "./routes/products.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import stockTransferRoutes from "./routes/stockTransfers.routes.js";
import customerRoutes from "./routes/customers.routes.js";
import saleRoutes from "./routes/sales.routes.js";
import expenseCategoryRoutes from "./routes/expenseCategories.routes.js";
import expenseRoutes from "./routes/expenses.routes.js";
import reportRoutes from "./routes/reports.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import receiptRoutes from "./routes/receipts.routes.js";
import mikrotikIntegrationRoutes from "./routes/mikrotikIntegration.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
      credentials: true,
    })
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/organization", organizationRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/stores", storeRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/stock-transfers", stockTransferRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/sales", saleRoutes);
  app.use("/api/expense-categories", expenseCategoryRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/receipts", receiptRoutes);
  app.use("/api/integrations/mikrotik", mikrotikIntegrationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

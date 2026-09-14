import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveDateRange } from "../utils/dateRange.js";
import {
  getSalesSummary,
  getExpensesSummary,
  getStoreComparison,
  getSalesOverTime,
  getTopProducts,
  getSalesByPaymentMethod,
  getLowStockCount,
  resolveStoreScope,
} from "../services/reports.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const { preset = "this_month", from: fromParam, to: toParam, storeId } = req.query;
  const { from, to } = resolveDateRange(preset, fromParam, toParam);

  const [sales, expenses, lowStockCount, salesOverTime, topProducts, paymentBreakdown] = await Promise.all([
    getSalesSummary({ user: req.user, storeId, from, to }),
    getExpensesSummary({ user: req.user, storeId, from, to }),
    getLowStockCount({ user: req.user, storeId }),
    getSalesOverTime({ user: req.user, storeId, from, to }),
    getTopProducts({ user: req.user, storeId, from, to, limit: 5 }),
    getSalesByPaymentMethod({ user: req.user, storeId, from, to }),
  ]);

  const customerScope = resolveStoreScope(req.user, storeId);
  const customersCount = await prisma.customer.count({ where: { store: customerScope } });

  const storeComparison = req.user.role === "ADMIN" && !storeId ? await getStoreComparison({ user: req.user, from, to }) : null;

  res.json({
    success: true,
    data: {
      range: { preset, from, to },
      sales,
      expenses,
      netRevenue: sales.totalSales - expenses.totalExpenses,
      customersCount,
      lowStockCount,
      salesOverTime,
      topProducts,
      paymentBreakdown,
      storeComparison,
    },
  });
});

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveDateRange } from "../utils/dateRange.js";
import { toCsv, sendCsv } from "../utils/csv.js";
import { effectivePrice } from "../utils/pricing.js";
import {
  getSalesSummary,
  getExpensesSummary,
  getStoreComparison,
  getTopProducts,
  resolveStoreScope,
} from "../services/reports.service.js";

function parseRange(req) {
  const { preset = "this_month", from, to } = req.query;
  return resolveDateRange(preset, from, to);
}

export const salesReport = asyncHandler(async (req, res) => {
  const { storeId, customerId, userId, productId, paymentMethod, export: exportFormat } = req.query;
  const { from, to } = parseRange(req);
  const storeScope = resolveStoreScope(req.user, storeId);

  const where = {
    store: storeScope,
    createdAt: { gte: from, lte: to },
    ...(customerId && { customerId }),
    ...(userId && { userId }),
    ...(paymentMethod && { paymentMethod }),
    ...(productId && { items: { some: { productId } } }),
  };

  const [summary, sales] = await Promise.all([
    getSalesSummary({ user: req.user, storeId, from, to, extraSaleWhere: where }),
    prisma.sale.findMany({
      where,
      include: { store: true, customer: true, cashier: { select: { name: true } }, items: true },
      orderBy: { createdAt: "desc" },
      take: exportFormat ? undefined : 200,
    }),
  ]);

  if (exportFormat === "csv") {
    const csv = toCsv(sales, [
      { header: "Receipt #", value: (s) => s.receiptNumber },
      { header: "Date", value: (s) => s.createdAt.toISOString() },
      { header: "Store", value: (s) => s.store.name },
      { header: "Customer", value: (s) => s.customer?.name ?? "" },
      { header: "Cashier", value: (s) => s.cashier.name },
      { header: "Items", value: (s) => s.items.length },
      { header: "Subtotal", value: (s) => s.subtotal },
      { header: "Discount", value: (s) => s.discount },
      { header: "Tax", value: (s) => s.tax },
      { header: "Total", value: (s) => s.total },
      { header: "Payment Method", value: (s) => s.paymentMethod },
      { header: "Status", value: (s) => s.status },
    ]);
    return sendCsv(res, "sales-report.csv", csv);
  }

  res.json({ success: true, data: { summary, sales } });
});

export const expensesReport = asyncHandler(async (req, res) => {
  const { storeId, categoryId, export: exportFormat } = req.query;
  const { from, to } = parseRange(req);
  const storeScope = resolveStoreScope(req.user, storeId);

  const where = { store: storeScope, date: { gte: from, lte: to }, ...(categoryId && { categoryId }) };

  const [summary, expenses] = await Promise.all([
    getExpensesSummary({ user: req.user, storeId, from, to }),
    prisma.expense.findMany({
      where,
      include: { store: true, category: true, recordedBy: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: exportFormat ? undefined : 200,
    }),
  ]);

  if (exportFormat === "csv") {
    const csv = toCsv(expenses, [
      { header: "Date", value: (e) => e.date.toISOString().slice(0, 10) },
      { header: "Store", value: (e) => e.store.name },
      { header: "Category", value: (e) => e.category.name },
      { header: "Description", value: (e) => e.description },
      { header: "Amount", value: (e) => e.amount },
      { header: "Payment Method", value: (e) => e.paymentMethod },
      { header: "Recorded By", value: (e) => e.recordedBy.name },
    ]);
    return sendCsv(res, "expenses-report.csv", csv);
  }

  res.json({ success: true, data: { summary, expenses } });
});

export const inventoryReport = asyncHandler(async (req, res) => {
  const { storeId, export: exportFormat } = req.query;
  const storeScope = resolveStoreScope(req.user, storeId);

  const rows = await prisma.storeProduct.findMany({
    where: { store: storeScope },
    include: { store: true, product: { include: { category: true } } },
    orderBy: { product: { name: "asc" } },
  });

  const data = rows.map((r) => {
    const { costPrice, sellingPrice } = effectivePrice(r, r.product);
    return {
      storeId: r.storeId,
      storeName: r.store.name,
      productId: r.productId,
      productName: r.product.name,
      category: r.product.category?.name ?? "",
      quantity: r.quantity,
      minStockLevel: r.product.minStockLevel,
      lowStock: r.quantity <= r.product.minStockLevel,
      costValue: Number(costPrice) * r.quantity,
      retailValue: Number(sellingPrice) * r.quantity,
    };
  });

  if (exportFormat === "csv") {
    const csv = toCsv(data, [
      { header: "Store", value: (d) => d.storeName },
      { header: "Product", value: (d) => d.productName },
      { header: "Category", value: (d) => d.category },
      { header: "Quantity", value: (d) => d.quantity },
      { header: "Min Stock Level", value: (d) => d.minStockLevel },
      { header: "Low Stock", value: (d) => (d.lowStock ? "Yes" : "No") },
      { header: "Cost Value", value: (d) => d.costValue.toFixed(2) },
      { header: "Retail Value", value: (d) => d.retailValue.toFixed(2) },
    ]);
    return sendCsv(res, "inventory-report.csv", csv);
  }

  const totals = data.reduce(
    (acc, d) => {
      acc.totalUnits += d.quantity;
      acc.costValue += d.costValue;
      acc.retailValue += d.retailValue;
      acc.lowStockCount += d.lowStock ? 1 : 0;
      return acc;
    },
    { totalUnits: 0, costValue: 0, retailValue: 0, lowStockCount: 0 }
  );

  res.json({ success: true, data: { totals, items: data } });
});

export const productPerformanceReport = asyncHandler(async (req, res) => {
  const { storeId } = req.query;
  const { from, to } = parseRange(req);

  const topProducts = await getTopProducts({ user: req.user, storeId, from, to, limit: 100 });

  resolveStoreScope(req.user, storeId); // validates the requester can view this store
  const allProducts = await prisma.product.findMany({ where: { organizationId: req.user.organizationId, active: true } });
  const soldMap = new Map(topProducts.map((p) => [p.productId, p]));

  const slowMoving = allProducts
    .filter((p) => !soldMap.has(p.id))
    .map((p) => ({ productId: p.id, productName: p.name, quantitySold: 0, revenue: 0 }))
    .slice(0, 20);

  res.json({ success: true, data: { bestSelling: topProducts.slice(0, 20), slowMoving } });
});

export const storePerformanceReport = asyncHandler(async (req, res) => {
  const { from, to } = parseRange(req);
  const comparison = await getStoreComparison({ user: req.user, from, to });
  res.json({ success: true, data: comparison });
});

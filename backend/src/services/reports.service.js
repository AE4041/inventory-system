import { prisma } from "../lib/prisma.js";
import { assertStoreAccess } from "../middleware/auth.js";

// Resolves the Store `where` clause a user/report is allowed to see.
export function resolveStoreScope(user, storeId) {
  if (storeId) {
    assertStoreAccess(user, storeId);
    return { id: storeId };
  }
  if (user.role === "ADMIN") return { organizationId: user.organizationId };
  return { id: { in: user.storeIds } };
}

export async function getSalesSummary({ user, storeId, from, to, extraSaleWhere = {} }) {
  const storeScope = resolveStoreScope(user, storeId);
  const baseWhere = { store: storeScope, createdAt: { gte: from, lte: to }, ...extraSaleWhere };

  const [completedAgg, completedCount, refundedAgg, cancelledCount, productsSoldAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { ...baseWhere, status: "PAID" },
      _sum: { total: true, discount: true, tax: true, subtotal: true },
      _count: true,
    }),
    prisma.sale.count({ where: { ...baseWhere, status: "PAID" } }),
    prisma.sale.aggregate({
      where: { ...baseWhere, status: "REFUNDED" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.count({ where: { ...baseWhere, status: "CANCELLED" } }),
    prisma.saleItem.aggregate({
      where: { sale: { ...baseWhere, status: "PAID" } },
      _sum: { quantity: true },
    }),
  ]);

  const totalSales = Number(completedAgg._sum.total ?? 0);
  const totalDiscounts = Number(completedAgg._sum.discount ?? 0);
  const totalTax = Number(completedAgg._sum.tax ?? 0);
  const refundsValue = Number(refundedAgg._sum.total ?? 0);

  return {
    totalSales,
    transactions: completedCount,
    averageTransactionValue: completedCount ? totalSales / completedCount : 0,
    totalDiscounts,
    totalTax,
    productsSold: Number(productsSoldAgg._sum.quantity ?? 0),
    refunds: { count: refundedAgg._count, value: refundsValue },
    cancelled: cancelledCount,
    netSales: totalSales - refundsValue,
  };
}

export async function getExpensesSummary({ user, storeId, from, to }) {
  const storeScope = resolveStoreScope(user, storeId);
  const where = { store: storeScope, date: { gte: from, lte: to } };

  const [totalAgg, byCategory] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
    prisma.expense.groupBy({ by: ["categoryId"], where, _sum: { amount: true }, _count: true }),
  ]);

  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: byCategory.map((c) => c.categoryId) } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return {
    totalExpenses: Number(totalAgg._sum.amount ?? 0),
    count: totalAgg._count,
    byCategory: byCategory.map((c) => ({
      categoryId: c.categoryId,
      categoryName: categoryMap.get(c.categoryId) ?? "Uncategorized",
      total: Number(c._sum.amount ?? 0),
      count: c._count,
    })),
  };
}

export async function getStoreComparison({ user, from, to }) {
  const storeScope = user.role === "ADMIN" ? { organizationId: user.organizationId } : { id: { in: user.storeIds } };
  const stores = await prisma.store.findMany({ where: storeScope, orderBy: { name: "asc" } });

  const results = await Promise.all(
    stores.map(async (store) => {
      const [sales, expenses] = await Promise.all([
        getSalesSummary({ user, storeId: store.id, from, to }),
        getExpensesSummary({ user, storeId: store.id, from, to }),
      ]);
      return {
        storeId: store.id,
        storeName: store.name,
        sales: sales.totalSales,
        transactions: sales.transactions,
        expenses: expenses.totalExpenses,
        net: sales.totalSales - expenses.totalExpenses,
      };
    })
  );

  return results;
}

export async function getTopProducts({ user, storeId, from, to, limit = 10 }) {
  const storeScope = resolveStoreScope(user, storeId);
  const grouped = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: { sale: { store: storeScope, createdAt: { gte: from, lte: to }, status: "PAID" } },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  });

  const products = await prisma.product.findMany({ where: { id: { in: grouped.map((g) => g.productId) } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return grouped.map((g) => ({
    productId: g.productId,
    productName: productMap.get(g.productId)?.name ?? "Unknown",
    quantitySold: Number(g._sum.quantity ?? 0),
    revenue: Number(g._sum.total ?? 0),
  }));
}

export async function getSalesByPaymentMethod({ user, storeId, from, to }) {
  const storeScope = resolveStoreScope(user, storeId);
  const grouped = await prisma.sale.groupBy({
    by: ["paymentMethod"],
    where: { store: storeScope, createdAt: { gte: from, lte: to }, status: "PAID" },
    _sum: { total: true },
    _count: true,
  });

  return grouped.map((g) => ({
    paymentMethod: g.paymentMethod,
    total: Number(g._sum.total ?? 0),
    count: g._count,
  }));
}

// Daily sales totals for a line/bar chart across the given range.
export async function getSalesOverTime({ user, storeId, from, to }) {
  const storeScope = resolveStoreScope(user, storeId);
  const sales = await prisma.sale.findMany({
    where: { store: storeScope, createdAt: { gte: from, lte: to }, status: "PAID" },
    select: { total: true, createdAt: true },
  });

  const byDay = new Map();
  for (const sale of sales) {
    const key = sale.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(sale.total));
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
}

export async function getLowStockCount({ user, storeId }) {
  const storeScope = resolveStoreScope(user, storeId);
  const rows = await prisma.storeProduct.findMany({
    where: { store: storeScope },
    include: { product: { select: { minStockLevel: true, active: true } } },
  });
  return rows.filter((r) => r.product.active && r.quantity <= r.product.minStockLevel).length;
}

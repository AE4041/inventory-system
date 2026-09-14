import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const organization = await prisma.organization.create({
    data: { name: "Golden Star Retail", currency: "GHS", taxRate: 0 },
  });

  const admin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: "Ama Owusu",
      email: "admin@demo.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const stores = await Promise.all(
    [
      { name: "Accra Branch", address: "12 Oxford St, Osu, Accra", phone: "+233 20 111 2222", email: "accra@demo.com" },
      { name: "Kumasi Branch", address: "5 Prempeh II Rd, Kumasi", phone: "+233 20 333 4444", email: "kumasi@demo.com" },
      { name: "Takoradi Branch", address: "8 Harbour Rd, Takoradi", phone: "+233 20 555 6666", email: "takoradi@demo.com" },
    ].map((s) => prisma.store.create({ data: { ...s, organizationId: organization.id } }))
  );
  const [accra, kumasi, takoradi] = stores;

  const manager = await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: "Kwame Mensah",
      email: "manager@demo.com",
      passwordHash,
      role: "MANAGER",
      storeAccess: { create: [{ storeId: accra.id }] },
    },
  });

  const cashier = await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: "Efua Boateng",
      email: "cashier@demo.com",
      passwordHash,
      role: "CASHIER",
      storeAccess: { create: [{ storeId: accra.id }, { storeId: kumasi.id }] },
    },
  });

  const categories = await Promise.all(
    ["Beverages", "Snacks", "Groceries", "Household"].map((name) =>
      prisma.category.create({ data: { name, organizationId: organization.id } })
    )
  );
  const [beverages, snacks, groceries, household] = categories;

  const productDefs = [
    { name: "Coca-Cola 500ml", categoryId: beverages.id, costPrice: 3.5, sellingPrice: 6, unit: "bottle", minStockLevel: 20, sku: "BEV-001", barcode: "6001234500017" },
    { name: "Malta Guinness 330ml", categoryId: beverages.id, costPrice: 4, sellingPrice: 7, unit: "bottle", minStockLevel: 15, sku: "BEV-002", barcode: "6001234500024" },
    { name: "Bottled Water 750ml", categoryId: beverages.id, costPrice: 1.5, sellingPrice: 3, unit: "bottle", minStockLevel: 30, sku: "BEV-003", barcode: "6001234500031" },
    { name: "Digestive Biscuits", categoryId: snacks.id, costPrice: 5, sellingPrice: 9, unit: "pack", minStockLevel: 10, sku: "SNK-001", barcode: "6001234500048" },
    { name: "Groundnuts 200g", categoryId: snacks.id, costPrice: 3, sellingPrice: 6, unit: "pack", minStockLevel: 10, sku: "SNK-002", barcode: "6001234500055" },
    { name: "Rice 5kg", categoryId: groceries.id, costPrice: 45, sellingPrice: 60, unit: "bag", minStockLevel: 5, sku: "GRC-001", barcode: "6001234500062" },
    { name: "Cooking Oil 1L", categoryId: groceries.id, costPrice: 18, sellingPrice: 25, unit: "bottle", minStockLevel: 8, sku: "GRC-002", barcode: "6001234500079" },
    { name: "Sugar 1kg", categoryId: groceries.id, costPrice: 8, sellingPrice: 13, unit: "bag", minStockLevel: 10, sku: "GRC-003", barcode: "6001234500086" },
    { name: "Dish Soap 500ml", categoryId: household.id, costPrice: 6, sellingPrice: 11, unit: "bottle", minStockLevel: 10, sku: "HHD-001", barcode: "6001234500093" },
    { name: "Toilet Tissue (4-pack)", categoryId: household.id, costPrice: 7, sellingPrice: 12, unit: "pack", minStockLevel: 15, sku: "HHD-002", barcode: "6001234500109" },
  ];

  const products = [];
  for (const def of productDefs) {
    const product = await prisma.product.create({ data: { ...def, organizationId: organization.id } });
    products.push(product);
  }

  // Random-ish but deterministic starting stock per store.
  for (const store of stores) {
    for (const product of products) {
      const base = product.minStockLevel * 3;
      const variance = (product.name.length * 7 + store.name.length * 3) % (base || 10);
      await prisma.storeProduct.create({
        data: { storeId: store.id, productId: product.id, quantity: Math.max(base - variance, 0) },
      });
    }
  }
  // Make a couple of products intentionally low-stock at Accra for the low-stock alert demo.
  await prisma.storeProduct.updateMany({
    where: { storeId: accra.id, productId: { in: [products[0].id, products[5].id] } },
    data: { quantity: 2 },
  });

  const expenseCategories = await Promise.all(
    ["Rent", "Electricity", "Transportation", "Salaries", "Supplies", "Marketing"].map((name) =>
      prisma.expenseCategory.create({ data: { name, organizationId: organization.id } })
    )
  );

  const customerDefs = [
    { storeId: accra.id, name: "Yaw Darko", phone: "0244111222", email: "yaw.darko@example.com" },
    { storeId: accra.id, name: "Abena Kyei", phone: "0244333444", email: "abena.kyei@example.com" },
    { storeId: kumasi.id, name: "Kojo Antwi", phone: "0244555666", email: "kojo.antwi@example.com" },
    { storeId: takoradi.id, name: "Adjoa Manu", phone: "0244777888", email: "adjoa.manu@example.com" },
  ];
  const customers = [];
  for (const def of customerDefs) {
    customers.push(await prisma.customer.create({ data: def }));
  }

  // A handful of historical sales spread over the last 14 days, per store.
  const paymentMethods = ["CASH", "MOBILE_MONEY", "CARD", "BANK_TRANSFER"];
  let dayOffset = 0;
  for (const store of stores) {
    const storeCustomers = customers.filter((c) => c.storeId === store.id);
    for (let i = 0; i < 8; i++) {
      const itemCount = 1 + (i % 3);
      const chosenProducts = products.slice(i % products.length, (i % products.length) + itemCount).length
        ? products.slice(i % products.length, (i % products.length) + itemCount)
        : [products[0]];

      let subtotal = 0;
      const itemsData = chosenProducts.map((p) => {
        const quantity = 1 + (i % 3);
        const total = Number(p.sellingPrice) * quantity;
        subtotal += total;
        return { productId: p.id, quantity, unitPrice: p.sellingPrice, discount: 0, total };
      });

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - (dayOffset % 14));
      dayOffset++;

      const paymentMethod = paymentMethods[i % paymentMethods.length];
      const customer = storeCustomers.length ? storeCustomers[i % storeCustomers.length] : null;

      await prisma.sale.create({
        data: {
          storeId: store.id,
          customerId: customer?.id,
          userId: store.id === accra.id ? cashier.id : admin.id,
          receiptNumber: `INV-SEED-${store.id.slice(-4)}-${i}`,
          subtotal,
          discount: 0,
          tax: 0,
          total: subtotal,
          paymentMethod,
          status: "COMPLETED",
          createdAt,
          items: { create: itemsData },
          payments: { create: [{ method: paymentMethod, amount: subtotal }] },
        },
      });
    }

    // A couple of expenses per store.
    await prisma.expense.create({
      data: {
        storeId: store.id,
        categoryId: expenseCategories[0].id,
        description: "Monthly shop rent",
        amount: 1200,
        paymentMethod: "BANK_TRANSFER",
        date: new Date(),
        recordedById: admin.id,
      },
    });
    await prisma.expense.create({
      data: {
        storeId: store.id,
        categoryId: expenseCategories[1].id,
        description: "Electricity bill",
        amount: 250,
        paymentMethod: "MOBILE_MONEY",
        date: new Date(),
        recordedById: admin.id,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login with: admin@demo.com / manager@demo.com / cashier@demo.com, password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

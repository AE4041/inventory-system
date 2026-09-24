// Sidebar navigation tree. `roles` restricts visibility; omit to show to everyone.
export const NAV_SECTIONS = [
  {
    items: [{ label: "Dashboard", to: "/", icon: "pi-th-large" }],
  },
  {
    title: "Sales",
    items: [
      { label: "New Sale", to: "/sales/new", icon: "pi-shopping-cart" },
      { label: "Sales History", to: "/sales", icon: "pi-receipt" },
      { label: "Refunds", to: "/sales/refunds", icon: "pi-replay" },
    ],
  },
  {
    title: "Inventory",
    roles: ["ADMIN", "MANAGER"],
    items: [
      { label: "Products", to: "/inventory/products", icon: "pi-box" },
      { label: "Stock", to: "/inventory/stock", icon: "pi-warehouse" },
      { label: "Stock Adjustments", to: "/inventory/adjustments", icon: "pi-sliders-h" },
      { label: "Stock Transfers", to: "/inventory/transfers", icon: "pi-arrow-right-arrow-left" },
      { label: "Low Stock", to: "/inventory/low-stock", icon: "pi-exclamation-triangle" },
    ],
  },
  {
    title: "Customers",
    items: [{ label: "Customers", to: "/customers", icon: "pi-users" }],
  },
  {
    title: "Expenses",
    items: [
      { label: "Expenses", to: "/expenses", icon: "pi-money-bill" },
      { label: "Expense Categories", to: "/expenses/categories", icon: "pi-tags", roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    title: "Reports",
    roles: ["ADMIN", "MANAGER"],
    items: [
      { label: "Sales", to: "/reports/sales", icon: "pi-chart-line" },
      { label: "Expenses", to: "/reports/expenses", icon: "pi-chart-bar" },
      { label: "Inventory", to: "/reports/inventory", icon: "pi-database" },
      { label: "Products", to: "/reports/products", icon: "pi-star" },
      { label: "Store Performance", to: "/reports/stores", icon: "pi-building" },
      { label: "Accounts Sheet", to: "/reports/accounts-sheet", icon: "pi-calculator" },
    ],
  },
  {
    title: "Stores",
    roles: ["ADMIN"],
    items: [{ label: "Stores", to: "/stores", icon: "pi-building-columns" }],
  },
  {
    title: "Users",
    roles: ["ADMIN"],
    items: [{ label: "Users", to: "/users", icon: "pi-user-edit" }],
  },
  {
    title: "Settings",
    roles: ["ADMIN"],
    items: [
      { label: "Business Settings", to: "/settings", icon: "pi-cog" },
      { label: "MikroTik Integration", to: "/settings/mikrotik", icon: "pi-wifi" },
    ],
  },
];

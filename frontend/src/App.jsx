import { Routes, Route, Outlet } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import AppLayout from "./layouts/AppLayout";

import LoginPage from "./pages/auth/LoginPage";
import RegisterOrgPage from "./pages/auth/RegisterOrgPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import NewSalePage from "./pages/sales/NewSalePage";
import SalesHistoryPage from "./pages/sales/SalesHistoryPage";
import RefundsPage from "./pages/sales/RefundsPage";
import ProductsPage from "./pages/inventory/ProductsPage";
import StockPage from "./pages/inventory/StockPage";
import StockAdjustmentsPage from "./pages/inventory/StockAdjustmentsPage";
import StockTransfersPage from "./pages/inventory/StockTransfersPage";
import LowStockPage from "./pages/inventory/LowStockPage";
import CustomersPage from "./pages/customers/CustomersPage";
import CustomerDetailPage from "./pages/customers/CustomerDetailPage";
import ExpensesPage from "./pages/expenses/ExpensesPage";
import ExpenseCategoriesPage from "./pages/expenses/ExpenseCategoriesPage";
import SalesReportPage from "./pages/reports/SalesReportPage";
import ExpensesReportPage from "./pages/reports/ExpensesReportPage";
import InventoryReportPage from "./pages/reports/InventoryReportPage";
import ProductPerformancePage from "./pages/reports/ProductPerformancePage";
import StorePerformancePage from "./pages/reports/StorePerformancePage";
import AccountsSheetPage from "./pages/reports/AccountsSheetPage";
import StoresPage from "./pages/stores/StoresPage";
import UsersPage from "./pages/users/UsersPage";
import SettingsPage from "./pages/settings/SettingsPage";
import MikrotikIntegrationPage from "./pages/settings/MikrotikIntegrationPage";

function AuthenticatedShell() {
  return (
    <StoreProvider>
      <Outlet />
    </StoreProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterOrgPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedShell />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />

            <Route path="sales/new" element={<NewSalePage />} />
            <Route path="sales" element={<SalesHistoryPage />} />
            <Route path="sales/refunds" element={<RefundsPage />} />

            <Route element={<RequireRole roles={["ADMIN", "MANAGER"]} />}>
              <Route path="inventory/products" element={<ProductsPage />} />
              <Route path="inventory/adjustments" element={<StockAdjustmentsPage />} />
              <Route path="inventory/transfers" element={<StockTransfersPage />} />
            </Route>
            <Route path="inventory/stock" element={<StockPage />} />
            <Route path="inventory/low-stock" element={<LowStockPage />} />

            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />

            <Route path="expenses" element={<ExpensesPage />} />
            <Route element={<RequireRole roles={["ADMIN", "MANAGER"]} />}>
              <Route path="expenses/categories" element={<ExpenseCategoriesPage />} />

              <Route path="reports/sales" element={<SalesReportPage />} />
              <Route path="reports/expenses" element={<ExpensesReportPage />} />
              <Route path="reports/inventory" element={<InventoryReportPage />} />
              <Route path="reports/products" element={<ProductPerformancePage />} />
              <Route path="reports/stores" element={<StorePerformancePage />} />
              <Route path="reports/accounts-sheet" element={<AccountsSheetPage />} />
            </Route>

            <Route element={<RequireRole roles={["ADMIN"]} />}>
              <Route path="stores" element={<StoresPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/mikrotik" element={<MikrotikIntegrationPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { Button } from "@/components/ui-compat/Button";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { reportsApi } from "../../services/resources";
import { downloadCsv } from "../../utils/download";
import { formatCurrency } from "../../utils/format";

export default function InventoryReportPage() {
  const { user } = useAuth();
  const { currentStoreId, isAllStores } = useStore();
  const currency = user.organization?.currency || "GHS";

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    reportsApi
      .inventory({ storeId: currentStoreId || undefined })
      .then(({ data }) => setResult(data.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [currentStoreId]);

  function handleExport() {
    downloadCsv("/reports/inventory", { storeId: currentStoreId || undefined }, "inventory-report.csv");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <PageHeader title="Inventory Report" actions={<Button label="Export CSV" icon="pi pi-download" outlined onClick={handleExport} />} />

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard label="Total Units" value={result.totals.totalUnits.toLocaleString()} icon="pi-box" accent="blue" />
          <StatCard label="Stock Value (Cost)" value={formatCurrency(result.totals.costValue, currency)} icon="pi-wallet" accent="green" />
          <StatCard label="Stock Value (Retail)" value={formatCurrency(result.totals.retailValue, currency)} icon="pi-tag" accent="purple" />
          <StatCard label="Low Stock Items" value={result.totals.lowStockCount} icon="pi-exclamation-triangle" accent="red" />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card overflow-x-auto">
        <DataTable value={result?.items || []} loading={loading} paginator rows={20} emptyMessage={<EmptyState icon="pi-box" title="No inventory records" />}>
          {isAllStores && <Column header="Store" body={(r) => r.storeName} />}
          <Column header="Product" body={(r) => r.productName} />
          <Column header="Category" body={(r) => r.category || "-"} />
          <Column header="Quantity" body={(r) => r.quantity} />
          <Column header="Min Level" body={(r) => r.minStockLevel} />
          <Column header="Cost Value" body={(r) => formatCurrency(r.costValue, currency)} />
          <Column header="Retail Value" body={(r) => formatCurrency(r.retailValue, currency)} />
          <Column header="Status" body={(r) => (r.lowStock ? <span className="text-amber-600 text-xs font-medium">Low Stock</span> : <span className="text-emerald-600 text-xs font-medium">OK</span>)} />
        </DataTable>
      </div>
    </div>
  );
}

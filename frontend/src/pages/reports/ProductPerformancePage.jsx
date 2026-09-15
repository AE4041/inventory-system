import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import DateRangeFilter from "../../components/DateRangeFilter";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { reportsApi } from "../../services/resources";
import { dateRangeParams, isRangeReady } from "../../utils/dateRange";
import { formatCurrency } from "../../utils/format";

export default function ProductPerformancePage() {
  const { user } = useAuth();
  const { currentStoreId } = useStore();
  const currency = user.organization?.currency || "GHS";

  const [range, setRange] = useState({ preset: "this_month" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function load() {
    if (!isRangeReady(range)) return;
    setLoading(true);
    reportsApi
      .products({ ...dateRangeParams(range), storeId: currentStoreId || undefined })
      .then(({ data }) => setResult(data.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [range, currentStoreId]);

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <PageHeader title="Product Performance" actions={<DateRangeFilter value={range} onChange={setRange} />} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Best Selling Products</h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-x-auto">
            <DataTable value={result?.bestSelling || []} loading={loading} paginator rows={10} emptyMessage={<EmptyState icon="pi-star" title="No sales in this period" />}>
              <Column field="productName" header="Product" />
              <Column header="Qty Sold" body={(p) => p.quantitySold} />
              <Column header="Revenue" body={(p) => formatCurrency(p.revenue, currency)} />
            </DataTable>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Slow Moving Products (no sales this period)</h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-x-auto">
            <DataTable value={result?.slowMoving || []} loading={loading} paginator rows={10} emptyMessage={<EmptyState icon="pi-check-circle" title="Every active product sold at least once" />}>
              <Column field="productName" header="Product" />
              <Column header="Qty Sold" body={() => 0} />
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  );
}

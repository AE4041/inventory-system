import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { inventoryApi } from "../../services/resources";
import { formatCurrency } from "../../utils/format";

export default function LowStockPage() {
  const { user } = useAuth();
  const { currentStoreId, isAllStores } = useStore();
  const currency = user.organization?.currency || "GHS";

  const [rows, setRows] = useState({ data: [], pagination: { total: 0, pageSize: 50 } });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    inventoryApi
      .stock({ storeId: currentStoreId || undefined, lowStockOnly: true, pageSize: 200 })
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }, [currentStoreId]);

  return (
    <div>
      <PageHeader title="Low Stock" subtitle="Products at or below their minimum stock level" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <DataTable value={rows.data} loading={loading} paginator rows={20} emptyMessage={<EmptyState icon="pi-check-circle" title="All good — nothing is low on stock" subtitle="Products at or below their minimum level will show up here." />}>
          {isAllStores && <Column header="Store" body={(r) => r.storeName} />}
          <Column header="Product" body={(r) => r.product.name} />
          <Column header="Category" body={(r) => r.product.category?.name || "-"} />
          <Column header="Current Stock" body={(r) => <span className="text-amber-600 font-semibold">{r.quantity}</span>} />
          <Column header="Min Level" body={(r) => r.product.minStockLevel} />
          <Column header="Stock Value" body={(r) => formatCurrency(r.stockValue, currency)} />
        </DataTable>
      </div>
    </div>
  );
}

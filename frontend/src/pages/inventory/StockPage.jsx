import { Icon } from "@/icons/registry";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { InputText } from "@/components/ui/inputtext";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { inventoryApi } from "../../services/resources";
import { formatCurrency } from "../../utils/format";

export default function StockPage() {
  const { user } = useAuth();
  const { currentStoreId, isAllStores } = useStore();
  const currency = user.organization?.currency || "GHS";

  const [rows, setRows] = useState({ data: [], pagination: { total: 0, pageSize: 20 } });
  const [valuation, setValuation] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inventoryApi.valuation({ storeId: currentStoreId || undefined }).then(({ data }) => setValuation(data.data));
  }, [currentStoreId]);

  useEffect(() => {
    setLoading(true);
    inventoryApi
      .stock({ storeId: currentStoreId || undefined, page, pageSize: 20 })
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }, [currentStoreId, page]);

  const filtered = search ? rows.data.filter((r) => r.product.name.toLowerCase().includes(search.toLowerCase())) : rows.data;

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <PageHeader title="Stock" subtitle="Current inventory levels" />

      {valuation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <StatCard label="Total Units" value={valuation.totalUnits.toLocaleString()} icon="pi-box" accent="blue" />
          <StatCard label="Stock Value (Cost)" value={formatCurrency(valuation.costValue, currency)} icon="pi-wallet" accent="green" />
          <StatCard label="Stock Value (Retail)" value={formatCurrency(valuation.retailValue, currency)} icon="pi-tag" accent="purple" />
        </div>
      )}

      <div className="mb-3">
        <span className="relative w-full sm:w-80 block">
          <Icon className="pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-3.5" />
          <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by product name..." className="w-full pl-9" />
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-x-auto">
        <DataTable
          value={filtered}
          loading={loading}
          lazy
          paginator
          rows={rows.pagination.pageSize}
          totalRecords={rows.pagination.total}
          first={(page - 1) * rows.pagination.pageSize}
          onPage={(e) => setPage(e.page + 1)}
          emptyMessage={<EmptyState icon="pi-box" title="No inventory records found" />}
        >
          {isAllStores && <Column header="Store" body={(r) => r.storeName} />}
          <Column header="Product" body={(r) => r.product.name} />
          <Column header="Category" body={(r) => r.product.category?.name || "-"} />
          <Column header="Quantity" body={(r) => r.quantity} />
          <Column header="Min Level" body={(r) => r.product.minStockLevel} />
          <Column header="Stock Value" body={(r) => formatCurrency(r.stockValue, currency)} />
          <Column
            header="Status"
            body={(r) =>
              r.lowStock ? (
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700">Low Stock</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">OK</span>
              )
            }
          />
        </DataTable>
      </div>
    </div>
  );
}

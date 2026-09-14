import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { productsApi, inventoryApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { formatDateTime } from "../../utils/format";

const TYPE_OPTIONS = [
  { label: "Addition (received stock)", value: "ADDITION" },
  { label: "Deduction (damage, loss, etc.)", value: "DEDUCTION" },
  { label: "Adjustment (set exact count)", value: "ADJUSTMENT" },
];

export default function StockAdjustmentsPage() {
  const { currentStoreId, isAllStores } = useStore();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState(null);
  const [type, setType] = useState("ADDITION");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState({ data: [], pagination: { total: 0, pageSize: 20 } });
  const [page, setPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!currentStoreId) return;
    productsApi.list({ storeId: currentStoreId, active: true, pageSize: 200 }).then(({ data }) => setProducts(data.data));
  }, [currentStoreId]);

  function loadHistory() {
    setLoadingHistory(true);
    inventoryApi
      .history({ storeId: currentStoreId || undefined, page, pageSize: 20 })
      .then(({ data }) => setHistory(data))
      .finally(() => setLoadingHistory(false));
  }

  useEffect(loadHistory, [currentStoreId, page]);

  async function handleSubmit() {
    if (!productId) {
      toast.warn("Select a product");
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.adjust({ storeId: currentStoreId, productId, type, quantity, reason: reason || undefined });
      toast.success("Stock updated");
      setProductId(null);
      setQuantity(0);
      setReason("");
      loadHistory();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update stock"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Stock Adjustments" subtitle="Add, deduct, or set exact stock counts" />

      {isAllStores ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 mb-4 text-sm">
          Select a specific store from the top bar to record a stock adjustment.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">Product</label>
            <Dropdown optionValue="value"
              value={productId}
              options={products.map((p) => ({ label: `${p.name} (${p.stock} in stock)`, value: p.id }))}
              onChange={(e) => setProductId(e.value)}
              filter
              placeholder="Select product"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
            <Dropdown optionValue="value" value={type} options={TYPE_OPTIONS} onChange={(e) => setType(e.value)} className="w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{type === "ADJUSTMENT" ? "New Quantity" : "Quantity"}</label>
            <InputNumber value={quantity} onValueChange={(e) => setQuantity(e.value || 0)} min={0} className="w-full" />
          </div>
          <div>
            <Button label="Apply" className="w-full" loading={saving} onClick={handleSubmit} />
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <label className="text-sm font-medium text-gray-700 block mb-1">Reason (optional)</label>
            <InputTextarea value={reason} onChange={(e) => setReason(e.target.value)} rows={1} className="w-full" />
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-700 mb-2">History</h3>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <DataTable
          value={history.data}
          loading={loadingHistory}
          lazy
          paginator
          rows={history.pagination.pageSize}
          totalRecords={history.pagination.total}
          first={(page - 1) * history.pagination.pageSize}
          onPage={(e) => setPage(e.page + 1)}
          emptyMessage={<EmptyState icon="pi-history" title="No inventory transactions yet" subtitle="Stock additions, deductions, and adjustments will appear here." />}
        >
          <Column header="Date" body={(t) => formatDateTime(t.createdAt)} />
          {isAllStores && <Column header="Store" body={(t) => t.store?.name} />}
          <Column header="Product" body={(t) => t.product?.name} />
          <Column header="Type" body={(t) => t.type.replace("_", " ")} />
          <Column header="Change" body={(t) => (t.quantity > 0 ? `+${t.quantity}` : t.quantity)} />
          <Column header="Previous" body={(t) => t.previousQuantity} />
          <Column header="New" body={(t) => t.newQuantity} />
          <Column header="Reason" body={(t) => t.reason || "-"} />
          <Column header="By" body={(t) => t.user?.name} />
        </DataTable>
      </div>
    </div>
  );
}

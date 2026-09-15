import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { InputNumber } from "@/components/ui-compat/InputNumber";
import { Button } from "@/components/ui-compat/Button";
import { ConfirmDialog, confirmDialog } from "@/components/ui-compat/confirmDialog";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { productsApi, stockTransfersApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { formatDateTime, statusBadgeClass } from "../../utils/format";

export default function StockTransfersPage() {
  const { stores } = useStore();
  const toast = useToast();

  const [sourceStoreId, setSourceStoreId] = useState(null);
  const [destinationStoreId, setDestinationStoreId] = useState(null);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState({ data: [], pagination: { total: 0, pageSize: 20 } });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sourceStoreId) return setProducts([]);
    productsApi.list({ storeId: sourceStoreId, active: true, pageSize: 200 }).then(({ data }) => setProducts(data.data));
  }, [sourceStoreId]);

  function load() {
    setLoading(true);
    stockTransfersApi
      .list({ page, pageSize: 20 })
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function handleCreate() {
    if (!sourceStoreId || !destinationStoreId || !productId) {
      toast.warn("Fill in source store, destination store, and product");
      return;
    }
    setSaving(true);
    try {
      await stockTransfersApi.create({ sourceStoreId, destinationStoreId, productId, quantity });
      toast.success("Transfer created");
      setProductId(null);
      setQuantity(1);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not create transfer"));
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(transfer) {
    try {
      await stockTransfersApi.complete(transfer.id);
      toast.success("Transfer completed - stock added to destination store");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not complete transfer"));
    }
  }

  async function handleCancel(transfer) {
    try {
      await stockTransfersApi.cancel(transfer.id);
      toast.success("Transfer cancelled - stock restored to source store");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not cancel transfer"));
    }
  }

  const storeOptions = stores.map((s) => ({ label: s.name, value: s.id }));

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <ConfirmDialog />
      <PageHeader title="Stock Transfers" subtitle="Move inventory between stores" />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">From Store</label>
          <Dropdown optionValue="value" value={sourceStoreId} options={storeOptions.filter((s) => s.value !== destinationStoreId)} onChange={(e) => setSourceStoreId(e.value)} className="w-full" placeholder="Source" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">To Store</label>
          <Dropdown optionValue="value" value={destinationStoreId} options={storeOptions.filter((s) => s.value !== sourceStoreId)} onChange={(e) => setDestinationStoreId(e.value)} className="w-full" placeholder="Destination" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Product</label>
          <Dropdown optionValue="value"
            value={productId}
            options={products.map((p) => ({ label: `${p.name} (${p.stock} available)`, value: p.id }))}
            onChange={(e) => setProductId(e.value)}
            filter
            disabled={!sourceStoreId}
            placeholder="Select product"
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Quantity</label>
          <InputNumber value={quantity} onValueChange={(e) => setQuantity(e.value || 1)} min={1} className="w-full" />
        </div>
        <div>
          <Button label="Create Transfer" className="w-full" loading={saving} onClick={handleCreate} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-x-auto">
        <DataTable
          value={rows.data}
          loading={loading}
          lazy
          paginator
          rows={rows.pagination.pageSize}
          totalRecords={rows.pagination.total}
          first={(page - 1) * rows.pagination.pageSize}
          onPage={(e) => setPage(e.page + 1)}
          emptyMessage={<EmptyState icon="pi-arrow-right-arrow-left" title="No stock transfers yet" subtitle="Move inventory between stores using the form above." />}
        >
          <Column header="Date" body={(t) => formatDateTime(t.createdAt)} />
          <Column header="Product" body={(t) => t.product?.name} />
          <Column header="From" body={(t) => t.sourceStore?.name} />
          <Column header="To" body={(t) => t.destinationStore?.name} />
          <Column header="Quantity" body={(t) => t.quantity} />
          <Column header="Created By" body={(t) => t.createdBy?.name} />
          <Column header="Status" body={(t) => <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadgeClass(t.status)}`}>{t.status}</span>} />
          <Column
            header="Actions"
            body={(t) =>
              t.status === "PENDING" ? (
                <div className="flex gap-1">
                  <Button
                    icon="pi pi-check"
                    text
                    rounded
                    severity="success"
                    tooltip="Mark received"
                    onClick={() =>
                      confirmDialog({
                        message: `Confirm ${t.product?.name} (${t.quantity}) received at ${t.destinationStore?.name}?`,
                        header: "Complete Transfer",
                        accept: () => handleComplete(t),
                      })
                    }
                  />
                  <Button
                    icon="pi pi-times"
                    text
                    rounded
                    severity="danger"
                    tooltip="Cancel"
                    onClick={() =>
                      confirmDialog({
                        message: `Cancel this transfer and restore stock to ${t.sourceStore?.name}?`,
                        header: "Cancel Transfer",
                        accept: () => handleCancel(t),
                      })
                    }
                  />
                </div>
              ) : (
                "-"
              )
            }
          />
        </DataTable>
      </div>
    </div>
  );
}

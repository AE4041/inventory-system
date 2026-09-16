import { Icon } from "@/icons/registry";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { Button } from "@/components/ui-compat/Button";
import { InputText } from "@/components/ui/inputtext";
import { InputNumber } from "@/components/ui-compat/InputNumber";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { InputTextarea } from "@/components/ui-compat/InputTextarea";
import { Dialog } from "@/components/ui-compat/Dialog";
import { ToggleButton } from "@/components/ui-compat/ToggleButton";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { productsApi, categoriesApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/format";

const EMPTY_FORM = {
  name: "",
  categoryId: null,
  description: "",
  costPrice: 0,
  sellingPrice: 0,
  unit: "pcs",
  minStockLevel: 0,
  sku: "",
  barcode: "",
  imageUrl: "",
  active: true,
};

export default function ProductsPage() {
  const { user } = useAuth();
  const { currentStoreId } = useStore();
  const toast = useToast();
  const currency = user.organization?.currency || "GHS";

  const [products, setProducts] = useState({ data: [], pagination: { total: 0, pageSize: 20 } });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [priceDialogProduct, setPriceDialogProduct] = useState(null);
  const [priceForm, setPriceForm] = useState({ costPrice: 0, sellingPrice: 0 });
  const [savingPrice, setSavingPrice] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function load() {
    setLoading(true);
    productsApi
      .list({ storeId: currentStoreId || undefined, search: search || undefined, page, pageSize: 20 })
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, currentStoreId]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description || "",
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      unit: product.unit,
      minStockLevel: product.minStockLevel,
      sku: product.sku || "",
      barcode: product.barcode || "",
      imageUrl: product.imageUrl || "",
      active: product.active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        await productsApi.update(editingId, form);
        toast.success("Product updated");
      } else {
        await productsApi.create(form);
        toast.success("Product created");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save product"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(product) {
    try {
      await productsApi.remove(product.id);
      toast.success("Product deactivated");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not deactivate product"));
    }
  }

  function openPriceDialog(product) {
    setPriceDialogProduct(product);
    setPriceForm({ costPrice: Number(product.costPrice), sellingPrice: Number(product.sellingPrice) });
  }

  async function handleSavePrice() {
    setSavingPrice(true);
    try {
      await productsApi.setStorePrice(priceDialogProduct.id, { storeId: currentStoreId, ...priceForm });
      toast.success("Store price updated");
      setPriceDialogProduct(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update store price"));
    } finally {
      setSavingPrice(false);
    }
  }

  async function handleResetPrice() {
    setSavingPrice(true);
    try {
      await productsApi.setStorePrice(priceDialogProduct.id, { storeId: currentStoreId, costPrice: null, sellingPrice: null });
      toast.success("Reset to the default price");
      setPriceDialogProduct(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not reset store price"));
    } finally {
      setSavingPrice(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <PageHeader
        title="Products"
        subtitle={
          currentStoreId
            ? "Prices shown are this store's — set a different price here if it should charge more or less than the default."
            : "Manage your product catalog. Stock levels and per-store prices are set on a specific store."
        }
        actions={<Button label="Add Product" icon="pi pi-plus" onClick={openCreate} />}
      />

      <div className="mb-3">
        <span className="relative w-full sm:w-80 block">
          <Icon className="pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 size-3.5" />
          <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9" />
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card overflow-x-auto">
        <DataTable
          value={products.data}
          loading={loading}
          lazy
          paginator
          rows={products.pagination.pageSize}
          totalRecords={products.pagination.total}
          first={(page - 1) * products.pagination.pageSize}
          onPage={(e) => setPage(e.page + 1)}
          emptyMessage={
            <EmptyState
              icon="pi-box"
              title="No products found"
              subtitle="Add your first product to start building your catalog."
              action={<Button label="Add Product" icon="pi pi-plus" size="small" onClick={openCreate} />}
            />
          }
        >
          <Column field="name" header="Name" />
          <Column header="Category" body={(p) => p.category?.name || "-"} />
          <Column header="Cost Price" body={(p) => formatCurrency(p.costPrice, currency)} />
          <Column
            header="Selling Price"
            body={(p) => (
              <span className="flex items-center gap-1.5">
                {formatCurrency(p.sellingPrice, currency)}
                {currentStoreId && p.hasPriceOverride && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-violet-50 text-violet-600">custom</span>
                )}
              </span>
            )}
          />
          <Column field="unit" header="Unit" />
          {currentStoreId && <Column header="Stock" body={(p) => <span className={p.lowStock ? "text-amber-600 font-medium" : ""}>{p.stock}</span>} />}
          <Column header="Status" body={(p) => (p.active ? <span className="text-emerald-600 text-xs font-medium">Active</span> : <span className="text-gray-400 dark:text-gray-500 text-xs">Inactive</span>)} />
          <Column
            header="Actions"
            body={(p) => (
              <div className="flex gap-1">
                <Button icon="pi pi-pencil" text rounded onClick={() => openEdit(p)} tooltip="Edit product" />
                {currentStoreId && (
                  <Button icon="pi pi-money-bill" text rounded severity="help" onClick={() => openPriceDialog(p)} tooltip="Price for this store" />
                )}
                {p.active && <Button icon="pi pi-eye-slash" text rounded severity="danger" tooltip="Deactivate" onClick={() => handleDeactivate(p)} />}
              </div>
            )}
          />
        </DataTable>
      </div>

      <Dialog header={editingId ? "Edit Product" : "Add Product"} visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "32rem" }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Name</label>
            <InputText value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Category</label>
            <Dropdown optionValue="value"
              value={form.categoryId}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              onChange={(e) => update("categoryId", e.value)}
              className="w-full"
              showClear
              placeholder="None"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Unit</label>
            <InputText value={form.unit} onChange={(e) => update("unit", e.target.value)} className="w-full" placeholder="pcs, bottle, bag..." />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Cost Price</label>
            <InputNumber value={form.costPrice} onValueChange={(e) => update("costPrice", e.value || 0)} mode="decimal" minFractionDigits={2} className="w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Selling Price</label>
            <InputNumber value={form.sellingPrice} onValueChange={(e) => update("sellingPrice", e.value || 0)} mode="decimal" minFractionDigits={2} className="w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Min Stock Level</label>
            <InputNumber value={form.minStockLevel} onValueChange={(e) => update("minStockLevel", e.value || 0)} className="w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">SKU</label>
            <InputText value={form.sku} onChange={(e) => update("sku", e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Barcode</label>
            <InputText value={form.barcode} onChange={(e) => update("barcode", e.target.value)} className="w-full" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Image URL (optional)</label>
            <InputText value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} className="w-full" />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Description</label>
            <InputTextarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} className="w-full" />
          </div>
          <div className="col-span-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
            <ToggleButton checked={form.active} onChange={(e) => update("active", e.value)} onLabel="Active" offLabel="Inactive" />
          </div>
        </div>

        <Button label="Save Product" className="w-full mt-4" loading={saving} onClick={handleSave} disabled={!form.name} />
      </Dialog>

      <Dialog header={`Price at this store — ${priceDialogProduct?.name ?? ""}`} visible={!!priceDialogProduct} onHide={() => setPriceDialogProduct(null)} style={{ width: "24rem" }}>
        {priceDialogProduct && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Cost Price</label>
              <InputNumber value={priceForm.costPrice} onValueChange={(e) => setPriceForm((f) => ({ ...f, costPrice: e.value || 0 }))} mode="decimal" minFractionDigits={2} className="w-full" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Default: {formatCurrency(priceDialogProduct.defaultCostPrice, currency)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Selling Price</label>
              <InputNumber value={priceForm.sellingPrice} onValueChange={(e) => setPriceForm((f) => ({ ...f, sellingPrice: e.value || 0 }))} mode="decimal" minFractionDigits={2} className="w-full" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Default: {formatCurrency(priceDialogProduct.defaultSellingPrice, currency)}</p>
            </div>

            <Button label="Save Price for This Store" className="w-full" loading={savingPrice} onClick={handleSavePrice} />
            {priceDialogProduct.hasPriceOverride && (
              <Button label="Reset to Default Price" className="w-full" text severity="secondary" loading={savingPrice} onClick={handleResetPrice} />
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { storesApi, mikrotikApi, productsApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";

const API_BASE = `${window.location.origin}/api`;

export default function MikrotikIntegrationPage() {
  const { stores } = useStore();
  const toast = useToast();

  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? null);
  const [hasToken, setHasToken] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [checkingToken, setCheckingToken] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [mappings, setMappings] = useState([]);
  const [products, setProducts] = useState([]);
  const [profileName, setProfileName] = useState("");
  const [productId, setProductId] = useState(null);
  const [savingMapping, setSavingMapping] = useState(false);
  const [closingDay, setClosingDay] = useState(false);

  useEffect(() => {
    productsApi.list({ active: true, pageSize: 200 }).then(({ data }) => setProducts(data.data));
    loadMappings();
  }, []);

  useEffect(() => {
    if (!selectedStoreId) return;
    setNewToken(null);
    setCheckingToken(true);
    storesApi
      .getMikrotikStatus(selectedStoreId)
      .then(({ data }) => setHasToken(data.data.hasToken))
      .finally(() => setCheckingToken(false));
  }, [selectedStoreId]);

  function loadMappings() {
    mikrotikApi.listMappings().then(({ data }) => setMappings(data.data));
  }

  async function handleGenerateToken() {
    setGenerating(true);
    try {
      const { data } = await storesApi.regenerateMikrotikToken(selectedStoreId);
      setNewToken(data.data.mikrotikToken);
      setHasToken(true);
      toast.success("New token generated — copy it now, it won't be shown again");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not generate token"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveMapping() {
    if (!profileName.trim() || !productId) return;
    setSavingMapping(true);
    try {
      await mikrotikApi.upsertMapping({ profileName: profileName.trim(), productId });
      toast.success("Mapping saved");
      setProfileName("");
      setProductId(null);
      loadMappings();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save mapping"));
    } finally {
      setSavingMapping(false);
    }
  }

  async function handleDeleteMapping(mapping) {
    try {
      await mikrotikApi.deleteMapping(mapping.id);
      loadMappings();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete mapping"));
    }
  }

  async function handleCloseDayNow() {
    setClosingDay(true);
    try {
      const { data } = await mikrotikApi.closeDay();
      const totalSales = data.data.reduce((sum, r) => sum + r.sales.length, 0);
      toast.success(totalSales > 0 ? `Created ${totalSales} sale(s) from pending redemptions` : "No pending redemptions to close out");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Close-day failed"));
    } finally {
      setClosingDay(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="MikroTik Voucher Integration" subtitle="Connect each router's hotspot voucher sales to this store's inventory and reports." />

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">1. Store Token</h3>
        <p className="text-xs text-gray-500 mb-3">Each store/router needs its own token, used by the router's scripts to authenticate with the API.</p>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Dropdown
            value={selectedStoreId}
            options={stores.map((s) => ({ label: s.name, value: s.id }))}
            onChange={(e) => setSelectedStoreId(e.value)}
            optionValue="value"
            className="w-56"
            placeholder="Select store"
          />
          <Button label={hasToken ? "Regenerate Token" : "Generate Token"} icon="pi pi-key" loading={generating} onClick={handleGenerateToken} disabled={!selectedStoreId} outlined={hasToken} />
          {!checkingToken && hasToken && !newToken && <span className="text-xs text-emerald-600 font-medium">A token already exists for this store</span>}
        </div>

        {newToken && (
          <div className="space-y-2">
            <Message severity="warn" text="Copy this now — it won't be shown again. Regenerating replaces it and breaks any script still using the old one." className="w-full" />
            <InputText value={newToken} readOnly className="w-full font-mono text-xs" onClick={(e) => e.target.select()} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">2. Endpoints for your router scripts</h3>
        <p className="text-xs text-gray-500 mb-3">
          Append <code className="bg-gray-100 px-1 rounded">?token=YOUR_STORE_TOKEN</code> to each URL. Replace the domain if this app is deployed somewhere other than where you're viewing it right now.
        </p>
        <div className="space-y-1.5 font-mono text-xs bg-gray-50 rounded-lg p-3 border border-gray-100">
          <p><span className="text-gray-400">redeemed:</span> POST {API_BASE}/integrations/mikrotik/vouchers/redeemed</p>
          <p><span className="text-gray-400">close-day:</span> POST {API_BASE}/integrations/mikrotik/vouchers/close-day</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-700">3. Profile → Product Mapping</h3>
          <Button label="Close Today's Vouchers Now" icon="pi pi-check-circle" size="small" text loading={closingDay} onClick={handleCloseDayNow} />
        </div>
        <p className="text-xs text-gray-500 mb-3">Map each MikroTik hotspot profile name to a product, so a redemption knows what it sold.</p>

        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Profile Name (exact)</label>
            <InputText value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="e.g. 24hours" className="w-40" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Product</label>
            <Dropdown
              value={productId}
              options={products.map((p) => ({ label: p.name, value: p.id }))}
              onChange={(e) => setProductId(e.value)}
              optionValue="value"
              filter
              className="w-56"
              placeholder="Select product"
            />
          </div>
          <Button label="Save Mapping" loading={savingMapping} onClick={handleSaveMapping} disabled={!profileName.trim() || !productId} />
        </div>

        <DataTable value={mappings} emptyMessage={<EmptyState icon="pi-sitemap" title="No profile mappings yet" subtitle="Add one above for each voucher plan you sell." />}>
          <Column field="profileName" header="MikroTik Profile" />
          <Column header="Product" body={(m) => m.product.name} />
          <Column header="" body={(m) => <Button icon="pi pi-trash" text rounded severity="danger" onClick={() => handleDeleteMapping(m)} />} />
        </DataTable>
      </div>
    </div>
  );
}

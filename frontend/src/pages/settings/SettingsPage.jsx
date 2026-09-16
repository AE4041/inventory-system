import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTab } from "@/components/ui/tabs";
import { InputText } from "@/components/ui/inputtext";
import { InputNumber } from "@/components/ui-compat/InputNumber";
import { Button } from "@/components/ui-compat/Button";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { organizationApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";

const PAYMENT_METHODS = ["Cash", "Mobile Money", "Card", "Bank Transfer", "Other"];

export default function SettingsPage() {
  const { refreshUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: "", currency: "GHS", taxRate: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    organizationApi.get().then(({ data }) => setForm({ name: data.data.name, currency: data.data.currency, taxRate: Number(data.data.taxRate) }));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await organizationApi.update(form);
      await refreshUser();
      toast.success("Settings saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <PageHeader title="Settings" />

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card max-w-2xl overflow-hidden">
        <Tabs defaultValue="business">
          <TabsList>
            <TabsTab value="business">Business Settings</TabsTab>
            <TabsTab value="tax">Tax Settings</TabsTab>
            <TabsTab value="receipt">Receipt Settings</TabsTab>
            <TabsTab value="payment">Payment Methods</TabsTab>
          </TabsList>
          <TabsPanels>
            <TabsPanel value="business">
              <div className="space-y-4 max-w-sm pt-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Business Name</label>
                  <InputText value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Currency Code</label>
                  <InputText value={form.currency} onChange={(e) => update("currency", e.target.value.toUpperCase())} className="w-full" maxLength={6} />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">e.g. GHS, USD, NGN, KES</p>
                </div>
                <Button label="Save Changes" loading={saving} onClick={handleSave} />
              </div>
            </TabsPanel>

            <TabsPanel value="tax">
              <div className="space-y-4 max-w-sm pt-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Sales Tax Rate (%)</label>
                  <InputNumber value={form.taxRate} onValueChange={(e) => update("taxRate", e.value || 0)} suffix="%" min={0} max={100} className="w-full" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Applied automatically to every new sale, after discounts.</p>
                </div>
                <Button label="Save Changes" loading={saving} onClick={handleSave} />
              </div>
            </TabsPanel>

            <TabsPanel value="receipt">
              <div className="pt-2 text-sm text-gray-600 dark:text-gray-300 space-y-2 max-w-sm">
                <p>Receipts automatically include your business name, store details, receipt number, items, totals, and payment method.</p>
                <p>Store contact details (address, phone, email) come from each store's profile under <span className="font-medium">Stores</span>.</p>
              </div>
            </TabsPanel>

            <TabsPanel value="payment">
              <div className="pt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Payment methods available at checkout:</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <span key={m} className="text-xs font-medium px-3 py-1.5 rounded-full bg-violet-50 text-violet-600">{m}</span>
                  ))}
                </div>
              </div>
            </TabsPanel>
          </TabsPanels>
        </Tabs>
      </div>
    </div>
  );
}

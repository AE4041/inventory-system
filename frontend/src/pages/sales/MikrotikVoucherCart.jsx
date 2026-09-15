import { Icon } from "@/icons/registry";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui-compat/Button";
import { Dialog } from "@/components/ui-compat/Dialog";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { InputNumber } from "@/components/ui-compat/InputNumber";
import { InputText } from "@/components/ui/inputtext";
import { confirmDialog, ConfirmDialog } from "@/components/ui-compat/confirmDialog";
import { mikrotikApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import { useToast } from "../../context/ToastContext";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Read-only-by-default preview of today's not-yet-closed-out MikroTik voucher redemptions
// for the current store, grouped by plan just like the receipt close-out will produce.
// Actual close-out still only happens via the router's own trigger, the daily cron
// fallback, or the "Close Today's Vouchers Now" button in Settings — this screen never
// creates a Sale, it only lets an admin correct what's about to be counted.
export default function MikrotikVoucherCart({ storeId, currency }) {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [addVisible, setAddVisible] = useState(false);
  const [addForm, setAddForm] = useState({ productId: null, quantity: 1, note: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    if (!storeId) return;
    setLoading(true);
    mikrotikApi
      .getPending(storeId)
      .then(({ data }) => setSummary(data.data))
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load pending vouchers")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  function openAddDialog() {
    if (mappings.length === 0) {
      mikrotikApi
        .listMappings()
        .then(({ data }) => setMappings(data.data))
        .catch((err) => toast.error(apiErrorMessage(err, "Could not load voucher plans")));
    }
    setAddForm({ productId: null, quantity: 1, note: "" });
    setAddVisible(true);
  }

  async function handleAddManual() {
    if (!addForm.productId || !addForm.quantity) return;
    setSaving(true);
    try {
      await mikrotikApi.addPending({ storeId, productId: addForm.productId, quantity: addForm.quantity, note: addForm.note || undefined });
      toast.success("Added to today's voucher cart");
      setAddVisible(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not add voucher"));
    } finally {
      setSaving(false);
    }
  }

  function handleRemove(redemption, productName) {
    confirmDialog({
      message: `Remove this ${productName} voucher${redemption.voucherCode ? ` (${redemption.voucherCode})` : ""}? Its stock unit will be restored.`,
      header: "Remove Voucher",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await mikrotikApi.removePending(redemption.id);
          toast.success("Removed from today's voucher cart");
          load();
        } catch (err) {
          toast.error(apiErrorMessage(err, "Could not remove voucher"));
        }
      },
    });
  }

  const items = summary?.items || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card flex flex-col max-w-2xl mx-auto">
      <ConfirmDialog />
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">Today's MikroTik Vouchers</p>
          <p className="text-xs text-gray-400">Waiting to be closed out into today's sale</p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon="pi pi-refresh" text rounded onClick={load} loading={loading} tooltip="Refresh" />
          <Button icon="pi pi-plus" label="Add" outlined size="small" onClick={openAddDialog} />
        </div>
      </div>

      {summary?.olderPendingCount > 0 && (
        <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 text-amber-700 text-xs rounded-lg flex items-center gap-2">
          <Icon className="pi-info-circle" />
          {summary.olderPendingCount} redemption{summary.olderPendingCount === 1 ? "" : "s"} from earlier day(s) are also pending and will be closed out separately.
        </div>
      )}

      <div className="flex-1 divide-y divide-gray-100">
        {!loading && items.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">No vouchers redeemed yet today</p>
        )}
        {items.map((item) => {
          const expanded = expandedProductId === item.productId;
          return (
            <div key={item.productId}>
              <button
                onClick={() => setExpandedProductId(expanded ? null : item.productId)}
                className="w-full p-3 flex items-center gap-2 text-left hover:bg-gray-50"
              >
                <Icon className={`${expanded ? "pi-chevron-down" : "pi-chevron-right"} text-xs text-gray-400`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice, currency)} each</p>
                </div>
                <span className="text-sm text-gray-500 w-14 text-right">x{item.quantity}</span>
                <span className="text-sm font-semibold text-gray-900 w-24 text-right">{formatCurrency(item.total, currency)}</span>
              </button>
              {expanded && (
                <div className="bg-gray-50 px-3 pb-2">
                  {item.redemptions.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 py-1.5 pl-6 text-xs">
                      <span className="flex-1 text-gray-600 font-mono">{r.voucherCode || "(manually added)"}</span>
                      <span className="text-gray-400">{formatTime(r.redeemedAt)}</span>
                      <button onClick={() => handleRemove(r, item.productName)} className="text-gray-300 hover:text-red-500">
                        <Icon className="pi-trash" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100 space-y-2">
        <div className="flex items-center justify-between text-lg font-bold text-gray-900">
          <span>Grand Total</span>
          <span>{formatCurrency(summary?.grandTotal || 0, currency)}</span>
        </div>
        <p className="text-xs text-gray-400 text-center pt-1">
          This is a preview only — vouchers are closed out automatically at end of day (router trigger or the daily backup job), or manually from{" "}
          <Link to="/settings/mikrotik" className="text-violet-600 hover:underline">Settings → MikroTik Integration</Link>.
        </p>
      </div>

      <Dialog header="Add Manual Voucher" visible={addVisible} onHide={() => setAddVisible(false)} style={{ width: "24rem" }}>
        <div className="space-y-3">
          <Dropdown optionValue="value"
            value={addForm.productId}
            options={mappings.map((m) => ({ label: m.product.name, value: m.productId }))}
            onChange={(e) => setAddForm((f) => ({ ...f, productId: e.value }))}
            placeholder={mappings.length ? "Select a plan" : "Loading plans..."}
            className="w-full"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Quantity</span>
            <InputNumber value={addForm.quantity} onValueChange={(e) => setAddForm((f) => ({ ...f, quantity: e.value }))} showButtons min={1} max={500} className="w-32" inputClassName="w-10 text-center" />
          </div>
          <InputText placeholder="Note (optional)" value={addForm.note} onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))} className="w-full" />
          <Button label="Add to Cart" className="w-full" onClick={handleAddManual} disabled={!addForm.productId || !addForm.quantity} loading={saving} />
        </div>
      </Dialog>
    </div>
  );
}

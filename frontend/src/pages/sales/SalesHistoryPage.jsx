import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { Button } from "@/components/ui-compat/Button";
import { confirmDialog } from "@/components/ui-compat/confirmDialog";
import { ConfirmDialog } from "@/components/ui-compat/confirmDialog";
import { InputTextarea } from "@/components/ui-compat/InputTextarea";
import { Dialog } from "@/components/ui-compat/Dialog";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import DateRangeFilter from "../../components/DateRangeFilter";
import ReceiptDialog from "../../components/ReceiptDialog";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { salesApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { dateRangeParams, isRangeReady } from "../../utils/dateRange";
import { formatCurrency, formatDateTime, statusBadgeClass } from "../../utils/format";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

const PAYMENT_OPTIONS = [
  { label: "All Payment Methods", value: "" },
  { label: "Cash", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Card", value: "CARD" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Other", value: "OTHER" },
];

// `fixedStatus` lets the Refunds page reuse this table pre-filtered to REFUNDED sales.
export default function SalesHistoryPage({ fixedStatus }) {
  const { user } = useAuth();
  const { currentStoreId } = useStore();
  const toast = useToast();
  const currency = user.organization?.currency || "GHS";
  const canManage = user.role === "ADMIN" || user.role === "MANAGER";

  const [range, setRange] = useState({ preset: "this_month" });
  const [status, setStatus] = useState(fixedStatus || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [rows, setRows] = useState({ data: [], pagination: { total: 0, pageSize: 20 } });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);
  const [actionDialog, setActionDialog] = useState(null); // { sale, type: 'refund' | 'cancel' }
  const [reason, setReason] = useState("");

  function load() {
    if (!isRangeReady(range)) return;
    setLoading(true);
    salesApi
      .list({
        ...dateRangeParams(range),
        storeId: currentStoreId || undefined,
        status: status || undefined,
        paymentMethod: paymentMethod || undefined,
        page,
        pageSize: 20,
      })
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, status, paymentMethod, currentStoreId, page]);

  async function submitAction() {
    try {
      if (actionDialog.type === "refund") {
        await salesApi.refund(actionDialog.sale.id, { reason });
        toast.success("Sale refunded and stock restored");
      } else {
        await salesApi.cancel(actionDialog.sale.id, { reason });
        toast.success("Sale cancelled and stock restored");
      }
      setActionDialog(null);
      setReason("");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Action failed"));
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <ConfirmDialog />
      <PageHeader
        title={fixedStatus === "REFUNDED" ? "Refunds" : "Sales History"}
        actions={
          <div className="flex flex-wrap gap-2">
            <DateRangeFilter value={range} onChange={setRange} />
            {!fixedStatus && <Dropdown optionValue="value" value={status} options={STATUS_OPTIONS} onChange={(e) => setStatus(e.value)} className="w-40" />}
            <Dropdown optionValue="value" value={paymentMethod} options={PAYMENT_OPTIONS} onChange={(e) => setPaymentMethod(e.value)} className="w-48" />
          </div>
        }
      />

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
          emptyMessage={<EmptyState icon="pi-receipt" title="No sales found" subtitle="Try a different date range, store, or filter." />}
        >
          <Column field="receiptNumber" header="Receipt #" />
          <Column header="Date" body={(s) => formatDateTime(s.createdAt)} />
          <Column header="Store" body={(s) => s.store?.name} />
          <Column header="Customer" body={(s) => s.customer?.name || "Walk-in"} />
          <Column header="Cashier" body={(s) => s.cashier?.name} />
          <Column header="Items" body={(s) => s.items?.length} />
          <Column header="Total" body={(s) => formatCurrency(s.total, currency)} />
          <Column header="Payment" body={(s) => s.paymentMethod.replace("_", " ")} />
          <Column header="Status" body={(s) => <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadgeClass(s.status)}`}>{s.status}</span>} />
          <Column
            header="Actions"
            body={(s) => (
              <div className="flex gap-1">
                <Button icon="pi pi-receipt" text rounded onClick={() => setViewingSale(s)} tooltip="View receipt" />
                {canManage && s.status === "COMPLETED" && (
                  <>
                    <Button
                      icon="pi pi-replay"
                      text
                      rounded
                      severity="warning"
                      tooltip="Refund"
                      onClick={() =>
                        confirmDialog({
                          message: `Refund ${s.receiptNumber}? Stock will be restored.`,
                          header: "Confirm Refund",
                          icon: "pi pi-exclamation-triangle",
                          accept: () => setActionDialog({ sale: s, type: "refund" }),
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
                          message: `Cancel ${s.receiptNumber}? Stock will be restored.`,
                          header: "Confirm Cancellation",
                          icon: "pi pi-exclamation-triangle",
                          accept: () => setActionDialog({ sale: s, type: "cancel" }),
                        })
                      }
                    />
                  </>
                )}
              </div>
            )}
          />
        </DataTable>
      </div>

      <ReceiptDialog sale={viewingSale} visible={!!viewingSale} onHide={() => setViewingSale(null)} />

      <Dialog header={actionDialog?.type === "refund" ? "Refund Sale" : "Cancel Sale"} visible={!!actionDialog} onHide={() => setActionDialog(null)} style={{ width: "24rem" }}>
        <p className="text-sm text-gray-500 mb-2">Optional reason (visible in inventory history)</p>
        <InputTextarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full mb-3" />
        <Button label="Confirm" className="w-full" severity={actionDialog?.type === "refund" ? "warning" : "danger"} onClick={submitAction} />
      </Dialog>
    </div>
  );
}

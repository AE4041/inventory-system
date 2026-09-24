import { useEffect, useState } from "react";
import { Icon } from "@/icons/registry";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { Button } from "@/components/ui-compat/Button";
import { Dialog } from "@/components/ui-compat/Dialog";
import { InputText } from "@/components/ui/inputtext";
import { InputNumber } from "@/components/ui-compat/InputNumber";
import { DatePicker as Calendar } from "@/components/ui-compat/DatePicker";
import { confirmDialog, ConfirmDialog } from "@/components/ui-compat/confirmDialog";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { reportsApi, expensesApi, expenseCategoriesApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { downloadCsv, openPdfBlob } from "../../utils/download";
import { formatCurrency } from "../../utils/format";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, i) => ({ label, value: i + 1 }));

const now = new Date();
const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => ({ label: String(y), value: y }));

const TC_LEGEND = [
  { code: "S", label: "New sales" },
  { code: "P", label: "Sales marked paid" },
  { code: "D", label: "Deposit to bank" },
  { code: "E", label: "Expense" },
  { code: "L", label: "Refund / loss" },
];

const PAYMENT_OPTIONS = [
  { label: "Cash", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Card", value: "CARD" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Other", value: "OTHER" },
];

const RECORD_TYPES = [
  { label: "Sale", value: "sale" },
  { label: "Expense", value: "expense" },
];

const EMPTY_SALE_FORM = { date: new Date(), description: "", amount: 0 };
const EMPTY_EXPENSE_FORM = { date: new Date(), categoryId: null, description: "", amount: 0, paymentMethod: "CASH" };

function dayOf(dateStr) {
  return String(new Date(dateStr).getDate()).padStart(2, "0");
}

export default function AccountsSheetPage() {
  const { currentStoreId, isAllStores } = useStore();
  const toast = useToast();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [recordType, setRecordType] = useState("sale");
  const [saleForm, setSaleForm] = useState(EMPTY_SALE_FORM);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  function load() {
    if (!currentStoreId) return;
    setLoading(true);
    reportsApi
      .accountsSheet({ storeId: currentStoreId, year, month })
      .then(({ data }) => setResult(data.data))
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load the accounts sheet")))
      .finally(() => setLoading(false));
  }

  useEffect(load, [currentStoreId, year, month]);

  useEffect(() => {
    expenseCategoriesApi.list().then(({ data }) => setCategories(data.data)).catch(() => {});
  }, []);

  async function handleExportCsv() {
    setExporting(true);
    try {
      await downloadCsv("/reports/accounts-sheet", { storeId: currentStoreId, year, month }, `${result?.storeName || "accounts-sheet"}-${year}-${String(month).padStart(2, "0")}.csv`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not export CSV"));
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      await openPdfBlob("/reports/accounts-sheet/pdf", { storeId: currentStoreId, year, month });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not export PDF"));
    } finally {
      setExporting(false);
    }
  }

  function openAddDialog() {
    setRecordType("sale");
    setSaleForm(EMPTY_SALE_FORM);
    setExpenseForm(EMPTY_EXPENSE_FORM);
    setDialogOpen(true);
  }

  async function handleSaveRecord() {
    setSaving(true);
    try {
      if (recordType === "sale") {
        await reportsApi.addManualSaleEntry({ storeId: currentStoreId, date: saleForm.date, description: saleForm.description, amount: saleForm.amount });
        toast.success("Manual sale recorded");
      } else {
        await expensesApi.create({ storeId: currentStoreId, ...expenseForm });
        toast.success("Expense recorded");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save the record"));
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteEntry(row) {
    confirmDialog({
      message: `Remove "${row.description}"? This can't be undone.`,
      header: "Remove Manual Entry",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await reportsApi.removeManualSaleEntry(row.id);
          toast.success("Entry removed");
          load();
        } catch (err) {
          toast.error(apiErrorMessage(err, "Could not remove entry"));
        }
      },
    });
  }

  const canSaveSale = saleForm.description.trim() && saleForm.amount > 0;
  const canSaveExpense = expenseForm.categoryId && expenseForm.description.trim() && expenseForm.amount > 0;

  if (isAllStores) {
    return (
      <div className="mx-auto w-full">
        <PageHeader title="Accounts Sheet" />
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-10 text-center text-gray-500 dark:text-gray-400">
          <Icon className="pi-info-circle text-2xl mb-2 block" />
          Select a specific store from the top bar to view its accounts sheet.
        </div>
      </div>
    );
  }

  const currency = result?.currency || "GHS";
  const summary = result?.summary;

  return (
    <div className="mx-auto w-full">
      <ConfirmDialog />
      <PageHeader
        title="Accounts Sheet"
        subtitle="Monthly sales, confirmed payments, expenses and refunds — same format as your paper ledger."
        actions={
          <div className="flex flex-wrap gap-2">
            <Dropdown optionValue="value" value={month} options={MONTHS} onChange={(e) => setMonth(e.value)} className="w-36" />
            <Dropdown optionValue="value" value={year} options={YEARS} onChange={(e) => setYear(e.value)} className="w-28" />
            <Button label="Add Record" icon="pi pi-plus" onClick={openAddDialog} />
            <Button label="Export CSV" icon="pi pi-download" outlined loading={exporting} onClick={handleExportCsv} />
            <Button label="Export PDF" icon="pi pi-file-pdf" outlined loading={exporting} onClick={handleExportPdf} />
          </div>
        }
      />

      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-4 mb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
            <p className="font-semibold text-gray-900 dark:text-white">{result.businessName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{result.storeName} &middot; {result.monthLabel}</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {TC_LEGEND.map((t) => (
              <span key={t.code} className="text-xs text-gray-400 dark:text-gray-500">
                <span className="font-semibold text-gray-600 dark:text-gray-300">{t.code}</span> = {t.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card overflow-x-auto mb-4">
        <DataTable
          value={result?.rows || []}
          loading={loading}
          emptyMessage={<EmptyState icon="pi-calculator" title="No activity this month" subtitle="Sales, payments, expenses and refunds for this store will show up here." />}
        >
          <Column header="Date" body={(r) => dayOf(r.date)} className="border-r border-gray-200 dark:border-gray-700" />
          <Column header="Transaction Description" field="description" className="border-r border-gray-200 dark:border-gray-700" />
          <Column header="TC" body={(r) => <span className="font-mono font-semibold">{r.tc}</span>} className="border-r border-gray-200 dark:border-gray-700" />
          <Column header="Receipts In" body={(r) => (r.receiptsIn ? formatCurrency(r.receiptsIn, currency) : "")} className="border-r border-gray-200 dark:border-gray-700" />
          <Column header="Receipts Out" body={(r) => (r.receiptsOut ? formatCurrency(r.receiptsOut, currency) : "")} className="border-r border-gray-200 dark:border-gray-700" />
          <Column header="Primary In" body={(r) => (r.primaryIn ? formatCurrency(r.primaryIn, currency) : "")} className="border-r border-gray-200 dark:border-gray-700" />
          <Column header="Primary Out" body={(r) => (r.primaryOut ? formatCurrency(r.primaryOut, currency) : "")} className="border-r border-gray-200 dark:border-gray-700" />
          <Column
            header=""
            body={(r) =>
              r.source === "manual-sale" ? (
                <button onClick={() => handleDeleteEntry(r)} className="text-gray-300 hover:text-red-500">
                  <Icon className="pi-trash text-sm" />
                </button>
              ) : null
            }
          />
        </DataTable>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Receipts</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">IN</span><span className="text-gray-900 dark:text-white">{formatCurrency(summary.receiptsIn, currency)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">OUT</span><span className="text-gray-900 dark:text-white">{formatCurrency(summary.receiptsOut, currency)}</span></div>
              <div className="flex justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700 font-semibold"><span className="text-gray-700 dark:text-gray-300">Ending Balance</span><span className="text-gray-900 dark:text-white">{formatCurrency(summary.receiptsEnding, currency)}</span></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Primary Account</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">IN</span><span className="text-gray-900 dark:text-white">{formatCurrency(summary.primaryIn, currency)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">OUT</span><span className="text-gray-900 dark:text-white">{formatCurrency(summary.primaryOut, currency)}</span></div>
              <div className="flex justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700 font-semibold"><span className="text-gray-700 dark:text-gray-300">Ending Balance</span><span className="text-gray-900 dark:text-white">{formatCurrency(summary.primaryEnding, currency)}</span></div>
            </div>
          </div>
          <div className="sm:col-span-2 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800 p-4 flex items-center justify-between">
            <span className="font-semibold text-violet-900 dark:text-violet-200">Total Funds on Hand at End of Month</span>
            <span className="text-lg font-bold text-violet-900 dark:text-violet-200">{formatCurrency(summary.totalFundsOnHand, currency)}</span>
          </div>
        </div>
      )}

      <Dialog header="Add Manual Record" visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "26rem" }}>
        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
          {RECORD_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setRecordType(t.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                recordType === t.value ? "bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-sm" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {recordType === "sale" ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Date</label>
              <Calendar value={saleForm.date} onChange={(e) => setSaleForm((f) => ({ ...f, date: e.value }))} dateFormat="M d, yy" className="w-full" />
            </div>
            <InputText placeholder="Description (e.g. Off-books cash sale)" value={saleForm.description} onChange={(e) => setSaleForm((f) => ({ ...f, description: e.target.value }))} className="w-full" />
            <div className="flex items-center w-full justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
              <InputNumber value={saleForm.amount} onValueChange={(e) => setSaleForm((f) => ({ ...f, amount: e.value || 0 }))} mode="decimal" minFractionDigits={2} min={0} className="w-full" inputClassName="text-left" />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Counts immediately as confirmed revenue — no separate "mark as paid" step, since you're confirming it by entering it.</p>
            <Button label="Save Sale" className="w-full" loading={saving} disabled={!canSaveSale} onClick={handleSaveRecord} />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Date</label>
              <Calendar value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.value }))} dateFormat="M d, yy" className="w-full" />
            </div>
            <Dropdown
              optionValue="value"
              value={expenseForm.categoryId}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              onChange={(e) => setExpenseForm((f) => ({ ...f, categoryId: e.value }))}
              placeholder="Category"
              className="w-full"
            />
            <InputText placeholder="Description" value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} className="w-full" />
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
              <InputNumber value={expenseForm.amount} onValueChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.value || 0 }))} mode="decimal" minFractionDigits={2} min={0} className="w-full" inputClassName="text-right" />
            </div>
            <Dropdown optionValue="value" value={expenseForm.paymentMethod} options={PAYMENT_OPTIONS} onChange={(e) => setExpenseForm((f) => ({ ...f, paymentMethod: e.value }))} className="w-full" />
            <Button label="Save Expense" className="w-full" loading={saving} disabled={!canSaveExpense} onClick={handleSaveRecord} />
          </div>
        )}
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Icon } from "@/icons/registry";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { Button } from "@/components/ui-compat/Button";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { reportsApi } from "../../services/resources";
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

  if (isAllStores) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5">
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
    <div className="mx-auto w-full max-w-7xl px-5">
      <PageHeader
        title="Accounts Sheet"
        subtitle="Monthly sales, confirmed payments, expenses and refunds — same format as your paper ledger."
        actions={
          <div className="flex flex-wrap gap-2">
            <Dropdown optionValue="value" value={month} options={MONTHS} onChange={(e) => setMonth(e.value)} className="w-36" />
            <Dropdown optionValue="value" value={year} options={YEARS} onChange={(e) => setYear(e.value)} className="w-28" />
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
          <Column header="Date" body={(r) => dayOf(r.date)} />
          <Column header="Transaction Description" field="description" />
          <Column header="TC" body={(r) => <span className="font-mono font-semibold">{r.tc}</span>} />
          <Column header="Receipts In" body={(r) => (r.receiptsIn ? formatCurrency(r.receiptsIn, currency) : "")} />
          <Column header="Receipts Out" body={(r) => (r.receiptsOut ? formatCurrency(r.receiptsOut, currency) : "")} />
          <Column header="Primary In" body={(r) => (r.primaryIn ? formatCurrency(r.primaryIn, currency) : "")} />
          <Column header="Primary Out" body={(r) => (r.primaryOut ? formatCurrency(r.primaryOut, currency) : "")} />
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
    </div>
  );
}

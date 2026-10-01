import { useEffect, useState } from "react";
import { Icon } from "@/icons/registry";
import { DataTable, Column } from "@/components/ui-compat/DataTable";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { Button } from "@/components/ui-compat/Button";
import { Dialog } from "@/components/ui-compat/Dialog";
import { InputText } from "@/components/ui/inputtext";
import { InputNumber } from "@/components/ui-compat/InputNumber";
import { DatePicker as Calendar } from "@/components/ui-compat/DatePicker";
import { confirmDialog, ConfirmDialog } from "@/components/ui-compat/confirmDialog";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { bankAccountsApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { formatCurrency, formatDateTime } from "../../utils/format";

const TRANSACTION_TYPES = [
  { label: "Deposit", value: "DEPOSIT" },
  { label: "Withdrawal", value: "WITHDRAWAL" },
  { label: "Service Charge", value: "SERVICE_CHARGE" },
];

const TYPE_BADGE = {
  DEPOSIT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  WITHDRAWAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SERVICE_CHARGE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const EMPTY_ACCOUNT_FORM = { name: "", bankName: "", accountNumber: "", openingBalance: 0 };
const EMPTY_TXN_FORM = { type: "DEPOSIT", amount: 0, date: new Date(), description: "" };

export default function BankAccountsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user.organization?.currency || "GHS";

  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [rows, setRows] = useState({ data: [], pagination: { total: 0, pageSize: 20 } });
  const [page, setPage] = useState(1);
  const [loadingTxns, setLoadingTxns] = useState(false);

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT_FORM);
  const [savingAccount, setSavingAccount] = useState(false);

  const [txnDialogOpen, setTxnDialogOpen] = useState(false);
  const [txnForm, setTxnForm] = useState(EMPTY_TXN_FORM);
  const [savingTxn, setSavingTxn] = useState(false);

  function loadAccounts(preserveSelection = true) {
    setLoadingAccounts(true);
    bankAccountsApi
      .list()
      .then(({ data }) => {
        setAccounts(data.data);
        if (!preserveSelection || !data.data.some((a) => a.id === selectedId)) {
          setSelectedId(data.data[0]?.id ?? null);
        }
      })
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load bank accounts")))
      .finally(() => setLoadingAccounts(false));
  }

  useEffect(loadAccounts, []);

  function loadTransactions() {
    if (!selectedId) return;
    setLoadingTxns(true);
    bankAccountsApi
      .listTransactions(selectedId, { page, pageSize: 20 })
      .then(({ data }) => setRows(data))
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load transactions")))
      .finally(() => setLoadingTxns(false));
  }

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(loadTransactions, [selectedId, page]);

  const selectedAccount = accounts.find((a) => a.id === selectedId) || null;

  function openAddAccountDialog() {
    setAccountForm(EMPTY_ACCOUNT_FORM);
    setAccountDialogOpen(true);
  }

  async function handleSaveAccount() {
    setSavingAccount(true);
    try {
      const { data } = await bankAccountsApi.create(accountForm);
      toast.success(`${data.data.name} added`);
      setAccountDialogOpen(false);
      setSelectedId(data.data.id);
      loadAccounts(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not create bank account"));
    } finally {
      setSavingAccount(false);
    }
  }

  function openAddTxnDialog() {
    setTxnForm(EMPTY_TXN_FORM);
    setTxnDialogOpen(true);
  }

  async function handleSaveTxn() {
    setSavingTxn(true);
    try {
      await bankAccountsApi.addTransaction(selectedId, txnForm);
      toast.success("Transaction recorded");
      setTxnDialogOpen(false);
      loadAccounts();
      loadTransactions();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not record transaction"));
    } finally {
      setSavingTxn(false);
    }
  }

  function handleDeleteTxn(txn) {
    confirmDialog({
      message: `Remove this ${txn.type.replace("_", " ").toLowerCase()} of ${formatCurrency(txn.amount, currency)}? The account balance will be reversed.`,
      header: "Remove Transaction",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await bankAccountsApi.removeTransaction(txn.id);
          toast.success("Transaction removed");
          loadAccounts();
          loadTransactions();
        } catch (err) {
          toast.error(apiErrorMessage(err, "Could not remove transaction"));
        }
      },
    });
  }

  const canSaveAccount = accountForm.name.trim().length >= 2;
  const canSaveTxn = txnForm.amount > 0 && txnForm.date;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 space-y-6">
      <ConfirmDialog />
      <PageHeader
        title="Bank Accounts"
        subtitle="Track cash flow into and out of your business bank accounts — deposits, withdrawals, and service charges."
        actions={<Button label="Add Bank Account" icon="pi pi-plus" onClick={openAddAccountDialog} />}
      />

      {accounts.length === 0 && !loadingAccounts ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-10">
          <EmptyState icon="pi-wallet" title="No bank accounts yet" subtitle="Add your first bank account to start tracking deposits, withdrawals, and service charges." />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Dropdown
              value={selectedId}
              options={accounts.map((a) => ({ label: a.name, value: a.id }))}
              onChange={(e) => setSelectedId(e.value)}
              optionValue="value"
              className="w-64"
              placeholder="Select account"
            />
            {selectedAccount && <Button label="Record Transaction" icon="pi pi-plus" outlined onClick={openAddTxnDialog} />}
          </div>

          {selectedAccount && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedAccount.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedAccount.bankName || "—"}
                  {selectedAccount.accountNumber ? ` · ${selectedAccount.accountNumber}` : ""}
                  {!selectedAccount.active && <span className="ml-2 text-xs text-red-500 font-medium">INACTIVE</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(selectedAccount.balance, currency)}</p>
              </div>
            </div>
          )}

          {selectedAccount && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card overflow-x-auto">
              <DataTable
                value={rows.data}
                loading={loadingTxns}
                lazy
                paginator
                rows={rows.pagination.pageSize}
                totalRecords={rows.pagination.total}
                first={(page - 1) * rows.pagination.pageSize}
                onPage={(e) => setPage(e.page + 1)}
                emptyMessage={<EmptyState icon="pi-receipt" title="No transactions yet" subtitle="Record a deposit, withdrawal, or service charge for this account." />}
              >
                <Column header="Date" body={(t) => formatDateTime(t.date)} className="border-r border-gray-200 dark:border-gray-700" />
                <Column
                  header="Type"
                  body={(t) => <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_BADGE[t.type]}`}>{t.type.replace("_", " ")}</span>}
                  className="border-r border-gray-200 dark:border-gray-700"
                />
                <Column header="Description" body={(t) => t.description || "—"} className="border-r border-gray-200 dark:border-gray-700" />
                <Column header="Recorded By" body={(t) => t.user?.name} className="border-r border-gray-200 dark:border-gray-700" />
                <Column
                  header="Amount"
                  body={(t) => (
                    <span className={t.type === "DEPOSIT" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                      {t.type === "DEPOSIT" ? "+" : "−"}
                      {formatCurrency(t.amount, currency)}
                    </span>
                  )}
                  className="border-r border-gray-200 dark:border-gray-700"
                />
                <Column header="Balance After" body={(t) => formatCurrency(t.newBalance, currency)} className="border-r border-gray-200 dark:border-gray-700" />
                <Column header="" body={(t) => (
                  <button onClick={() => handleDeleteTxn(t)} className="text-gray-300 hover:text-red-500">
                    <Icon className="pi-trash text-sm" />
                  </button>
                )} />
              </DataTable>
            </div>
          )}
        </>
      )}

      <Dialog header="Add Bank Account" visible={accountDialogOpen} onHide={() => setAccountDialogOpen(false)} style={{ width: "26rem" }}>
        <div className="space-y-3">
          <InputText placeholder="Account name (e.g. GCB Business Account)" value={accountForm.name} onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))} className="w-full" />
          <InputText placeholder="Bank name (optional)" value={accountForm.bankName} onChange={(e) => setAccountForm((f) => ({ ...f, bankName: e.target.value }))} className="w-full" />
          <InputText placeholder="Account number (optional)" value={accountForm.accountNumber} onChange={(e) => setAccountForm((f) => ({ ...f, accountNumber: e.target.value }))} className="w-full" />
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-gray-500 dark:text-gray-400">Opening Balance</span>
            <InputNumber
              value={accountForm.openingBalance}
              onValueChange={(e) => setAccountForm((f) => ({ ...f, openingBalance: e.value || 0 }))}
              mode="decimal"
              minFractionDigits={2}
              min={0}
              className="w-40"
              inputClassName="text-right"
            />
          </div>
          <Button label="Save Account" className="w-full" loading={savingAccount} disabled={!canSaveAccount} onClick={handleSaveAccount} />
        </div>
      </Dialog>

      <Dialog header="Record Transaction" visible={txnDialogOpen} onHide={() => setTxnDialogOpen(false)} style={{ width: "26rem" }}>
        <div className="space-y-3">
          <Dropdown optionValue="value" value={txnForm.type} options={TRANSACTION_TYPES} onChange={(e) => setTxnForm((f) => ({ ...f, type: e.value }))} className="w-full" />
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Date</label>
            <Calendar value={txnForm.date} onChange={(e) => setTxnForm((f) => ({ ...f, date: e.value }))} dateFormat="M d, yy" className="w-full" />
          </div>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
            <InputNumber
              value={txnForm.amount}
              onValueChange={(e) => setTxnForm((f) => ({ ...f, amount: e.value || 0 }))}
              mode="decimal"
              minFractionDigits={2}
              min={0}
              className="w-40"
              inputClassName="text-right"
            />
          </div>
          <InputText placeholder="Description (e.g. Cash from Sept 30 sales)" value={txnForm.description} onChange={(e) => setTxnForm((f) => ({ ...f, description: e.target.value }))} className="w-full" />
          <Button
            label="Save Transaction"
            className="w-full"
            severity={txnForm.type === "DEPOSIT" ? "success" : "danger"}
            loading={savingTxn}
            disabled={!canSaveTxn}
            onClick={handleSaveTxn}
          />
        </div>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import EmptyState from "../../components/EmptyState";
import DateRangeFilter from "../../components/DateRangeFilter";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { expensesApi, expenseCategoriesApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { dateRangeParams, isRangeReady } from "../../utils/dateRange";
import { formatCurrency, formatDate } from "../../utils/format";

const PAYMENT_OPTIONS = [
  { label: "Cash", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Card", value: "CARD" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Other", value: "OTHER" },
];

const EMPTY_FORM = { categoryId: null, description: "", amount: 0, paymentMethod: "CASH", date: new Date(), notes: "" };

export default function ExpensesPage() {
  const { user } = useAuth();
  const { currentStoreId, isAllStores } = useStore();
  const toast = useToast();
  const currency = user.organization?.currency || "GHS";

  const [categories, setCategories] = useState([]);
  const [range, setRange] = useState({ preset: "this_month" });
  const [categoryId, setCategoryId] = useState("");
  const [rows, setRows] = useState({ data: [], pagination: { total: 0, pageSize: 20 } });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    expenseCategoriesApi.list().then(({ data }) => setCategories(data.data));
  }, []);

  function load() {
    if (!isRangeReady(range)) return;
    setLoading(true);
    expensesApi
      .list({ ...dateRangeParams(range), storeId: currentStoreId || undefined, categoryId: categoryId || undefined, page, pageSize: 20 })
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [range, categoryId, currentStoreId, page]);

  const total = rows.data.reduce((sum, e) => sum + Number(e.amount), 0);

  function openCreate() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await expensesApi.create({ ...form, storeId: currentStoreId });
      toast.success("Expense recorded");
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save expense"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense) {
    try {
      await expensesApi.remove(expense.id);
      toast.success("Expense deleted");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete expense"));
    }
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <DateRangeFilter value={range} onChange={setRange} />
            <Dropdown optionValue="value"
              value={categoryId}
              options={[{ label: "All Categories", value: "" }, ...categories.map((c) => ({ label: c.name, value: c.id }))]}
              onChange={(e) => setCategoryId(e.value)}
              className="w-44"
            />
            {!isAllStores && <Button label="Add Expense" icon="pi pi-plus" onClick={openCreate} />}
          </div>
        }
      />

      <div className="mb-4">
        <StatCard label="Total (this filter)" value={formatCurrency(total, currency)} icon="pi-money-bill" accent="red" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <DataTable
          value={rows.data}
          loading={loading}
          lazy
          paginator
          rows={rows.pagination.pageSize}
          totalRecords={rows.pagination.total}
          first={(page - 1) * rows.pagination.pageSize}
          onPage={(e) => setPage(e.page + 1)}
          emptyMessage={<EmptyState icon="pi-money-bill" title="No expenses recorded" subtitle="Try a different date range or category filter." />}
        >
          <Column header="Date" body={(e) => formatDate(e.date)} />
          {isAllStores && <Column header="Store" body={(e) => e.store?.name} />}
          <Column header="Category" body={(e) => e.category?.name} />
          <Column field="description" header="Description" />
          <Column header="Amount" body={(e) => formatCurrency(e.amount, currency)} />
          <Column header="Payment" body={(e) => e.paymentMethod.replace("_", " ")} />
          <Column header="Recorded By" body={(e) => e.recordedBy?.name} />
          <Column header="" body={(e) => <Button icon="pi pi-trash" text rounded severity="danger" onClick={() => handleDelete(e)} />} />
        </DataTable>
      </div>

      <Dialog header="Add Expense" visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "26rem" }}>
        <div className="space-y-3">
          <Dropdown optionValue="value" value={form.categoryId} options={categories.map((c) => ({ label: c.name, value: c.id }))} onChange={(e) => update("categoryId", e.value)} placeholder="Category" className="w-full" />
          <InputText placeholder="Description" value={form.description} onChange={(e) => update("description", e.target.value)} className="w-full" />
          <InputNumber placeholder="Amount" value={form.amount} onValueChange={(e) => update("amount", e.value || 0)} mode="decimal" minFractionDigits={2} className="w-full" />
          <Dropdown optionValue="value" value={form.paymentMethod} options={PAYMENT_OPTIONS} onChange={(e) => update("paymentMethod", e.value)} className="w-full" />
          <Calendar value={form.date} onChange={(e) => update("date", e.value)} showIcon dateFormat="M d, yy" className="w-full" />
          <InputTextarea placeholder="Notes (optional)" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} className="w-full" />
          <Button label="Save Expense" className="w-full" loading={saving} onClick={handleSave} disabled={!form.categoryId || !form.description || !form.amount} />
        </div>
      </Dialog>
    </div>
  );
}

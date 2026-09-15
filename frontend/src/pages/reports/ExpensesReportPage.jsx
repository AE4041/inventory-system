import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { Button } from "@/components/ui-compat/Button";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import EmptyState from "../../components/EmptyState";
import DateRangeFilter from "../../components/DateRangeFilter";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { reportsApi, expenseCategoriesApi } from "../../services/resources";
import { dateRangeParams, isRangeReady } from "../../utils/dateRange";
import { downloadCsv } from "../../utils/download";
import { formatCurrency, formatDate } from "../../utils/format";

export default function ExpensesReportPage() {
  const { user } = useAuth();
  const { currentStoreId } = useStore();
  const currency = user.organization?.currency || "GHS";

  const [range, setRange] = useState({ preset: "this_month" });
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    expenseCategoriesApi.list().then(({ data }) => setCategories(data.data));
  }, []);

  function load() {
    if (!isRangeReady(range)) return;
    setLoading(true);
    reportsApi
      .expenses({ ...dateRangeParams(range), storeId: currentStoreId || undefined, categoryId: categoryId || undefined })
      .then(({ data }) => setResult(data.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [range, categoryId, currentStoreId]);

  function handleExport() {
    downloadCsv("/reports/expenses", { ...dateRangeParams(range), storeId: currentStoreId || undefined, categoryId: categoryId || undefined }, "expenses-report.csv");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <PageHeader
        title="Expenses Report"
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <DateRangeFilter value={range} onChange={setRange} />
            <Dropdown optionValue="value" value={categoryId} options={[{ label: "All Categories", value: "" }, ...categories.map((c) => ({ label: c.name, value: c.id }))]} onChange={(e) => setCategoryId(e.value)} className="w-44" />
            <Button label="Export CSV" icon="pi pi-download" outlined onClick={handleExport} />
          </div>
        }
      />

      {result && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <StatCard label="Total Expenses" value={formatCurrency(result.summary.totalExpenses, currency)} icon="pi-money-bill" accent="red" />
            <StatCard label="Number of Expenses" value={result.summary.count} icon="pi-list" accent="gray" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={result.summary.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="categoryName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-x-auto">
        <DataTable value={result?.expenses || []} loading={loading} paginator rows={20} emptyMessage={<EmptyState icon="pi-money-bill" title="No expenses for this filter" />}>
          <Column header="Date" body={(e) => formatDate(e.date)} />
          <Column header="Store" body={(e) => e.store?.name} />
          <Column header="Category" body={(e) => e.category?.name} />
          <Column field="description" header="Description" />
          <Column header="Amount" body={(e) => formatCurrency(e.amount, currency)} />
          <Column header="Recorded By" body={(e) => e.recordedBy?.name} />
        </DataTable>
      </div>
    </div>
  );
}

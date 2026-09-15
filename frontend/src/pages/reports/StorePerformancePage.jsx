import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import DateRangeFilter from "../../components/DateRangeFilter";
import { useAuth } from "../../context/AuthContext";
import { reportsApi } from "../../services/resources";
import { dateRangeParams, isRangeReady } from "../../utils/dateRange";
import { formatCurrency } from "../../utils/format";

export default function StorePerformancePage() {
  const { user } = useAuth();
  const currency = user.organization?.currency || "GHS";

  const [range, setRange] = useState({ preset: "this_month" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  function load() {
    if (!isRangeReady(range)) return;
    setLoading(true);
    reportsApi
      .stores(dateRangeParams(range))
      .then(({ data }) => setRows(data.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [range]);

  return (
    <div>
      <PageHeader title="Store Performance" subtitle="Compare branches side by side" actions={<DateRangeFilter value={range} onChange={setRange} />} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-5">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="storeName" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => formatCurrency(value, currency)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="sales" name="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net" name="Net" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-x-auto">
        <DataTable value={rows} loading={loading} emptyMessage={<EmptyState icon="pi-building-columns" title="No stores found" />}>
          <Column field="storeName" header="Store" />
          <Column header="Sales" body={(r) => formatCurrency(r.sales, currency)} />
          <Column header="Expenses" body={(r) => formatCurrency(r.expenses, currency)} />
          <Column header="Net" body={(r) => formatCurrency(r.net, currency)} />
          <Column header="Transactions" body={(r) => r.transactions.toLocaleString()} />
        </DataTable>
      </div>
    </div>
  );
}

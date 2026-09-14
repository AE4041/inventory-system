import { useEffect, useState } from "react";
import { Skeleton } from "primereact/skeleton";
import { Line, LineChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Pie, PieChart, Legend } from "recharts";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import DateRangeFilter from "../../components/DateRangeFilter";
import { useStore } from "../../context/StoreContext";
import { useAuth } from "../../context/AuthContext";
import { dashboardApi } from "../../services/resources";
import { dateRangeParams, isRangeReady } from "../../utils/dateRange";
import { formatCurrency } from "../../utils/format";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentStoreId } = useStore();
  const currency = user.organization?.currency || "GHS";
  const [range, setRange] = useState({ preset: "this_month" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isRangeReady(range)) return;
    setLoading(true);
    dashboardApi
      .get({ ...dateRangeParams(range), storeId: currentStoreId || undefined })
      .then(({ data }) => setData(data.data))
      .finally(() => setLoading(false));
  }, [range, currentStoreId]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Business performance overview"
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />

      {loading || !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <Skeleton shape="circle" size="2.75rem" />
                <div className="flex-1">
                  <Skeleton width="70%" height="0.7rem" className="mb-2" />
                  <Skeleton width="50%" height="1.25rem" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
              <Skeleton width="40%" height="0.9rem" className="mb-4" />
              <Skeleton height="240px" borderRadius="12px" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <Skeleton width="60%" height="0.9rem" className="mb-4" />
              <Skeleton height="240px" borderRadius="12px" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard label="Total Sales" value={formatCurrency(data.sales.totalSales, currency)} icon="pi-chart-line" accent="blue" />
            <StatCard label="Total Expenses" value={formatCurrency(data.expenses.totalExpenses, currency)} icon="pi-money-bill" accent="red" />
            <StatCard label="Net Revenue" value={formatCurrency(data.netRevenue, currency)} icon="pi-wallet" accent="green" />
            <StatCard label="Transactions" value={data.sales.transactions.toLocaleString()} icon="pi-receipt" accent="purple" />
            <StatCard label="Products Sold" value={data.sales.productsSold.toLocaleString()} icon="pi-box" accent="amber" />
            <StatCard label="Customers" value={data.customersCount.toLocaleString()} icon="pi-users" accent="blue" />
            <StatCard label="Low Stock Products" value={data.lowStockCount.toLocaleString()} icon="pi-exclamation-triangle" accent="red" />
            <StatCard label="Avg. Transaction" value={formatCurrency(data.sales.averageTransactionValue, currency)} icon="pi-calculator" accent="gray" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Sales Over Time</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Sales by Payment Method</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.paymentBreakdown} dataKey="total" nameKey="paymentMethod" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {data.paymentBreakdown.map((entry, i) => (
                      <Cell key={entry.paymentMethod} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.storeComparison && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Store Comparison</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.storeComparison}>
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
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Selling Products</h3>
              <div className="divide-y divide-gray-100">
                {data.topProducts.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">No sales in this period</p>}
                {data.topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-800 truncate">{p.productName}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(p.revenue, currency)}</p>
                      <p className="text-xs text-gray-400">{p.quantitySold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

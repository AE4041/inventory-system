import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { Button } from "@/components/ui-compat/Button";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import EmptyState from "../../components/EmptyState";
import DateRangeFilter from "../../components/DateRangeFilter";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { reportsApi, usersApi, customersApi } from "../../services/resources";
import { dateRangeParams, isRangeReady } from "../../utils/dateRange";
import { downloadCsv } from "../../utils/download";
import { formatCurrency, formatDateTime, statusBadgeClass } from "../../utils/format";

const PAYMENT_OPTIONS = [
  { label: "All Payment Methods", value: "" },
  { label: "Cash", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Card", value: "CARD" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Other", value: "OTHER" },
];

export default function SalesReportPage() {
  const { user } = useAuth();
  const { currentStoreId } = useStore();
  const currency = user.organization?.currency || "GHS";

  const [range, setRange] = useState({ preset: "this_month" });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashierId, setCashierId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [cashiers, setCashiers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usersApi.list().then(({ data }) => setCashiers(data.data)).catch(() => {});
    customersApi.list({ pageSize: 200 }).then(({ data }) => setCustomers(data.data)).catch(() => {});
  }, []);

  function load() {
    if (!isRangeReady(range)) return;
    setLoading(true);
    reportsApi
      .sales({
        ...dateRangeParams(range),
        storeId: currentStoreId || undefined,
        paymentMethod: paymentMethod || undefined,
        userId: cashierId || undefined,
        customerId: customerId || undefined,
      })
      .then(({ data }) => setResult(data.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [range, paymentMethod, cashierId, customerId, currentStoreId]);

  function handleExport() {
    downloadCsv(
      "/reports/sales",
      { ...dateRangeParams(range), storeId: currentStoreId || undefined, paymentMethod: paymentMethod || undefined, userId: cashierId || undefined, customerId: customerId || undefined },
      "sales-report.csv"
    );
  }

  return (
    <div>
      <PageHeader
        title="Sales Report"
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <DateRangeFilter value={range} onChange={setRange} />
            <Dropdown optionValue="value" value={paymentMethod} options={PAYMENT_OPTIONS} onChange={(e) => setPaymentMethod(e.value)} className="w-44" />
            <Dropdown optionValue="value" value={cashierId} options={[{ label: "All Cashiers", value: "" }, ...cashiers.map((c) => ({ label: c.name, value: c.id }))]} onChange={(e) => setCashierId(e.value)} className="w-44" />
            <Dropdown optionValue="value" value={customerId} options={[{ label: "All Customers", value: "" }, ...customers.map((c) => ({ label: c.name, value: c.id }))]} onChange={(e) => setCustomerId(e.value)} filter className="w-44" />
            <Button label="Export CSV" icon="pi pi-download" outlined onClick={handleExport} />
          </div>
        }
      />

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard label="Total Sales" value={formatCurrency(result.summary.totalSales, currency)} icon="pi-chart-line" accent="blue" />
          <StatCard label="Transactions" value={result.summary.transactions} icon="pi-receipt" accent="purple" />
          <StatCard label="Avg. Transaction" value={formatCurrency(result.summary.averageTransactionValue, currency)} icon="pi-calculator" accent="gray" />
          <StatCard label="Net Sales" value={formatCurrency(result.summary.netSales, currency)} icon="pi-wallet" accent="green" />
          <StatCard label="Discounts" value={formatCurrency(result.summary.totalDiscounts, currency)} icon="pi-percentage" accent="amber" />
          <StatCard label="Products Sold" value={result.summary.productsSold} icon="pi-box" accent="blue" />
          <StatCard label="Refunds" value={`${result.summary.refunds.count} (${formatCurrency(result.summary.refunds.value, currency)})`} icon="pi-replay" accent="red" />
          <StatCard label="Cancelled" value={result.summary.cancelled} icon="pi-times-circle" accent="gray" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-x-auto">
        <DataTable value={result?.sales || []} loading={loading} paginator rows={20} emptyMessage={<EmptyState icon="pi-receipt" title="No sales for this filter" />}>
          <Column field="receiptNumber" header="Receipt #" />
          <Column header="Date" body={(s) => formatDateTime(s.createdAt)} />
          <Column header="Store" body={(s) => s.store?.name} />
          <Column header="Customer" body={(s) => s.customer?.name || "Walk-in"} />
          <Column header="Cashier" body={(s) => s.cashier?.name} />
          <Column header="Total" body={(s) => formatCurrency(s.total, currency)} />
          <Column header="Payment" body={(s) => s.paymentMethod.replace("_", " ")} />
          <Column header="Status" body={(s) => <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadgeClass(s.status)}`}>{s.status}</span>} />
        </DataTable>
      </div>
    </div>
  );
}

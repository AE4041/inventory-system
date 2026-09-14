import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import ReceiptDialog from "../../components/ReceiptDialog";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { customersApi } from "../../services/resources";
import { formatCurrency, formatDateTime, statusBadgeClass } from "../../utils/format";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user.organization?.currency || "GHS";

  const [customer, setCustomer] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);

  useEffect(() => {
    customersApi.get(id).then(({ data }) => setCustomer(data.data));
  }, [id]);

  if (!customer) {
    return (
      <div className="py-20 text-center text-gray-400">
        <i className="pi pi-spin pi-spinner text-2xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={[customer.phone, customer.email].filter(Boolean).join(" · ") || "No contact info"}
        actions={<Button label="Back to Customers" icon="pi pi-arrow-left" text onClick={() => navigate("/customers")} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Total Spent" value={formatCurrency(customer.stats.totalSpent, currency)} icon="pi-wallet" accent="green" />
        <StatCard label="Transactions" value={customer.stats.totalTransactions} icon="pi-receipt" accent="blue" />
        <StatCard label="Last Purchase" value={customer.stats.lastPurchase ? formatDateTime(customer.stats.lastPurchase) : "Never"} icon="pi-calendar" accent="gray" />
      </div>

      {customer.address && <p className="text-sm text-gray-500 mb-2">Address: {customer.address}</p>}
      {customer.notes && <p className="text-sm text-gray-500 mb-4">Notes: {customer.notes}</p>}

      <h3 className="text-sm font-semibold text-gray-700 mb-2">Purchase History</h3>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <DataTable value={customer.purchaseHistory} paginator rows={10} emptyMessage={<EmptyState icon="pi-shopping-bag" title="No purchases yet" />}>
          <Column field="receiptNumber" header="Receipt #" />
          <Column header="Date" body={(s) => formatDateTime(s.createdAt)} />
          <Column header="Items" body={(s) => s.items?.length} />
          <Column header="Total" body={(s) => formatCurrency(s.total, currency)} />
          <Column header="Status" body={(s) => <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadgeClass(s.status)}`}>{s.status}</span>} />
          <Column header="" body={(s) => <Button icon="pi pi-receipt" text rounded onClick={() => setViewingSale(s)} />} />
        </DataTable>
      </div>

      <ReceiptDialog sale={viewingSale} visible={!!viewingSale} onHide={() => setViewingSale(null)} />
    </div>
  );
}

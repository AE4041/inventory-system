import { Icon } from "@/icons/registry";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { InputText } from "@/components/ui/inputtext";
import { Button } from "@/components/ui-compat/Button";
import { Dialog } from "@/components/ui-compat/Dialog";
import { InputTextarea } from "@/components/ui-compat/InputTextarea";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { customersApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { formatDate } from "../../utils/format";

const EMPTY_FORM = { name: "", phone: "", email: "", address: "", notes: "" };

export default function CustomersPage() {
  const { currentStoreId, isAllStores } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [rows, setRows] = useState({ data: [], pagination: { total: 0, pageSize: 20 } });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function load() {
    setLoading(true);
    customersApi
      .list({ storeId: currentStoreId || undefined, search: search || undefined, page, pageSize: 20 })
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, currentStoreId]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await customersApi.create({ ...form, storeId: currentStoreId });
      toast.success("Customer added");
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not add customer"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <PageHeader
        title="Customers"
        actions={
          !isAllStores && <Button label="Add Customer" icon="pi pi-plus" onClick={openCreate} />
        }
      />

      <div className="mb-3">
        <span className="relative w-full sm:w-80 block">
          <Icon className="pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-3.5" />
          <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or email..." className="w-full pl-9" />
        </span>
      </div>

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
          emptyMessage={<EmptyState icon="pi-users" title="No customers found" subtitle="Add your first customer or adjust your search." />}
          selectionMode="single"
          onRowClick={(e) => navigate(`/customers/${e.data.id}`)}
          rowClassName={() => "cursor-pointer"}
        >
          <Column field="name" header="Name" />
          <Column header="Phone" body={(c) => c.phone || "-"} />
          <Column header="Email" body={(c) => c.email || "-"} />
          {isAllStores && <Column header="Store" body={(c) => c.store?.name} />}
          <Column header="Joined" body={(c) => formatDate(c.createdAt)} />
        </DataTable>
      </div>

      <Dialog header="Add Customer" visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "26rem" }}>
        <div className="space-y-3">
          <InputText placeholder="Name" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full" />
          <InputText placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full" />
          <InputText placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full" />
          <InputText placeholder="Address" value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full" />
          <InputTextarea placeholder="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} className="w-full" />
          <Button label="Save Customer" className="w-full" loading={saving} onClick={handleSave} disabled={!form.name} />
        </div>
      </Dialog>
    </div>
  );
}

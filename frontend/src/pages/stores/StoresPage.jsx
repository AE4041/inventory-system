import { useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { InputText } from "@/components/ui/inputtext";
import { Button } from "@/components/ui-compat/Button";
import { Dialog } from "@/components/ui-compat/Dialog";
import { ToggleButton } from "@/components/ui-compat/ToggleButton";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { storesApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";

const EMPTY_FORM = { name: "", address: "", phone: "", email: "", active: true };

export default function StoresPage() {
  const { stores, refresh } = useStore();
  const toast = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(store) {
    setEditingId(store.id);
    setForm({ name: store.name, address: store.address || "", phone: store.phone || "", email: store.email || "", active: store.active });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        await storesApi.update(editingId, form);
        toast.success("Store updated");
      } else {
        await storesApi.create(form);
        toast.success("Store created");
      }
      setDialogOpen(false);
      refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save store"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(store) {
    try {
      await storesApi.update(store.id, { active: !store.active });
      toast.success(store.active ? "Store deactivated" : "Store activated");
      refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update store"));
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5">
      <PageHeader title="Stores" actions={<Button label="Add Store" icon="pi pi-plus" onClick={openCreate} />} />

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card overflow-x-auto">
        <DataTable value={stores} emptyMessage={<EmptyState icon="pi-building-columns" title="No stores yet" subtitle="Add your first branch to get started." />}>
          <Column field="name" header="Name" />
          <Column header="Address" body={(s) => s.address || "-"} />
          <Column header="Phone" body={(s) => s.phone || "-"} />
          <Column header="Email" body={(s) => s.email || "-"} />
          <Column header="Status" body={(s) => (s.active ? <span className="text-emerald-600 text-xs font-medium">Active</span> : <span className="text-gray-400 dark:text-gray-500 text-xs">Inactive</span>)} />
          <Column
            header="Actions"
            body={(s) => (
              <div className="flex gap-1">
                <Button icon="pi pi-pencil" text rounded onClick={() => openEdit(s)} />
                <Button
                  icon={s.active ? "pi pi-eye-slash" : "pi pi-eye"}
                  text
                  rounded
                  severity={s.active ? "danger" : "success"}
                  tooltip={s.active ? "Deactivate" : "Activate"}
                  onClick={() => toggleActive(s)}
                />
              </div>
            )}
          />
        </DataTable>
      </div>

      <Dialog header={editingId ? "Edit Store" : "Add Store"} visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "26rem" }}>
        <div className="space-y-3">
          <InputText placeholder="Store name" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full" />
          <InputText placeholder="Address" value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full" />
          <InputText placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full" />
          <InputText placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
            <ToggleButton checked={form.active} onChange={(e) => update("active", e.value)} onLabel="Active" offLabel="Inactive" />
          </div>
          <Button label="Save Store" className="w-full" loading={saving} onClick={handleSave} disabled={!form.name} />
        </div>
      </Dialog>
    </div>
  );
}

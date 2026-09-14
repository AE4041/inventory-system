import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { usersApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Manager", value: "MANAGER" },
  { label: "Cashier", value: "CASHIER" },
];

const EMPTY_FORM = { name: "", email: "", password: "", role: "CASHIER", storeIds: [] };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { stores } = useStore();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function load() {
    usersApi.list().then(({ data }) => setUsers(data.data));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(user) {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, storeIds: user.storeIds });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await usersApi.update(editingId, payload);
        toast.success("User updated");
      } else {
        await usersApi.create(form);
        toast.success("User created");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save user"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(user) {
    try {
      await usersApi.remove(user.id);
      toast.success("User deactivated");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not deactivate user"));
    }
  }

  return (
    <div>
      <PageHeader title="Users" actions={<Button label="Add User" icon="pi pi-plus" onClick={openCreate} />} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <DataTable value={users} emptyMessage={<EmptyState icon="pi-user-edit" title="No users yet" />}>
          <Column field="name" header="Name" />
          <Column field="email" header="Email" />
          <Column header="Role" body={(u) => <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">{u.role}</span>} />
          <Column header="Stores" body={(u) => (u.role === "ADMIN" ? "All" : u.storeIds.length)} />
          <Column header="Status" body={(u) => (u.active ? <span className="text-emerald-600 text-xs font-medium">Active</span> : <span className="text-gray-400 text-xs">Inactive</span>)} />
          <Column
            header="Actions"
            body={(u) => (
              <div className="flex gap-1">
                <Button icon="pi pi-pencil" text rounded onClick={() => openEdit(u)} />
                {u.active && u.id !== currentUser.id && <Button icon="pi pi-eye-slash" text rounded severity="danger" tooltip="Deactivate" onClick={() => handleDeactivate(u)} />}
              </div>
            )}
          />
        </DataTable>
      </div>

      <Dialog header={editingId ? "Edit User" : "Add User"} visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "26rem" }}>
        <div className="space-y-3">
          <InputText placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full" />
          <InputText placeholder="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full" />
          <Password placeholder={editingId ? "New password (leave blank to keep)" : "Password"} value={form.password} onChange={(e) => update("password", e.target.value)} toggleMask className="w-full" inputClassName="w-full" feedback={false} />
          <Dropdown optionValue="value" value={form.role} options={ROLE_OPTIONS} onChange={(e) => update("role", e.value)} className="w-full" />
          {form.role !== "ADMIN" && (
            <MultiSelect optionValue="value"
              value={form.storeIds}
              options={stores.map((s) => ({ label: s.name, value: s.id }))}
              onChange={(e) => update("storeIds", e.value)}
              placeholder="Assign stores"
              className="w-full"
              display="chip"
            />
          )}
          <Button label="Save User" className="w-full" loading={saving} onClick={handleSave} disabled={!form.name || !form.email || (!editingId && !form.password)} />
        </div>
      </Dialog>
    </div>
  );
}

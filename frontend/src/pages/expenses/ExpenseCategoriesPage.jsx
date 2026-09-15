import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui-compat/DataTable";
import { Column } from "@/components/ui-compat/DataTable";
import { InputText } from "@/components/ui/inputtext";
import { Button } from "@/components/ui-compat/Button";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";
import { expenseCategoriesApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";

export default function ExpenseCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    expenseCategoriesApi.list().then(({ data }) => setCategories(data.data));
  }

  useEffect(load, []);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await expenseCategoriesApi.create({ name: name.trim() });
      setName("");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not add category"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    try {
      await expenseCategoriesApi.remove(category.id);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete category (it may be used by existing expenses)"));
    }
  }

  return (
    <div>
      <PageHeader title="Expense Categories" />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-5 flex gap-2 max-w-md">
        <InputText value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="flex-1" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Button label="Add" icon="pi pi-plus" loading={saving} onClick={handleAdd} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-x-auto max-w-md">
        <DataTable value={categories} emptyMessage={<EmptyState icon="pi-tags" title="No expense categories yet" />}>
          <Column field="name" header="Name" />
          <Column header="" body={(c) => <Button icon="pi pi-trash" text rounded severity="danger" onClick={() => handleDelete(c)} />} />
        </DataTable>
      </div>
    </div>
  );
}

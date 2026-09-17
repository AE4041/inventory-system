import { useEffect, useState } from "react";
import { Icon } from "@/icons/registry";
import { Dialog } from "@/components/ui-compat/Dialog";
import { Button } from "@/components/ui-compat/Button";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { InputNumber } from "@/components/ui-compat/InputNumber";
import { salesApi, productsApi } from "../../services/resources";
import { apiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/format";

// Admin-only correction on an already-Paid invoice: change quantities, add a product
// that was missed, or remove one that shouldn't be there. Stock is reconciled
// server-side (increase deducts more, decrease/removal returns it) — this dialog only
// sends the full desired line list; the totals shown here are a preview, the server
// response after saving is the source of truth.
export default function EditSaleItemsDialog({ sale, visible, onHide, currency, onSaved }) {
  const { user } = useAuth();
  const toast = useToast();
  const taxRate = Number(user.organization?.taxRate || 0);

  const [lines, setLines] = useState([]);
  const [products, setProducts] = useState([]);
  const [addProductId, setAddProductId] = useState(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !sale) return;
    setLines(
      sale.items.map((i) => ({
        productId: i.productId,
        productName: i.product?.name || "Unknown product",
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
      }))
    );
    setAddProductId(null);
    setAddQuantity(1);
    if (products.length === 0) {
      productsApi
        .list({ active: true, pageSize: 500 })
        .then(({ data }) => setProducts(data.data))
        .catch((err) => toast.error(apiErrorMessage(err, "Could not load products")));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sale?.id]);

  function updateQuantity(productId, quantity) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
  }

  function removeLine(productId) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function addLine() {
    if (!addProductId || !addQuantity) return;
    const product = products.find((p) => p.id === addProductId);
    if (!product) return;
    setLines((prev) => [
      ...prev,
      { productId: product.id, productName: product.name, unitPrice: Number(product.sellingPrice), quantity: addQuantity },
    ]);
    setAddProductId(null);
    setAddQuantity(1);
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const tax = subtotal * (taxRate / 100);
  const previewTotal = subtotal + tax;

  const availableProducts = products.filter((p) => !lines.some((l) => l.productId === p.id));

  async function handleSave() {
    if (lines.length === 0) {
      toast.warn("An invoice must have at least one item");
      return;
    }
    setSaving(true);
    try {
      await salesApi.updateItems(sale.id, { items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) });
      toast.success(`${sale.receiptNumber} updated — stock adjusted accordingly`);
      onSaved?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update invoice"));
    } finally {
      setSaving(false);
    }
  }

  if (!sale) return null;

  return (
    <Dialog header={`Edit ${sale.receiptNumber}`} visible={visible} onHide={onHide} style={{ width: "30rem" }}>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 -mx-5 px-5 mb-3 max-h-80 overflow-y-auto">
        {lines.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-6">No items — add one below</p>}
        {lines.map((l) => (
          <div key={l.productId} className="py-2.5 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{l.productName}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{formatCurrency(l.unitPrice, currency)} each</p>
            </div>
            <InputNumber
              value={l.quantity}
              onValueChange={(e) => updateQuantity(l.productId, e.value)}
              showButtons
              buttonLayout="horizontal"
              min={1}
              className="w-28"
              inputClassName="w-10 text-center"
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-white w-20 text-right">{formatCurrency(l.unitPrice * l.quantity, currency)}</span>
            <button onClick={() => removeLine(l.productId)} className="text-gray-300 hover:text-red-500">
              <Icon className="pi-trash text-sm" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 mb-4">
        <Dropdown
          optionValue="value"
          value={addProductId}
          options={availableProducts.map((p) => ({ label: p.name, value: p.id }))}
          onChange={(e) => setAddProductId(e.value)}
          filter
          placeholder="Add a product..."
          className="flex-1"
        />
        <InputNumber value={addQuantity} onValueChange={(e) => setAddQuantity(e.value)} min={1} className="w-20" inputClassName="text-center" />
        <Button icon="pi pi-plus" onClick={addLine} disabled={!addProductId} />
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        {taxRate > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Tax ({taxRate}%)</span>
            <span>{formatCurrency(tax, currency)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-lg font-bold text-gray-900 dark:text-white pt-1">
          <span>Total</span>
          <span>{formatCurrency(previewTotal, currency)}</span>
        </div>
      </div>

      <Button label="Save Changes" className="w-full" loading={saving} onClick={handleSave} />
    </Dialog>
  );
}

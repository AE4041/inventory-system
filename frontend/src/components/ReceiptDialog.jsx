import { useState } from "react";
import { Dialog } from "@/components/ui-compat/Dialog";
import { Button } from "@/components/ui-compat/Button";
import { InputText } from "@/components/ui/inputtext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { receiptsApi } from "../services/resources";
import { apiErrorMessage } from "../services/api";
import { openReceiptPdf } from "../utils/receipt";
import { formatCurrency, formatDateTime } from "../utils/format";

export default function ReceiptDialog({ sale, visible, onHide }) {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user.organization?.currency || "GHS";
  const [email, setEmail] = useState(sale?.customer?.email || "");
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!sale) return null;

  async function handleDownload() {
    setDownloading(true);
    try {
      await openReceiptPdf(sale.id);
    } catch {
      toast.error("Could not generate the receipt PDF");
    } finally {
      setDownloading(false);
    }
  }

  async function handleEmail() {
    if (!email) {
      toast.warn("Enter an email address first");
      return;
    }
    setSending(true);
    try {
      await receiptsApi.email(sale.id, { email });
      toast.success(`Receipt sent to ${email}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not send the receipt email"));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog header={`Receipt ${sale.receiptNumber}`} visible={visible} onHide={onHide} style={{ width: "28rem" }}>
      <div className="text-sm text-gray-600 mb-3">
        <p>{formatDateTime(sale.createdAt)}</p>
        <p>{sale.store?.name}</p>
        {sale.customer && <p>Customer: {sale.customer.name}</p>}
      </div>

      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-3">
        {sale.items?.map((item) => (
          <div key={item.id} className="flex justify-between px-3 py-2 text-sm">
            <span className="text-gray-700">
              {item.product?.name} <span className="text-gray-400">x{item.quantity}</span>
            </span>
            <span className="font-medium text-gray-900">{formatCurrency(item.total, currency)}</span>
          </div>
        ))}
      </div>

      <div className="text-right text-sm space-y-0.5 mb-4">
        <p className="text-gray-500">Subtotal: {formatCurrency(sale.subtotal, currency)}</p>
        {Number(sale.discount) > 0 && <p className="text-gray-500">Discount: -{formatCurrency(sale.discount, currency)}</p>}
        {Number(sale.tax) > 0 && <p className="text-gray-500">Tax: {formatCurrency(sale.tax, currency)}</p>}
        <p className="text-lg font-semibold text-gray-900">Total: {formatCurrency(sale.total, currency)}</p>
      </div>

      <Button label="View / Print / Download PDF" icon="pi pi-file-pdf" className="w-full mb-3" outlined loading={downloading} onClick={handleDownload} />

      <div className="flex gap-2">
        <InputText value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" className="flex-1" />
        <Button label="Email" icon="pi pi-send" loading={sending} onClick={handleEmail} />
      </div>
    </Dialog>
  );
}

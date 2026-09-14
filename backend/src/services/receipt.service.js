import PDFDocument from "pdfkit";

function money(amount, currency) {
  return `${currency} ${Number(amount).toFixed(2)}`;
}

export function buildReceiptPdf(sale, organization) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 32 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = organization.currency;

    doc.fontSize(16).font("Helvetica-Bold").text(organization.name, { align: "center" });
    doc.fontSize(11).font("Helvetica").text(sale.store.name, { align: "center" });
    if (sale.store.address) doc.fontSize(9).text(sale.store.address, { align: "center" });
    if (sale.store.phone) doc.fontSize(9).text(sale.store.phone, { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica-Bold").text(`Receipt: ${sale.receiptNumber}`);
    doc.font("Helvetica").fontSize(9);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleString()}`);
    doc.text(`Cashier: ${sale.cashier.name}`);
    if (sale.customer) doc.text(`Customer: ${sale.customer.name}`);
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold");
    doc.text("Item", doc.x, doc.y, { continued: true, width: 180 });
    doc.text("Qty", { continued: true, width: 40, align: "right" });
    doc.text("Price", { continued: true, width: 70, align: "right" });
    doc.text("Total", { width: 70, align: "right" });
    doc.font("Helvetica");
    doc.moveDown(0.2);

    for (const item of sale.items) {
      doc.text(item.product.name, doc.x, doc.y, { continued: true, width: 180 });
      doc.text(String(item.quantity), { continued: true, width: 40, align: "right" });
      doc.text(Number(item.unitPrice).toFixed(2), { continued: true, width: 70, align: "right" });
      doc.text(Number(item.total).toFixed(2), { width: 70, align: "right" });
    }

    doc.moveDown(0.5);
    doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
    doc.moveDown(0.3);

    doc.text(`Subtotal: ${money(sale.subtotal, currency)}`, { align: "right" });
    if (Number(sale.discount) > 0) doc.text(`Discount: -${money(sale.discount, currency)}`, { align: "right" });
    if (Number(sale.tax) > 0) doc.text(`Tax: ${money(sale.tax, currency)}`, { align: "right" });
    doc.font("Helvetica-Bold").fontSize(11).text(`Total: ${money(sale.total, currency)}`, { align: "right" });
    doc.font("Helvetica").fontSize(9).text(`Payment method: ${sale.paymentMethod.replace("_", " ")}`, { align: "right" });

    doc.moveDown(1);
    doc.fontSize(9).text("Thank you for your purchase!", { align: "center" });

    doc.end();
  });
}

export function buildReceiptHtml(sale, organization) {
  const currency = organization.currency;
  const rows = sale.items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${item.product.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${item.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${Number(item.unitPrice).toFixed(2)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${Number(item.total).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2937;">
    <h2 style="text-align:center;margin-bottom:0;">${organization.name}</h2>
    <p style="text-align:center;margin-top:4px;color:#6b7280;">${sale.store.name}${sale.store.address ? " &middot; " + sale.store.address : ""}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;" />
    <p style="font-size:14px;">
      <strong>Receipt:</strong> ${sale.receiptNumber}<br/>
      <strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString()}<br/>
      <strong>Cashier:</strong> ${sale.cashier.name}<br/>
      ${sale.customer ? `<strong>Customer:</strong> ${sale.customer.name}<br/>` : ""}
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e5e7eb;">Item</th>
          <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #e5e7eb;">Qty</th>
          <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #e5e7eb;">Price</th>
          <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="text-align:right;margin-top:12px;font-size:14px;">
      <p style="margin:2px 0;">Subtotal: ${money(sale.subtotal, currency)}</p>
      ${Number(sale.discount) > 0 ? `<p style="margin:2px 0;">Discount: -${money(sale.discount, currency)}</p>` : ""}
      ${Number(sale.tax) > 0 ? `<p style="margin:2px 0;">Tax: ${money(sale.tax, currency)}</p>` : ""}
      <p style="margin:6px 0;font-size:18px;font-weight:bold;">Total: ${money(sale.total, currency)}</p>
      <p style="margin:2px 0;color:#6b7280;">Paid via ${sale.paymentMethod.replace("_", " ")}</p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:16px;" />
    <p style="text-align:center;color:#6b7280;">Thank you for your purchase!</p>
  </div>`;
}

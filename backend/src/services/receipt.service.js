import PDFDocument from "pdfkit";

const COLORS = {
  text: "#111827",
  muted: "#6b7280",
  line: "#d1d5db",
  lineDark: "#374151",
  headerBg: "#f3f4f6",
};

function formatAmount(amount) {
  return Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function money(amount, currency) {
  return `${currency} ${formatAmount(amount)}`;
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Narrow "receipt roll" layout (~80mm), sized to content so there's no wasted blank
// space at the bottom — the height below is a generous-but-close estimate; pdfkit
// simply starts a second page in the rare case a store name/address wraps more than
// expected, so this never clips content.
export function buildReceiptPdf(sale, organization) {
  return new Promise((resolve, reject) => {
    const width = 226;
    const margin = 16;
    const contentWidth = width - margin * 2;

    const showStoreName = sale.store.name.trim().toLowerCase() !== organization.name.trim().toLowerCase();
    let estimatedHeight = margin * 2 + 100;
    if (showStoreName) estimatedHeight += 13;
    if (sale.store.phone) estimatedHeight += 12;
    if (sale.store.address) estimatedHeight += 12;
    if (sale.customer) estimatedHeight += sale.customer.phone ? 27 : 15;
    estimatedHeight += 18 + sale.items.length * 16;
    if (Number(sale.discount) > 0) estimatedHeight += 13;
    if (Number(sale.tax) > 0) estimatedHeight += 13;
    estimatedHeight += 70;

    const doc = new PDFDocument({ size: [width, estimatedHeight], margin });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = organization.currency;
    const right = margin + contentWidth;
    const center = { width: contentWidth, align: "center" };

    const hr = (color = COLORS.line, weight = 0.75) => {
      doc.moveTo(margin, doc.y).lineTo(right, doc.y).lineWidth(weight).strokeColor(color).stroke();
      doc.moveDown(0.55);
    };

    // --- Header ---
    doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.text).text(organization.name.toUpperCase(), margin, margin, center);
    doc.moveDown(0.25);
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted);
    if (showStoreName) doc.text(sale.store.name, center);
    if (sale.store.phone) doc.text(sale.store.phone, center);
    if (sale.store.address) doc.text(sale.store.address, center);
    doc.moveDown(0.5);
    hr();

    // --- Customer ---
    if (sale.customer) {
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text).text(sale.customer.name, center);
      if (sale.customer.phone) doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted).text(sale.customer.phone, center);
      doc.moveDown(0.4);
    }

    // --- Receipt meta ---
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.text).text(`Receipt# ${sale.receiptNumber}`, center);
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted).text(formatDate(sale.createdAt), center);
    doc.text(`Served by ${sale.cashier.name}`, center);
    doc.moveDown(0.6);

    // --- Items table ---
    const nameW = 76;
    const priceW = 40;
    const qtyW = 22;
    const totalW = 56;
    const xName = margin;
    const xPrice = xName + nameW;
    const xQty = xPrice + priceW;
    const xTotal = xQty + qtyW;

    const headerY = doc.y;
    doc.rect(margin, headerY - 3, contentWidth, 17).fill(COLORS.headerBg);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.text);
    doc.text("Item", xName + 3, headerY, { width: nameW - 3 });
    doc.text("Price", xPrice, headerY, { width: priceW, align: "right" });
    doc.text("Qty", xQty, headerY, { width: qtyW, align: "right" });
    doc.text("Total", xTotal, headerY, { width: totalW - 3, align: "right" });
    doc.y = headerY + 19;

    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.text);
    for (const item of sale.items) {
      const rowY = doc.y;
      doc.text(item.product.name, xName + 3, rowY, { width: nameW - 3, height: 11, ellipsis: true, lineBreak: false });
      doc.text(formatAmount(item.unitPrice), xPrice, rowY, { width: priceW, align: "right" });
      doc.text(String(item.quantity), xQty, rowY, { width: qtyW, align: "right" });
      doc.text(formatAmount(item.total), xTotal, rowY, { width: totalW - 3, align: "right" });
      doc.y = rowY + 16;
    }

    doc.moveDown(0.3);
    hr(COLORS.lineDark, 1.25);

    // --- Totals --- (explicit label/value columns, not chained "continued" text,
    // so a wide amount can never wrap onto a second line and collide with the row below)
    const totalsRow = (label, value, opts = {}) => {
      const { bold = false, size = 9, color = COLORS.muted, valueColor = COLORS.text, valueWidth = 80 } = opts;
      const rowY = doc.y;
      const font = bold ? "Helvetica-Bold" : "Helvetica";
      doc.font(font).fontSize(size).fillColor(color).text(label, margin, rowY, { width: contentWidth - valueWidth });
      doc.font(font).fontSize(size).fillColor(valueColor).text(value, margin + contentWidth - valueWidth, rowY, { width: valueWidth, align: "right" });
      doc.y = rowY + size + 5;
    };

    totalsRow("Subtotal", money(sale.subtotal, currency));
    if (Number(sale.discount) > 0) totalsRow("Discount", `-${money(sale.discount, currency)}`);
    if (Number(sale.tax) > 0) totalsRow("Tax", money(sale.tax, currency));
    doc.moveDown(0.25);
    totalsRow("Grand Total", money(sale.total, currency), { bold: true, size: 12, color: COLORS.text, valueWidth: 110 });
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted).text(`Paid via ${sale.paymentMethod.replace("_", " ")}`, margin, doc.y, center);

    doc.moveDown(0.6);
    hr();

    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text("Thank you, visit again!", margin, doc.y, center);

    doc.end();
  });
}

export function buildReceiptHtml(sale, organization) {
  const currency = organization.currency;
  const showStoreName = sale.store.name.trim().toLowerCase() !== organization.name.trim().toLowerCase();

  const rows = sale.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;color:#111827;">${item.product.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:right;color:#6b7280;">${item.quantity}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:right;color:#6b7280;">${formatAmount(item.unitPrice)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:right;color:#111827;font-weight:600;">${formatAmount(item.total)}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:380px;margin:0 auto;color:#111827;">
    <h1 style="text-align:center;margin:0;font-size:22px;letter-spacing:0.5px;">${organization.name.toUpperCase()}</h1>
    ${showStoreName ? `<p style="text-align:center;margin:4px 0 0;color:#6b7280;font-size:13px;">${sale.store.name}</p>` : ""}
    ${sale.store.phone ? `<p style="text-align:center;margin:2px 0 0;color:#6b7280;font-size:13px;">${sale.store.phone}</p>` : ""}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />

    ${
      sale.customer
        ? `<p style="text-align:center;margin:0 0 16px;">
             <span style="font-weight:600;font-size:14px;">${sale.customer.name}</span>
             ${sale.customer.phone ? `<br/><span style="color:#6b7280;font-size:13px;">${sale.customer.phone}</span>` : ""}
           </p>`
        : ""
    }

    <p style="text-align:center;margin:0 0 16px;font-size:13px;">
      <strong>Receipt# ${sale.receiptNumber}</strong><br/>
      <span style="color:#6b7280;">${formatDate(sale.createdAt)}</span><br/>
      <span style="color:#6b7280;">Served by ${sale.cashier.name}</span>
    </p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="text-align:left;padding:8px 10px;font-size:12px;color:#374151;">Item</th>
          <th style="text-align:right;padding:8px 10px;font-size:12px;color:#374151;">Qty</th>
          <th style="text-align:right;padding:8px 10px;font-size:12px;color:#374151;">Price</th>
          <th style="text-align:right;padding:8px 10px;font-size:12px;color:#374151;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="border-top:2px solid #374151;margin-top:8px;padding-top:10px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280;margin:2px 0;">
        <span>Subtotal</span><span>${money(sale.subtotal, currency)}</span>
      </div>
      ${
        Number(sale.discount) > 0
          ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280;margin:2px 0;"><span>Discount</span><span>-${money(sale.discount, currency)}</span></div>`
          : ""
      }
      ${
        Number(sale.tax) > 0
          ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280;margin:2px 0;"><span>Tax</span><span>${money(sale.tax, currency)}</span></div>`
          : ""
      }
      <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:700;margin:8px 0 2px;">
        <span>Grand Total</span><span>${money(sale.total, currency)}</span>
      </div>
      <p style="text-align:right;color:#6b7280;font-size:12px;margin:0;">Paid via ${sale.paymentMethod.replace("_", " ")}</p>
    </div>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0 12px;" />
    <p style="text-align:center;color:#6b7280;font-size:13px;">Thank you, visit again!</p>
  </div>`;
}

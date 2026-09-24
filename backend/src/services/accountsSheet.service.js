import PDFDocument from "pdfkit";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { resolveStoreScope } from "./reports.service.js";
import { assertStoreAccess } from "../middleware/auth.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Same TC codes as the manual paper sheet this replicates, with one addition (P — the
// original repurposed the store owner sat down and picked "S/D/E/L" as its whole legend;
// there was no code for "a sale was marked paid" because that concept doesn't exist in a
// pure cash ledger. P fills that gap while D stays free for a real future bank-deposit
// feature.
const TC_ORDER = { S: 0, P: 1, D: 2, E: 3, L: 4 };

function round2(n) {
  return Math.round(n * 100) / 100;
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function dayLabel(date) {
  return `${ordinal(date.getDate())} ${MONTH_NAMES[date.getMonth()]}, ${date.getFullYear()}`;
}

// Rolls up one store's sales/expenses for one calendar month into the same
// DATE/DESCRIPTION/TC/Receipts-IN-OUT/Primary-IN-OUT row shape as the paper Accounts
// Sheet this replaces. Row semantics (confirmed with the store owner):
//   S — a day's worth of newly-created sales (Receipts IN), one row per day.
//   P — a day's worth of sales marked paid (Receipts OUT *and* Primary Account IN,
//       same amount, same row), one row per day.
//   E — one Expense record (Primary Account OUT).
//   L — one refunded sale (Primary Account OUT, for the refunded amount) — revenue that
//       really was collected and confirmed, then reversed.
// Plus hand-entered ManualSaleEntry rows (also TC S, but hitting Primary Account IN
// directly rather than Receipts IN — see createManualSaleEntry below).
// Cancelled sales are excluded entirely, at every stage, regardless of what status they
// passed through before being cancelled.
// Every row carries `id`/`source` so the frontend knows which ones it can delete:
// "manual-sale" rows can be removed outright; "auto" (real sales/refunds) and "expense"
// rows can't be touched from this report (expenses are managed on the Expenses page).
export async function getAccountsSheetData({ user, storeId, year, month }) {
  if (!storeId) throw ApiError.badRequest("storeId is required");
  resolveStoreScope(user, storeId); // validates access; throws if the user can't see this store

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw ApiError.notFound("Store not found");
  const organization = await prisma.organization.findUnique({ where: { id: store.organizationId } });

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const [sales, expenses, manualEntries] = await Promise.all([
    prisma.sale.findMany({
      where: {
        storeId,
        status: { not: "CANCELLED" },
        OR: [
          { createdAt: { gte: start, lte: end } },
          { paidAt: { gte: start, lte: end } },
          { status: "REFUNDED", refundedAt: { gte: start, lte: end } },
        ],
      },
      select: { id: true, receiptNumber: true, total: true, createdAt: true, paidAt: true, status: true, refundedAt: true },
    }),
    prisma.expense.findMany({
      where: { storeId, date: { gte: start, lte: end } },
      select: { id: true, description: true, amount: true, date: true },
      orderBy: { date: "asc" },
    }),
    prisma.manualSaleEntry.findMany({
      where: { storeId, date: { gte: start, lte: end } },
      select: { id: true, description: true, amount: true, date: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const sByDay = new Map();
  for (const s of sales) {
    if (s.createdAt < start || s.createdAt > end) continue;
    const key = dayKey(s.createdAt);
    const group = sByDay.get(key) ?? { date: new Date(s.createdAt.getFullYear(), s.createdAt.getMonth(), s.createdAt.getDate()), total: 0 };
    group.total += Number(s.total);
    sByDay.set(key, group);
  }

  const pByDay = new Map();
  for (const s of sales) {
    if (!s.paidAt || s.paidAt < start || s.paidAt > end) continue;
    const key = dayKey(s.paidAt);
    const group = pByDay.get(key) ?? { date: new Date(s.paidAt.getFullYear(), s.paidAt.getMonth(), s.paidAt.getDate()), total: 0 };
    group.total += Number(s.total);
    pByDay.set(key, group);
  }

  const rows = [];
  for (const { date, total } of sByDay.values()) {
    rows.push({ id: null, source: "auto", date, description: `Sales on ${dayLabel(date)}`, tc: "S", receiptsIn: round2(total), receiptsOut: 0, primaryIn: 0, primaryOut: 0 });
  }
  for (const { date, total } of pByDay.values()) {
    rows.push({ id: null, source: "auto", date, description: `Sales marked paid on ${dayLabel(date)}`, tc: "P", receiptsIn: 0, receiptsOut: round2(total), primaryIn: round2(total), primaryOut: 0 });
  }
  for (const e of expenses) {
    rows.push({ id: e.id, source: "expense", date: e.date, description: e.description, tc: "E", receiptsIn: 0, receiptsOut: 0, primaryIn: 0, primaryOut: round2(Number(e.amount)) });
  }
  for (const s of sales) {
    if (s.status !== "REFUNDED" || !s.refundedAt || s.refundedAt < start || s.refundedAt > end) continue;
    rows.push({ id: null, source: "auto", date: s.refundedAt, description: `Refund - ${s.receiptNumber}`, tc: "L", receiptsIn: 0, receiptsOut: 0, primaryIn: 0, primaryOut: round2(Number(s.total)) });
  }
  // Manual sale entries count as immediately-confirmed revenue — Primary Account IN
  // only, not Receipts IN. They deliberately skip the Receipts columns entirely: those
  // exist to track the gap between a real sale being drafted and later confirmed paid,
  // which doesn't apply here (whoever enters a manual entry is confirming it on the
  // spot). Populating Receipts IN too would create a balance nothing ever "clears" —
  // permanently inflating Receipts Ending Balance for a sale that's already settled.
  for (const m of manualEntries) {
    const amount = round2(Number(m.amount));
    rows.push({ id: m.id, source: "manual-sale", date: m.date, description: m.description, tc: "S", receiptsIn: 0, receiptsOut: 0, primaryIn: amount, primaryOut: 0 });
  }

  rows.sort((a, b) => {
    const dayDiff = dayKey(a.date).localeCompare(dayKey(b.date));
    if (dayDiff !== 0) return dayDiff;
    return TC_ORDER[a.tc] - TC_ORDER[b.tc];
  });

  const receiptsIn = round2(rows.reduce((sum, r) => sum + r.receiptsIn, 0));
  const receiptsOut = round2(rows.reduce((sum, r) => sum + r.receiptsOut, 0));
  const primaryIn = round2(rows.reduce((sum, r) => sum + r.primaryIn, 0));
  const primaryOut = round2(rows.reduce((sum, r) => sum + r.primaryOut, 0));
  const receiptsEnding = round2(receiptsIn - receiptsOut);
  const primaryEnding = round2(primaryIn - primaryOut);

  return {
    businessName: organization.name,
    storeName: store.name,
    monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
    currency: organization.currency,
    year,
    month,
    rows,
    summary: {
      receiptsIn,
      receiptsOut,
      receiptsEnding,
      primaryIn,
      primaryOut,
      primaryEnding,
      totalFundsOnHand: primaryEnding,
    },
  };
}

export async function createManualSaleEntry({ user, storeId, date, description, amount }) {
  assertStoreAccess(user, storeId);
  return prisma.manualSaleEntry.create({
    data: { storeId, createdById: user.id, date, description, amount },
  });
}

export async function deleteManualSaleEntry({ user, entryId }) {
  const existing = await prisma.manualSaleEntry.findFirst({
    where: { id: entryId, store: { organizationId: user.organizationId } },
  });
  if (!existing) throw ApiError.notFound("Manual entry not found");
  assertStoreAccess(user, existing.storeId);
  await prisma.manualSaleEntry.delete({ where: { id: entryId } });
  return existing;
}

// --- PDF rendering ---
// Landscape, wide multi-column table — same helpers/conventions as receipt.service.js
// (Helvetica, a COLORS palette, manual x/y row layout), adapted for a table this much
// wider and taller (needs its own pagination, which the narrow receipt never does).

const COLORS = {
  text: "#111827",
  muted: "#6b7280",
  line: "#d1d5db",
  lineDark: "#374151",
  headerBg: "#f3f4f6",
};

function formatAmount(n) {
  return n === 0 ? "" : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const COLS = [
  { key: "day", label: "Date", width: 32, align: "left" },
  { key: "description", label: "Transaction Description", width: 190, align: "left" },
  { key: "tc", label: "TC", width: 24, align: "center" },
  { key: "receiptsIn", label: "Receipts In", width: 70, align: "right" },
  { key: "receiptsOut", label: "Receipts Out", width: 70, align: "right" },
  { key: "primaryIn", label: "Primary In", width: 70, align: "right" },
  { key: "primaryOut", label: "Primary Out", width: 70, align: "right" },
];

export function buildAccountsSheetPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const margin = 36;
    const tableWidth = COLS.reduce((s, c) => s + c.width, 0);
    const pageBottom = doc.page.height - margin;

    function drawHeader() {
      doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.text).text("ACCOUNTS SHEET", margin, margin, { width: tableWidth, align: "center" });
      doc.moveDown(0.6);

      const colWidth = tableWidth / 3;
      const y = doc.y;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.text);
      doc.text(data.businessName, margin, y, { width: colWidth, align: "center" });
      doc.text(data.storeName, margin + colWidth, y, { width: colWidth, align: "center" });
      doc.text(data.monthLabel, margin + colWidth * 2, y, { width: colWidth, align: "center" });
      doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
      doc.text("(Business Name)", margin, y + 13, { width: colWidth, align: "center" });
      doc.text("(Store)", margin + colWidth, y + 13, { width: colWidth, align: "center" });
      doc.text("(Month and Year)", margin + colWidth * 2, y + 13, { width: colWidth, align: "center" });
      doc.y = y + 26;
      doc.moveDown(0.4);
    }

    function drawTableHeader() {
      const y = doc.y;
      doc.rect(margin, y, tableWidth, 16).fill(COLORS.headerBg);
      doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.text);
      let x = margin;
      for (const col of COLS) {
        doc.text(col.label, x + 3, y + 4, { width: col.width - 6, align: col.align });
        x += col.width;
      }
      doc.y = y + 16;
      doc.moveTo(margin, doc.y).lineTo(margin + tableWidth, doc.y).lineWidth(0.75).strokeColor(COLORS.lineDark).stroke();
    }

    function ensurePageSpace(rowHeight) {
      if (doc.y + rowHeight > pageBottom) {
        doc.addPage();
        doc.y = margin;
        return true;
      }
      return false;
    }

    function ensureRowSpace(rowHeight) {
      if (ensurePageSpace(rowHeight)) drawTableHeader();
    }

    function drawRow(row, bold = false) {
      const rowHeight = 15;
      ensureRowSpace(rowHeight);
      const y = doc.y;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8).fillColor(COLORS.text);
      let x = margin;
      for (const col of COLS) {
        const value = row[col.key] ?? "";
        doc.text(String(value), x + 3, y + 3, { width: col.width - 6, align: col.align, ellipsis: true, lineBreak: false });
        x += col.width;
      }
      doc.y = y + rowHeight;
      doc.moveTo(margin, doc.y).lineTo(margin + tableWidth, doc.y).lineWidth(0.5).strokeColor(COLORS.line).stroke();
    }

    drawHeader();
    drawTableHeader();

    for (const r of data.rows) {
      drawRow({
        day: String(r.date.getDate()).padStart(2, "0"),
        description: r.description,
        tc: r.tc,
        receiptsIn: formatAmount(r.receiptsIn),
        receiptsOut: formatAmount(r.receiptsOut),
        primaryIn: formatAmount(r.primaryIn),
        primaryOut: formatAmount(r.primaryOut),
      });
    }

    drawRow(
      {
        day: "",
        description: "TOTALS OF ALL COLUMNS",
        tc: "",
        receiptsIn: formatAmount(data.summary.receiptsIn),
        receiptsOut: formatAmount(data.summary.receiptsOut),
        primaryIn: formatAmount(data.summary.primaryIn),
        primaryOut: formatAmount(data.summary.primaryOut),
      },
      true
    );

    // --- Summary box ---
    ensurePageSpace(110);
    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.text).text("ACCOUNTS SHEET SUMMARY", margin, doc.y);
    doc.moveDown(0.4);

    const summaryLine = (label, value, opts = {}) => {
      const y = doc.y;
      doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(COLORS.text);
      doc.text(label, margin + (opts.indent ?? 0), y, { width: 220 });
      doc.text(value, margin + 220, y, { width: 100, align: "right" });
      doc.y = y + 14;
    };

    summaryLine("RECEIPTS", "", { bold: true });
    summaryLine("IN", formatAmount(data.summary.receiptsIn) || "0.00", { indent: 12 });
    summaryLine("OUT", formatAmount(data.summary.receiptsOut) || "0.00", { indent: 12 });
    summaryLine("Ending Balance", formatAmount(data.summary.receiptsEnding) || "0.00", { indent: 12, bold: true });
    doc.moveDown(0.3);
    summaryLine("PRIMARY ACCOUNT", "", { bold: true });
    summaryLine("IN", formatAmount(data.summary.primaryIn) || "0.00", { indent: 12 });
    summaryLine("OUT", formatAmount(data.summary.primaryOut) || "0.00", { indent: 12 });
    summaryLine("Ending Balance", formatAmount(data.summary.primaryEnding) || "0.00", { indent: 12, bold: true });
    doc.moveDown(0.3);
    summaryLine("TOTAL FUNDS ON HAND AT END OF MONTH", formatAmount(data.summary.totalFundsOnHand) || "0.00", { bold: true });

    doc.end();
  });
}

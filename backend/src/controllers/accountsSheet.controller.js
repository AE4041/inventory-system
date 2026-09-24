import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { toCsv, sendCsv } from "../utils/csv.js";
import {
  getAccountsSheetData,
  getAccountsSheetAllStoresData,
  buildAccountsSheetPdf,
  createManualSaleEntry,
  deleteManualSaleEntry,
} from "../services/accountsSheet.service.js";

function parseYearMonth(req) {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!year || !month || month < 1 || month > 12) {
    throw ApiError.badRequest("Valid 'year' and 'month' (1-12) query params are required");
  }
  return { year, month };
}

function loadAccountsSheet(req, year, month) {
  return req.query.storeId
    ? getAccountsSheetData({ user: req.user, storeId: req.query.storeId, year, month })
    : getAccountsSheetAllStoresData({ user: req.user, year, month });
}

export const getAccountsSheet = asyncHandler(async (req, res) => {
  const { year, month } = parseYearMonth(req);
  const data = await loadAccountsSheet(req, year, month);

  if (req.query.export === "csv") {
    const csv = toCsv(data.rows, [
      { header: "Date", value: (r) => r.date.toISOString().slice(0, 10) },
      ...(data.scope === "all" ? [{ header: "Store", value: (r) => r.storeName }] : []),
      { header: "Transaction Description", value: (r) => r.description },
      { header: "TC", value: (r) => r.tc },
      { header: "Receipts In", value: (r) => (r.receiptsIn ? r.receiptsIn.toFixed(2) : "") },
      { header: "Receipts Out", value: (r) => (r.receiptsOut ? r.receiptsOut.toFixed(2) : "") },
      { header: "Primary Account In", value: (r) => (r.primaryIn ? r.primaryIn.toFixed(2) : "") },
      { header: "Primary Account Out", value: (r) => (r.primaryOut ? r.primaryOut.toFixed(2) : "") },
    ]);
    const filename = `${data.storeName.replace(/[^a-z0-9]+/gi, "-")}-${data.year}-${String(data.month).padStart(2, "0")}.csv`;
    return sendCsv(res, filename, csv);
  }

  res.json({ success: true, data });
});

export const getAccountsSheetPdf = asyncHandler(async (req, res) => {
  const { year, month } = parseYearMonth(req);
  const data = await loadAccountsSheet(req, year, month);
  const pdfBuffer = await buildAccountsSheetPdf(data);
  const filename = `${data.storeName.replace(/[^a-z0-9]+/gi, "-")}-${data.year}-${String(data.month).padStart(2, "0")}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

export const addManualSaleEntry = asyncHandler(async (req, res) => {
  const { storeId, date, description, amount } = req.body;
  const entry = await createManualSaleEntry({ user: req.user, storeId, date, description, amount });
  res.status(201).json({ success: true, data: entry });
});

export const removeManualSaleEntry = asyncHandler(async (req, res) => {
  const entry = await deleteManualSaleEntry({ user: req.user, entryId: req.params.id });
  res.json({ success: true, data: { id: entry.id } });
});

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { buildReceiptPdf, buildReceiptHtml } from "../services/receipt.service.js";
import { sendReceiptEmail } from "../services/email.service.js";

async function loadSaleForReceipt(req) {
  const sale = await prisma.sale.findFirst({
    where: { id: req.params.saleId, store: { organizationId: req.user.organizationId } },
    include: {
      store: true,
      customer: true,
      cashier: { select: { id: true, name: true } },
      items: { include: { product: true } },
    },
  });
  if (!sale) throw ApiError.notFound("Sale not found");
  return sale;
}

export const getReceiptPdf = asyncHandler(async (req, res) => {
  const sale = await loadSaleForReceipt(req);
  const organization = await prisma.organization.findUnique({ where: { id: req.user.organizationId } });

  const pdfBuffer = await buildReceiptPdf(sale, organization);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${sale.receiptNumber}.pdf"`);
  res.send(pdfBuffer);
});

export const emailReceipt = asyncHandler(async (req, res) => {
  const sale = await loadSaleForReceipt(req);
  const organization = await prisma.organization.findUnique({ where: { id: req.user.organizationId } });

  const to = req.body?.email || sale.customer?.email;
  if (!to) throw ApiError.badRequest("No email address available for this customer");

  const html = buildReceiptHtml(sale, organization);
  const pdfBuffer = await buildReceiptPdf(sale, organization);

  await sendReceiptEmail({
    to,
    subject: `Receipt ${sale.receiptNumber} - ${organization.name}`,
    html,
    pdfBuffer,
    pdfFilename: `${sale.receiptNumber}.pdf`,
  });

  await prisma.sale.update({ where: { id: sale.id }, data: { emailSentAt: new Date(), emailSentTo: to } });

  res.json({ success: true, data: { sentTo: to } });
});

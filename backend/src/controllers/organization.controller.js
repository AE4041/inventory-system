import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getOrganization = asyncHandler(async (req, res) => {
  const organization = await prisma.organization.findUnique({ where: { id: req.user.organizationId } });
  res.json({ success: true, data: organization });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const { name, currency, taxRate } = req.body;
  const organization = await prisma.organization.update({
    where: { id: req.user.organizationId },
    data: { name, currency, taxRate },
  });
  res.json({ success: true, data: organization });
});

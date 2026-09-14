import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

function signToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

function toSafeUser(user, storeIds = [], organization) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    storeIds,
    organization: organization
      ? { id: organization.id, name: organization.name, currency: organization.currency, taxRate: Number(organization.taxRate) }
      : undefined,
  };
}

// Bootstraps a brand-new organization with its first admin user.
export const registerOrganization = asyncHandler(async (req, res) => {
  const { organizationName, adminName, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);

  const { organization, user } = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: organizationName } });
    const user = await tx.user.create({
      data: {
        organizationId: organization.id,
        name: adminName,
        email,
        passwordHash,
        role: "ADMIN",
      },
    });
    return { organization, user };
  });

  const token = signToken(user);
  res.status(201).json({ success: true, data: { token, user: toSafeUser(user, [], organization), organization } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { storeAccess: { select: { storeId: true } }, organization: true },
  });
  if (!user || !user.active) throw ApiError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const token = signToken(user);
  const storeIds = user.storeAccess.map((s) => s.storeId);
  res.json({ success: true, data: { token, user: toSafeUser(user, storeIds, user.organization) } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

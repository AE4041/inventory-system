import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";

// Automated actions (MikroTik webhook events, the nightly voucher close-out) still need a
// `userId` to attribute inventory transactions and sales to, since that column is required
// and doubles as the audit trail's "who did this" field. Each organization gets one shared
// system account for this, created lazily on first use — never used to log in.
export async function getOrCreateSystemUser(organizationId) {
  const email = `mikrotik-integration+${organizationId}@system.local`;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
  return prisma.user.create({
    data: {
      organizationId,
      name: "MikroTik Integration",
      email,
      passwordHash,
      role: "CASHIER",
      active: true,
    },
  });
}

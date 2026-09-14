import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { prisma } from "../lib/prisma.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized("Missing authentication token");

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { storeAccess: { select: { storeId: true } }, organization: true },
    });

    if (!user || !user.active) throw ApiError.unauthorized("Account is inactive or no longer exists");

    req.user = {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      name: user.name,
      role: user.role,
      storeIds: user.storeAccess.map((s) => s.storeId),
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        currency: user.organization.currency,
        taxRate: Number(user.organization.taxRate),
      },
    };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

// Restrict a route to specific roles, e.g. authorize("ADMIN", "MANAGER")
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}

// Throws if the user cannot operate on the given store.
// Admins can access every store in their organization.
export function assertStoreAccess(user, storeId) {
  if (!storeId) throw ApiError.badRequest("storeId is required");
  if (user.role === "ADMIN") return;
  if (!user.storeIds.includes(storeId)) {
    throw ApiError.forbidden("You do not have access to this store");
  }
}

import { ApiError } from "../utils/apiError.js";

// Guards the org-agnostic "close out every store" endpoint — meant for an external
// scheduler (e.g. Vercel Cron, since serverless deployments can't run node-cron in-process),
// not for a logged-in admin, since it isn't scoped to one organization.
export function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw ApiError.forbidden("CRON_SECRET is not configured on the server");
  if (req.headers["x-cron-secret"] !== secret) throw ApiError.unauthorized("Invalid cron secret");
  next();
}

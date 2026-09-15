import { ApiError } from "../utils/apiError.js";

// Guards the org-agnostic "close out every store" endpoint — meant for a scheduler,
// not for a logged-in admin, since it isn't scoped to one organization.
// Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when it invokes a
// scheduled endpoint, as long as an env var named exactly CRON_SECRET is set on the project —
// that's the primary path. `X-Cron-Secret` is accepted too, for manual/external testing
// (curl, a different scheduler, etc.) without needing to fake Vercel's own header.
export function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw ApiError.forbidden("CRON_SECRET is not configured on the server");

  const bearer = req.headers.authorization === `Bearer ${secret}`;
  const custom = req.headers["x-cron-secret"] === secret;
  if (!bearer && !custom) throw ApiError.unauthorized("Invalid cron secret");
  next();
}

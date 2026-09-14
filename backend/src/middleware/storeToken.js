import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Authenticates a router-side webhook call by its store's integration token, instead of a
// user JWT — there's no human logging in here. Attaches the resolved store as `req.store`.
// Accepts the token as either a header or a `?token=` query param — RouterOS's `/tool fetch`
// custom-header syntax varies enough by version that a URL-embedded token is more reliable
// to script against than relying on multi-header support.
export const authenticateStoreToken = asyncHandler(async (req, res, next) => {
  const token = req.headers["x-store-token"] || req.query.token;
  if (!token) throw ApiError.unauthorized("Missing store token (X-Store-Token header or ?token= query param)");

  const store = await prisma.store.findUnique({ where: { mikrotikToken: token } });
  if (!store || !store.active) throw ApiError.unauthorized("Invalid or inactive store token");

  req.store = store;
  next();
});

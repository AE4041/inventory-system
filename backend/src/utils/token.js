import crypto from "crypto";

// A machine credential for store-scoped webhook integrations (MikroTik, etc.) —
// deliberately not a JWT, since there's no user behind it to log in as.
export function generateIntegrationToken() {
  return "mtk_" + crypto.randomBytes(24).toString("hex");
}

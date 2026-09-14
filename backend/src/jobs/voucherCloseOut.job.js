import cron from "node-cron";
import { closeOutAllStores } from "../services/voucherCloseOut.service.js";

// Runs once a night — rolls up the day's voucher redemptions across every store into Sales.
// Time is server-local; override with VOUCHER_CLOSEOUT_CRON (standard 5-field cron syntax)
// if the server's timezone doesn't match your business's, e.g. "5 0 * * *" for 00:05.
const schedule = process.env.VOUCHER_CLOSEOUT_CRON || "5 0 * * *";

export function startVoucherCloseOutJob() {
  cron.schedule(schedule, async () => {
    try {
      const results = await closeOutAllStores();
      const totalSales = results.reduce((sum, r) => sum + r.sales.length, 0);
      if (totalSales > 0) {
        console.log(`[voucher-closeout] created ${totalSales} sale(s) across ${results.length} store(s)`);
      }
    } catch (err) {
      console.error("[voucher-closeout] failed:", err);
    }
  });
  console.log(`[voucher-closeout] scheduled ("${schedule}")`);
}

import "dotenv/config";
import { createApp } from "./app.js";
import { startVoucherCloseOutJob } from "./jobs/voucherCloseOut.job.js";

const port = process.env.PORT || 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

// Only meaningful for a persistent server process — a Vercel serverless deployment should
// call POST /api/integrations/mikrotik/close-day-all from an external scheduler instead
// (e.g. Vercel Cron), since serverless functions can't keep a timer running between requests.
startVoucherCloseOutJob();

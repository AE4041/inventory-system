import "dotenv/config";
import { createApp } from "../src/app.js";

// Vercel Node.js serverless entry point. Every request under /api/* is routed
// here (see ../vercel.json) and handled by the same Express app used locally.
export default createApp();

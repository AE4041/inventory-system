import { Resend } from "resend";
import { ApiError } from "../utils/apiError.js";

let resendClient = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendReceiptEmail({ to, subject, html, pdfBuffer, pdfFilename }) {
  const client = getClient();
  if (!client) {
    throw new ApiError(503, "Email is not configured. Set RESEND_API_KEY in the backend environment to enable it.");
  }

  await client.emails.send({
    from: process.env.RECEIPT_FROM_EMAIL || "receipts@example.com",
    to,
    subject,
    html,
    attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer.toString("base64") }] : undefined,
  });
}

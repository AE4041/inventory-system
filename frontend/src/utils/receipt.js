import { receiptsApi } from "../services/resources";

// Fetches the receipt PDF (auth header required, so it can't be a plain <a href>) and
// opens it in a new tab where the browser's own PDF viewer offers print/save.
export async function openReceiptPdf(saleId) {
  const { data } = await receiptsApi.fetchPdfBlob(saleId);
  const blobUrl = URL.createObjectURL(data);
  window.open(blobUrl, "_blank");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

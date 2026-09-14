import { api } from "../services/api";

// Downloads a CSV export from an authenticated API endpoint (can't use a plain <a href>
// because the JWT has to travel as an Authorization header, not a cookie).
export async function downloadCsv(path, params, filename) {
  const { data } = await api.get(path, { params: { ...params, export: "csv" }, responseType: "blob" });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function formatCurrency(amount, currency = "GHS") {
  const value = Number(amount ?? 0);
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusBadgeClass(status) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-gray-200 text-gray-600";
    case "REFUNDED":
      return "bg-amber-100 text-amber-700";
    case "PENDING":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

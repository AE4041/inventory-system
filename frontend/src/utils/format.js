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
    case "PAID":
      return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400";
    case "DRAFT":
      return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400";
    case "CANCELLED":
      return "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
    case "REFUNDED":
      return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400";
    case "PENDING":
      return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400";
    default:
      return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
  }
}

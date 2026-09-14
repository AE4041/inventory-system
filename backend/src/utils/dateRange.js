import { ApiError } from "./apiError.js";

// Resolves a dashboard/report date filter into a concrete { from, to } range.
// Supported presets: today, yesterday, this_week, last_week, this_month, last_month, this_year, custom
export function resolveDateRange(preset, fromParam, toParam) {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  if (preset === "custom") {
    if (!fromParam || !toParam) throw ApiError.badRequest("A custom date range needs both 'from' and 'to' dates");
    return { from: startOfDay(new Date(fromParam)), to: endOfDay(new Date(toParam)) };
  }

  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "this_week": {
      const start = new Date(now);
      const day = (start.getDay() + 6) % 7; // Monday = 0
      start.setDate(start.getDate() - day);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case "last_week": {
      const start = new Date(now);
      const day = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - day - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { from: startOfDay(start), to: endOfDay(end) };
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(start), to: endOfDay(end) };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

// A "custom" range isn't usable until both dates are picked — callers should skip
// fetching rather than send a half-filled range the backend will reject.
export function isRangeReady(value) {
  return value.preset !== "custom" || (!!value.from && !!value.to);
}

// Converts a DateRangeFilter value into the query params the backend report/dashboard endpoints expect.
export function dateRangeParams(value) {
  if (value.preset !== "custom") return { preset: value.preset };
  return {
    preset: "custom",
    from: value.from ? toIsoDate(value.from) : undefined,
    to: value.to ? toIsoDate(value.to) : undefined,
  };
}

function toIsoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

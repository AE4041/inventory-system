import { Select as Dropdown } from "@/components/ui-compat/Select";
import { DatePicker as Calendar } from "@/components/ui-compat/DatePicker";

const PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this_week" },
  { label: "Last Week", value: "last_week" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
  { label: "Custom Range", value: "custom" },
];

// `value` = { preset, from, to } where from/to are JS Date objects (only used when preset === "custom").
export default function DateRangeFilter({ value, onChange }) {
  const setPreset = (preset) => onChange({ ...value, preset });
  const setFrom = (from) => onChange({ ...value, from });
  const setTo = (to) => onChange({ ...value, to });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dropdown optionValue="value" value={value.preset} options={PRESETS} onChange={(e) => setPreset(e.value)} className="w-44" />
      {value.preset === "custom" && (
        <>
          <Calendar value={value.from} onChange={(e) => setFrom(e.value)} placeholder="From" showIcon dateFormat="M d, yy" />
          <Calendar value={value.to} onChange={(e) => setTo(e.value)} placeholder="To" showIcon dateFormat="M d, yy" />
        </>
      )}
    </div>
  );
}

import { resolveIcon } from "../icons/registry";

export default function StatCard({ label, value, icon, accent = "blue", suffix }) {
  const accentClasses = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    red: "bg-rose-500",
    amber: "bg-amber-500",
    purple: "bg-violet-500",
    gray: "bg-gray-500",
  };
  const Icon = resolveIcon(icon);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 shadow-card transition-shadow duration-200 hover:shadow-md">
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm ${accentClasses[accent]}`}>
          <Icon className="text-lg" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{label}</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-white break-words leading-tight">
          {value}
          {suffix && <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

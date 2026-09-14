export default function StatCard({ label, value, icon, accent = "blue", suffix }) {
  const accentClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-violet-50 text-violet-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accentClasses[accent]}`}>
          <i className={`pi ${icon} text-lg`} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-xl font-semibold text-gray-900 break-words leading-tight">
          {value}
          {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

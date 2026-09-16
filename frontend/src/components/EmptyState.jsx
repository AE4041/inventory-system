import { resolveIcon } from "../icons/registry";

export default function EmptyState({ icon = "pi-inbox", title, subtitle, action }) {
  const Icon = resolveIcon(icon);
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center mb-3">
        {Icon && <Icon className="text-xl" />}
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

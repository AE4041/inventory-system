import { NavLink } from "react-router-dom";
import { Bars } from "@primeicons/react";
import { resolveIcon } from "@/icons/registry";

function TabLink({ to, icon, label, end }) {
  const Icon = resolveIcon(icon);
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-medium transition-colors ${
          isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"
        }`
      }
    >
      {Icon && <Icon className="size-4.5" />}
      {label}
    </NavLink>
  );
}

// A native-app-style tab bar for small screens — the primary reason to reach for the
// hamburger drawer on mobile should just be the long tail of less-common pages.
export default function MobileBottomNav({ role, onMore }) {
  const fourthTab =
    role === "ADMIN" || role === "MANAGER"
      ? { to: "/inventory/products", icon: "pi-box", label: "Inventory" }
      : { to: "/customers", icon: "pi-users", label: "Customers" };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-stretch z-40 [padding-bottom:env(safe-area-inset-bottom)]">
      <TabLink to="/" icon="pi-th-large" label="Dashboard" end />
      <TabLink to="/sales/new" icon="pi-shopping-cart" label="New Sale" />
      <TabLink to="/sales" icon="pi-receipt" label="Sales" />
      <TabLink to={fourthTab.to} icon={fourthTab.icon} label={fourthTab.label} />
      <button onClick={onMore} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-medium text-gray-400 dark:text-gray-500">
        <Bars className="size-4.5" />
        More
      </button>
    </nav>
  );
}

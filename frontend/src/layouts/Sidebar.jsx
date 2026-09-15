import { NavLink } from "react-router-dom";
import { resolveIcon } from "@/icons/registry";
import { NAV_SECTIONS } from "./navConfig";

export default function SidebarNav({ role, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {NAV_SECTIONS.filter((section) => !section.roles || section.roles.includes(role)).map((section, idx) => (
        <div key={idx}>
          {section.title && (
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-fg-muted/70">{section.title}</p>
          )}
          <div className="space-y-0.5">
            {section.items
              .filter((item) => !item.roles || item.roles.includes(role))
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-sidebar-active text-white font-semibold shadow-sm"
                        : "text-sidebar-fg-muted hover:bg-sidebar-hover hover:text-sidebar-fg"
                    }`
                  }
                >
                  {({ isActive }) => {
                    const Icon = resolveIcon(item.icon);
                    return (
                      <>
                        {Icon && <Icon className={isActive ? "text-white" : "text-sidebar-fg-muted"} />}
                        {item.label}
                      </>
                    );
                  }}
                </NavLink>
              ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

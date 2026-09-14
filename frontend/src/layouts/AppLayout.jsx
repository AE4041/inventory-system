import { useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { Dropdown } from "primereact/dropdown";
import { Menu } from "primereact/menu";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import BrandMark from "../components/BrandMark";
import SidebarNav from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";

function Logo({ orgName }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <BrandMark size={30} />
      <span className="text-[15px] font-semibold text-gray-900 truncate">{orgName || "Inventory"}</span>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { stores, currentStoreId, setCurrentStore, isAllStores } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();

  const storeOptions = [
    ...(user.role === "ADMIN" ? [{ label: "All Stores", value: "" }] : []),
    ...stores.map((s) => ({ label: s.name, value: s.id })),
  ];

  const userMenuItems = [
    { label: user.name, items: [{ label: user.email, disabled: true }] },
    { separator: true },
    { label: "Log out", icon: "pi pi-sign-out", command: logout },
  ];

  return (
    <div className="h-full flex bg-gray-50">
      <aside className="hidden md:flex md:flex-col w-64 border-r border-gray-200 bg-white shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <Logo orgName={user.organization?.name} />
        </div>
        <SidebarNav role={user.role} />
      </aside>

      <PrimeSidebar visible={mobileOpen} onHide={() => setMobileOpen(false)} className="w-72">
        <div className="mb-3">
          <Logo orgName={user.organization?.name} />
        </div>
        <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
      </PrimeSidebar>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center gap-3 px-4 md:px-6 shrink-0 z-30">
          <button className="md:hidden text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <i className="pi pi-bars text-xl" />
          </button>

          <div className="md:hidden">
            <BrandMark size={28} />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <i className="pi pi-building-columns text-gray-400 text-sm" />
            <Dropdown
              optionValue="value"
              value={currentStoreId}
              options={storeOptions}
              onChange={(e) => setCurrentStore(e.value)}
              className="w-48"
              placeholder="Select store"
              valueTemplate={() => storeOptions.find((o) => o.value === currentStoreId)?.label ?? "Select store"}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {isAllStores && (
              <span className="hidden sm:inline text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">All Stores</span>
            )}
            <Menu model={userMenuItems} popup ref={userMenuRef} />
            <button
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-full transition-colors"
              onClick={(e) => userMenuRef.current?.toggle(e)}
            >
              <span
                className="w-8 h-8 rounded-full text-white flex items-center justify-center font-semibold text-sm shadow-sm"
                style={{ background: "linear-gradient(135deg, #4f46e5, #2563eb)" }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{user.name}</span>
              <i className="pi pi-chevron-down text-xs text-gray-400 hidden sm:inline" />
            </button>
          </div>
        </header>

        {/* Store selector on its own row on small screens (topbar is too tight otherwise). */}
        <div className="sm:hidden flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100">
          <i className="pi pi-building-columns text-gray-400 text-sm" />
          <Dropdown
            optionValue="value"
            value={currentStoreId}
            options={storeOptions}
            onChange={(e) => setCurrentStore(e.value)}
            className="w-full"
            placeholder="Select store"
            valueTemplate={() => storeOptions.find((o) => o.value === currentStoreId)?.label ?? "Select store"}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav role={user.role} onMore={() => setMobileOpen(true)} />
    </div>
  );
}

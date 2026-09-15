import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Drawer, DrawerBackdrop, DrawerContent, DrawerPopup, DrawerPortal } from "@/components/ui/drawer";
import { Menu, MenuItem, MenuLabel, MenuList, MenuPopup, MenuPortal, MenuPositioner, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Select as Dropdown } from "@/components/ui-compat/Select";
import { SignOut, ChevronDown, Bars, BuildingColumns } from "@primeicons/react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import BrandMark from "../components/BrandMark";
import SidebarNav from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";

function Logo({ orgName, dark = false }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <BrandMark size={30} />
      <span className={`text-[15px] font-semibold truncate ${dark ? "text-white" : "text-gray-900"}`}>{orgName || "Inventory"}</span>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { stores, currentStoreId, setCurrentStore, isAllStores } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const storeOptions = [
    ...(user.role === "ADMIN" ? [{ label: "All Stores", value: "" }] : []),
    ...stores.map((s) => ({ label: s.name, value: s.id })),
  ];

  return (
    <div className="h-full flex bg-gray-50">
      <aside className="hidden md:flex md:flex-col w-64 bg-sidebar shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <Logo orgName={user.organization?.name} dark />
        </div>
        <SidebarNav role={user.role} />
      </aside>

      <Drawer open={mobileOpen} onOpenChange={(e) => setMobileOpen(e.value)} position="left">
        <DrawerPortal>
          <DrawerBackdrop />
          <DrawerPopup className="w-72 !bg-sidebar !border-0">
            <DrawerContent>
              <div className="mb-3 mt-5">
                <Logo orgName={user.organization?.name} dark />
              </div>
              <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
            </DrawerContent>
          </DrawerPopup>
        </DrawerPortal>
      </Drawer>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center gap-3 px-4 md:px-6 shrink-0 z-30">
          <button className="md:hidden text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Bars className="size-5" />
          </button>

          <div className="md:hidden">
            <BrandMark size={28} />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <BuildingColumns className="text-gray-400 size-3.5" />
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
              <span className="hidden sm:inline text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full font-medium">All Stores</span>
            )}
            <Menu>
              <MenuTrigger className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-full transition-colors outline-none">
                <span
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center font-semibold text-sm shadow-sm"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.name}</span>
                <ChevronDown className="text-xs text-gray-400 hidden sm:inline size-3" />
              </MenuTrigger>
              <MenuPortal>
                <MenuPositioner>
                  <MenuPopup>
                    <MenuList>
                      <MenuLabel className="!text-gray-700 !text-sm !font-medium !py-1.5">{user.name}</MenuLabel>
                      <MenuLabel>{user.email}</MenuLabel>
                      <MenuSeparator />
                      <MenuItem onClick={logout}>
                        <SignOut className="size-3.5" />
                        Log out
                      </MenuItem>
                    </MenuList>
                  </MenuPopup>
                </MenuPositioner>
              </MenuPortal>
            </Menu>
          </div>
        </header>

        {/* Store selector on its own row on small screens (topbar is too tight otherwise). */}
        <div className="sm:hidden flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100">
          <BuildingColumns className="text-gray-400 size-3.5" />
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

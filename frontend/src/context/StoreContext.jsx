import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { storesApi } from "../services/resources";
import { useAuth } from "./AuthContext";

const StoreContext = createContext(null);

// "" (empty string) means "All Stores" - only meaningful for admins.
export function StoreProvider({ children }) {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [currentStoreId, setCurrentStoreId] = useState(() => localStorage.getItem("currentStoreId") || "");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await storesApi.list();
      setStores(data.data);
      const stillValid = data.data.some((s) => s.id === currentStoreId);
      if (!stillValid) {
        const initial = user.role === "ADMIN" ? "" : data.data[0]?.id || "";
        setCurrentStoreId(initial);
        localStorage.setItem("currentStoreId", initial);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  function setCurrentStore(storeId) {
    setCurrentStoreId(storeId);
    localStorage.setItem("currentStoreId", storeId);
  }

  const currentStore = stores.find((s) => s.id === currentStoreId) || null;

  const value = useMemo(
    () => ({ stores, currentStoreId, currentStore, setCurrentStore, loading, refresh, isAllStores: currentStoreId === "" }),
    [stores, currentStoreId, currentStore, loading, refresh]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

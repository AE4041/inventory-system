import { createContext, useContext, useRef } from "react";
import { Toast } from "primereact/toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toastRef = useRef(null);

  const toast = {
    success: (detail, summary = "Success") => toastRef.current?.show({ severity: "success", summary, detail, life: 3500 }),
    error: (detail, summary = "Error") => toastRef.current?.show({ severity: "error", summary, detail, life: 5000 }),
    info: (detail, summary = "Info") => toastRef.current?.show({ severity: "info", summary, detail, life: 3500 }),
    warn: (detail, summary = "Warning") => toastRef.current?.show({ severity: "warn", summary, detail, life: 4000 }),
  };

  return (
    <ToastContext.Provider value={toast}>
      <Toast ref={toastRef} position="top-right" />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

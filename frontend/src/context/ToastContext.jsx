import { createContext, useContext } from "react";
import { toast } from "primereact/toaster";
import { Toaster } from "@/components/ui/toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const api = {
    success: (detail, summary = "Success") => toast.success({ title: summary, description: detail, duration: 3500 }),
    error: (detail, summary = "Error") => toast.error({ title: summary, description: detail, duration: 5000 }),
    info: (detail, summary = "Info") => toast.info({ title: summary, description: detail, duration: 3500 }),
    warn: (detail, summary = "Warning") => toast.warn({ title: summary, description: detail, duration: 4000 }),
  };

  return (
    <ToastContext.Provider value={api}>
      <Toaster position="top-right" />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

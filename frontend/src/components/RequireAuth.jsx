import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@primeicons/react";
import { useAuth } from "../context/AuthContext";
import BrandMark from "./BrandMark";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
        <BrandMark size={44} />
        <Spinner className="animate-spin size-6 text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandMark from "./BrandMark";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <BrandMark size={44} />
        <i className="pi pi-spin pi-spinner text-xl text-gray-300" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}

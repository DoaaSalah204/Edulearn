import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";

/** Redirects to /signin when logged out. adminOnly also checks the admin role. */
export function RequireAuth({ adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/my-learning" replace />;
  return <Outlet />;
}

/** Signed-in users do not need the sign-in / sign-up pages. */
export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/my-learning"} replace />;
  return <Outlet />;
}

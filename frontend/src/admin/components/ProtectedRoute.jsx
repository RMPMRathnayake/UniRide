import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  return localStorage.getItem("uniride_admin_token") ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

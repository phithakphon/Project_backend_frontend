
import { Navigate, Outlet } from "react-router-dom";

function AdminRoute() {
  const token = localStorage.getItem("token");

  let member = null;

  try {
    member = JSON.parse(localStorage.getItem("member"));
  } catch {
    member = null;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (member?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;

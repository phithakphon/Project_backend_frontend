//ผู้ใช้ที่ยังไม่ได้เข้าสู่ระบบไม่สามารถเข้าหน้า Favorites ได้
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

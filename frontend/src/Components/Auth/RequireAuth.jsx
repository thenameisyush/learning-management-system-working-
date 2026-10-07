import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

function RequireAuth({ allowedRoles = [] }) {
  const { isLoggedIn, role } = useSelector(
    (state) => state.auth
  );

  console.log("RequireAuth DEBUG:", {
    isLoggedIn,
    role,
    allowedRoles,
  });

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = String(role || "").toUpperCase();

  const hasAccess = allowedRoles.some(
    (allowedRole) =>
      String(allowedRole).toUpperCase() === normalizedRole
  );

  if (!hasAccess) {
    return <Navigate to="/denied" replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
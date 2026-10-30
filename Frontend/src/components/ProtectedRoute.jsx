// Mengarahkan pengguna tanpa sesi atau peran yang sesuai dari rute terlindungi.
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, user, allowedRoleIds }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoleIds && !allowedRoleIds.includes(Number(user.role_id))) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;

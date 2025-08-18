import { useAuth } from "@/contexts/auth-context";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import AuthLoader from "@/components/feedback/AuthLoader"; // ✅ correct path

const AuthGuard = ({ requiredRole, children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  // ⏳ Wait for /me hydration
  if (loading) {
    return <AuthLoader />;
  }

  // 🔐 Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🚫 Role mismatch (if requiredRole is provided)
  if (
    requiredRole &&
    role?.toUpperCase() !== requiredRole.toUpperCase()
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Authorized — render protected content
  return children;
};

AuthGuard.propTypes = {
  requiredRole: PropTypes.string, // optional
  children: PropTypes.node.isRequired,
};

export default AuthGuard;
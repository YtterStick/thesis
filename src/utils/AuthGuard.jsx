import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

const AuthGuard = ({ requiredRole, children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  // While fetching /me or waiting for auth to resolve
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Authenticating...</p>
      </div>
    );
  }

  // If not logged in or doesn't match required role
  if (!isAuthenticated) return <Navigate to="/login" replace />;
if (role?.toUpperCase() !== requiredRole?.toUpperCase()) {
  return <Navigate to="/unauthorized" replace />;
}

  // Authorized — render protected content
  return children;
};

AuthGuard.propTypes = {
  requiredRole: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default AuthGuard;
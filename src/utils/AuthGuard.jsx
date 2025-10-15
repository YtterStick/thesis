import { useAuth } from "@/contexts/auth-context";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import AuthLoader from "@/components/feedback/AuthLoader";

const AuthGuard = ({ requiredRole, children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    requiredRole &&
    role?.toUpperCase() !== requiredRole.toUpperCase()
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

AuthGuard.propTypes = {
  requiredRole: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default AuthGuard;
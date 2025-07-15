import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { role: "admin" | "staff", name: ... }

  const login = (credentials) => {
    const { username, password } = credentials;

    // Mock logic — replace with real auth check
    if (username === "admin" && password === "admin123") {
      setUser({ role: "admin", name: "Admin" });
      return true;
    } else if (username === "staff" && password === "staff123") {
      setUser({ role: "staff", name: "Staff" });
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
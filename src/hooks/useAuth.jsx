import { useRef, useEffect, useState, createContext, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenting] = useState(false);
  const hasLoggedOnce = useRef(false);
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      if (!hasLoggedOnce.current) {
        console.log("🔐 No token found. Resetting auth.");
        hasLoggedOnce.current = true;

      }

      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    fetch("http://localhost:8080/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setRole(data.role);
        setIsAuthenticated(true);
        console.log("✅ AuthContext initialized:", data);
      })
      .catch((err) => {
        localStorage.removeItem("authToken");
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
        console.warn("⚠️ AuthContext fetch error:", err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (token) => {
    localStorage.setItem("authToken", token);

    try {
      const res = await fetch("http://localhost:8080/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch user");

      const data = await res.json();
      setUser(data.user);
      setRole(data.role);
      setIsAuthenticated(true);
      console.log("🔐 Logged in:", data);
    } catch (err) {
      localStorage.removeItem("authToken");
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      console.warn("⚠️ Login error:", err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    hasLoggedMissingToken.current = false; // ✅ Reset for next mount
    console.log("🚪 Logged out");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        isAuthenticating,
        setIsAuthenting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
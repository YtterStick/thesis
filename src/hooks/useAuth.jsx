import { useContext, useState, useEffect, createContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenting] = useState(false);

  // 🔁 Fetch /me on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
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
        console.warn("⚠️ AuthContext fetch error:", err.message);
        localStorage.removeItem("jwt");
      })
      .finally(() => setLoading(false));
  }, []);

  // 🔐 Login method after user authenticates
  const login = async (token) => {
    localStorage.setItem("jwt", token);

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
      console.warn("⚠️ Login error:", err.message);
      localStorage.removeItem("jwt");
    }
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    console.log("🚪 Logged out");
  };

  return (
    <AuthContext.Provider
      value={{ user, role, isAuthenticated, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
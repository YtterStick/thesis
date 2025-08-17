import {
  useRef,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const hasLoggedOnce = useRef(false);

  // ✅ Initial token check and user hydration
  const hydrate = async () => {
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

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        console.warn("⏳ Token expired");
        localStorage.removeItem("authToken");
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("❌ Invalid token format");
      localStorage.removeItem("authToken");
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Invalid token");

      const data = await res.json();
      setUser(data.user);
      setRole(data.role);
      setIsAuthenticated(true);
      console.log("✅ AuthContext initialized:", data);
    } catch (err) {
      localStorage.removeItem("authToken");
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      console.warn("⚠️ AuthContext fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
  }, []);

  // ✅ Cross-tab login/logout sync
  useEffect(() => {
  const syncAuth = (e) => {
    if (e.key === "authToken") {
      if (e.newValue === null) {
        console.log("🔄 Token removed in another tab. Logging out.");
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
      } else {
        console.log("🔄 Token added in another tab. Rehydrating auth.");
        hydrate(); // ✅ triggers login state in other tabs
      }
    }
  };

  window.addEventListener("storage", syncAuth);
  return () => window.removeEventListener("storage", syncAuth);
}, []);

  // ✅ Login handler
  const login = async (token) => {
    localStorage.setItem("authToken", token);

    // ✅ Manually dispatch storage event to sync across tabs
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "authToken",
        newValue: token,
      })
    );

    await hydrate(); // ✅ Immediately hydrate current tab
  };

  // ✅ Logout handler
  const logout = () => {
    localStorage.removeItem("authToken");

    // ✅ Manually dispatch storage event to sync across tabs
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "authToken",
        newValue: null,
      })
    );

    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    hasLoggedOnce.current = false;
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
        setIsAuthenticating,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
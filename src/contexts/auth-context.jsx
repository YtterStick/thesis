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
  const [user, setUser] = useState(null); // { username, role }
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const hasLoggedOnce = useRef(false);

  const getStoredToken = () => localStorage.getItem("authToken");

  const hydrate = async () => {
    const token = getStoredToken();

    if (!token) {
      if (!hasLoggedOnce.current) {
        console.log("🔐 No token found. Resetting auth.");
        hasLoggedOnce.current = true;
      }
      resetAuth();
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        console.warn("⏳ Token expired");
        resetAuth();
        return;
      }
    } catch (err) {
      console.warn("❌ Invalid token format");
      resetAuth();
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Invalid token");

      const data = await res.json();
      setUser({ username: data.user, role: data.role });
      setIsAuthenticated(true);
      console.log("✅ AuthContext initialized:", data);
    } catch (err) {
      console.warn("⚠️ AuthContext fetch error:", err.message);
      resetAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    const syncAuth = (e) => {
      if (e.key === "authToken") {
        if (e.newValue === null) {
          console.log("🔄 Token removed in another tab. Logging out.");
          resetAuth();
        } else {
          console.log("🔄 Token added in another tab. Rehydrating auth.");
          hydrate();
        }
      }
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const login = async (token) => {
    localStorage.setItem("authToken", token);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "authToken",
        newValue: token,
      })
    );

    await hydrate();
  };

  const logout = () => {
    localStorage.removeItem("authToken");

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "authToken",
        newValue: null,
      })
    );

    resetAuth();
    console.log("🚪 Logged out");
  };

  const resetAuth = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    hasLoggedOnce.current = false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        username: user?.username,
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
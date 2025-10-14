import {
  useRef,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { getApiUrl } from "@/lib/api-config";
import {
  getToken,
  decodeToken,
  clearAuthTokens,
} from "@/lib/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const hasLoggedOnce = useRef(false);

  const hydrate = async () => {
    const token = getToken();

    if (!token) {
      if (!hasLoggedOnce.current) {
        console.log("🔐 No token found. Resetting auth.");
        hasLoggedOnce.current = true;
      }
      resetAuth();
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      console.warn("⏳ Token expired or invalid");
      resetAuth();
      return;
    }

    try {
      const res = await fetch(getApiUrl("me"), {
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
      if (e.key === "authSync") {
        console.log("🔄 Auth sync triggered. Rehydrating...");
        hydrate();
      }
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const login = async (token) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("authSync", Date.now().toString());
    await hydrate();
  };

  const logout = () => {
    clearAuthTokens();
    localStorage.setItem("authSync", Date.now().toString());
    resetAuth();
    console.log("🚪 Logged out");
  };

  const resetAuth = () => {
    clearAuthTokens();
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
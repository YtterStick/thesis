import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import {
  getToken,
  decodeToken,
  clearAuthTokens,
} from "@/lib/auth"; // ✅ centralized token logic

export const useLogout = () => {
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  const logout = async () => {
    try {
      const token = getToken();

      if (token) {
        // 🧠 Optional: Log token metadata before logout
        const decoded = decodeToken(token);
        if (decoded) {
          console.log("👤 Logging out:", decoded.sub);
          console.log("🔐 Role:", decoded.role);
          console.log("🕒 Issued at:", new Date(decoded.iat * 1000).toLocaleString());
          console.log("⏳ Expires at:", new Date(decoded.exp * 1000).toLocaleString());
        }

        // 🔐 Call backend logout
        try {
          const response = await fetch("http://localhost:8080/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const text = await response.text();

          if (!response.ok) {
            console.warn("🚧 Logout failed:", text);
          } else {
            console.log("✅ Backend logout success");
          }
        } catch (err) {
          console.warn("⚠️ Backend logout error:", err.message);
        }
      }

      // 💣 Clear all tokens and reset context
      clearAuthTokens();
      contextLogout(); // ✅ sync with AuthProvider

      // 🚀 Redirect
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  return logout;
};
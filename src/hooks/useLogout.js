import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import {
  getToken,
  decodeToken,
  clearAuthTokens,
} from "@/lib/auth"; // ✅ centralized token logic
import { api } from "@/lib/api-config"; // Import the api utility

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

        // 🔐 Call backend logout using the api utility
        try {
          // Use the api utility instead of direct fetch
          await api.post("/logout");
          console.log("✅ Backend logout success");
        } catch (err) {
          console.warn("⚠️ Backend logout error:", err.message);
          // Continue with client-side logout even if backend fails
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
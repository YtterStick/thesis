import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { jwtDecode } from "jwt-decode";

export const useLogout = () => {
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  const logout = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (token) {
        // 🧠 Optional: Log token metadata before logout
        try {
          const decoded = jwtDecode(token);
          console.log("👤 Logging out:", decoded.sub);
          console.log("🕒 Issued at:", new Date(decoded.iat * 1000).toLocaleString());
          console.log("⏳ Expires at:", new Date(decoded.exp * 1000).toLocaleString());
        } catch {
          console.warn("⚠️ Failed to decode token before logout");
        }

        // 🔐 Call backend logout
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
      }

      // 💣 Clear token and reset context
      localStorage.removeItem("authToken");
      localStorage.setItem("lastLogout", new Date().toISOString()); // 🧾 Optional audit trail
      contextLogout(); // ✅ sync with AuthProvider

      // 🚀 Redirect
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  return logout;
};
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const useLogout = () => {
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  const logout = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (token) {
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
      contextLogout(); // ✅ sync with AuthProvider

      // 🚀 Redirect
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  return logout;
};
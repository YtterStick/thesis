import { useNavigate } from "react-router-dom";

export const useLogout = () => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      const token = localStorage.getItem("authToken");

      // 🔐 Only send /logout if token is still present
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

      // 💣 Now clear the token
      localStorage.removeItem("authToken");

      // 🚀 Redirect
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  return logout;
};
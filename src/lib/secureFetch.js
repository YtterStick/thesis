const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();

    console.log("🔍 Token expiration check:");
    console.log("⏳ Exp:", new Date(exp).toLocaleString());
    console.log("🕒 Now:", new Date(now).toLocaleString());

    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

export const secureFetch = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("authToken");

  if (!token || isTokenExpired(token)) {
    console.warn("⛔ Token expired. Redirecting to login.");
    window.location.href = "/login";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`http://localhost:8080/api${endpoint}`, options);

  if (!response.ok) {
    console.error(`❌ ${method} ${endpoint} failed:`, response.status);
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
};
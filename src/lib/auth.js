const AUTH_KEY = "authToken";
const ALLOWED_SKEW_MS = 5000;

/**
 * ✅ Get the current token from localStorage
 */
export const getToken = () => localStorage.getItem(AUTH_KEY);

/**
 * 🧠 Decode JWT payload safely with base64 padding
 */
export const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=");
    return JSON.parse(atob(padded));
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return null;
  }
};

/**
 * ⏳ Check if token is expired (with skew buffer)
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;

  const now = Date.now();
  const exp = decoded.exp * 1000;

  console.log("🔍 Token expiration check:");
  console.log("⏳ Exp:", new Date(exp).toLocaleString());
  console.log("🕒 Now:", new Date(now).toLocaleString());

  return exp + ALLOWED_SKEW_MS < now;
};

/**
 * 🔐 Secure fetch wrapper with token validation
 * Throws error if token is missing or expired
 */
export const secureFetch = async (endpoint, method = "GET", body = null) => {
  const token = getToken();

  if (!token || isTokenExpired(token)) {
    throw new Error("⛔ Token expired or missing");
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

/**
 * 💣 Clear all auth-related keys from localStorage
 */
export const clearAuthTokens = () => {
  ["authToken", "token", "userRole", "userId"].forEach((key) =>
    localStorage.removeItem(key)
  );
  localStorage.setItem("lastLogout", new Date().toISOString());
};

/**
 * 🧾 Optional: Log token metadata for debugging
 */
export const logTokenMetadata = () => {
  const token = getToken();
  const decoded = decodeToken(token);
  if (!decoded) return;

  console.log("👤 Token subject:", decoded.sub ?? "N/A");
  console.log("🔐 Role:", decoded.role ?? "N/A");
  console.log("🕒 Issued at:", new Date(decoded.iat * 1000).toLocaleString());
  console.log("⏳ Expires at:", new Date(decoded.exp * 1000).toLocaleString());
};

/**
 * 📦 Structured token metadata for UI or context
 */
export const getTokenMetadata = () => {
  const token = getToken();
  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    subject: decoded.sub ?? "N/A",
    role: decoded.role ?? "N/A",
    issuedAt: new Date(decoded.iat * 1000),
    expiresAt: new Date(decoded.exp * 1000),
  };
};
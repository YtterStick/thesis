// API configuration for different environments
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  isProduction: import.meta.env.VITE_ENV === 'production',
  timeout: 10000
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // For production, we need to handle the /api context path
  if (API_CONFIG.isProduction && !API_CONFIG.baseURL.includes('/api')) {
    return `${API_CONFIG.baseURL}/api/${cleanEndpoint}`;
  }
  
  return `${API_CONFIG.baseURL}/${cleanEndpoint}`;
};

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();
    const ALLOWED_SKEW_MS = 5000;
    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

// Centralized fetch function with error handling
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const token = getAuthToken();

  // Check token validity for protected endpoints
  if (token && isTokenExpired(token)) {
    console.warn("⛔ Token expired. Redirecting to login.");
    localStorage.removeItem('authToken');
    localStorage.removeItem('dashboardCache');
    window.location.href = "/login";
    throw new Error('Authentication token expired');
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include',
    ...options
  };

  try {
    console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, defaultOptions);
    
    console.log(`📡 Response Status: ${response.status} for ${endpoint}`);
    
    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('dashboardCache');
      window.location.href = "/login";
      throw new Error('Authentication failed');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${endpoint}): ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ API Success (${endpoint}):`, data);
      return data;
    } else {
      console.log(`✅ API Success (${endpoint}): Empty response`);
      return null;
    }
    
  } catch (error) {
    console.error(`🚨 API Fetch Error (${endpoint}):`, error);
    
    // Don't redirect for network errors, only for auth errors
    if (error.message.includes('Authentication')) {
      throw error;
    }
    
    // For network errors, provide user-friendly message
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    
    throw error;
  }
};

// Specialized API functions for common operations
export const api = {
  // GET request
  get: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'GET' }),
  
  // POST request  
  post: (endpoint, data, options = {}) => 
    apiFetch(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  // PUT request
  put: (endpoint, data, options = {}) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  
  // DELETE request
  delete: (endpoint, options = {}) =>
    apiFetch(endpoint, { ...options, method: 'DELETE' }),
  
  // PATCH request
  patch: (endpoint, data, options = {}) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    })
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await fetch(getApiUrl('health'));
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};
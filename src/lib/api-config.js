export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://thesis-1-culv.onrender.com',
  timeout: 10000
};

export const API_BASE_URL = API_CONFIG.baseURL;

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.baseURL}/api/${cleanEndpoint}`;
};

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const isTokenExpired = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();
    const ALLOWED_SKEW_MS = 5000;
    
    // Log only if close to expiration (optional)
    if (exp - now < 300000) { // 5 minutes
      console.log(`🕒 Token expiring in ${Math.round((exp-now)/1000)}s`);
    }

    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

const isPublicEndpoint = (endpoint) => {
  const publicEndpoints = [
    'login',
    'register',
    'health',
    'api/health'
  ];
  return publicEndpoints.some(publicEndpoint => 
    endpoint.includes(publicEndpoint)
  );
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  let token = getAuthToken();
  
  if (isPublicEndpoint(endpoint)) {
    console.log(`🌐 Public API Call: ${options.method || 'GET'} ${url}`);
  } else {
    if (!token) {
      console.warn('🚨 No token found for protected endpoint:', endpoint);
      
      // Try secondary keys
      const backupKeys = ['authToken', 'token', 'auth_token'];
      for (const key of backupKeys) {
        const found = localStorage.getItem(key);
        if (found) {
          console.log(`💡 Token found via backup check (key: ${key}), recovering...`);
          token = found;
          break;
        }
      }

      if (!token) {
        console.error('❌ NO TOKEN FOUND IN ANY KEY. Current LocalStorage keys:', Object.keys(localStorage));
        throw new Error('Authentication required');
      }
    }

    if (isTokenExpired(token)) {
      console.warn('🚨 Token expired. Redirecting to login.');
      // Not removing token automatically to prevent session loss on network errors
      window.location.href = "/login";
      throw new Error('Token expired. Please log in again.');
    }
    console.log(`🌐 Protected API Call: ${options.method || 'GET'} ${url}`);
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

  // Log masked token for debugging (only in development or if specific flag set)
  if (token) {
    const maskedToken = `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;
    console.log(`🔑 Using token: ${maskedToken} for ${endpoint}`);
  }

  try {    
    const response = await fetch(url, defaultOptions);
    
    console.log(`📡 Response Status: ${response.status} for ${endpoint}`);
    
    if (response.status === 403) {
      console.error('❌ Access forbidden - check user role and permissions');
      throw new Error('Access forbidden. You may not have sufficient privileges.');
    }
    
    if (response.status === 401) {
      console.error('❌ Unauthorized - token may be invalid or expired');
      if (!isPublicEndpoint(endpoint)) {
        // Not removing token automatically to prevent session loss on network errors
      }
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${endpoint}): ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ API Success (${endpoint}):`, data);
      return data;
    } else {
      console.log(`✅ API Success (${endpoint}): non-JSON response`);
      return await response.text();
    }
    
  } catch (error) {
    console.error(`🚨 API Fetch Error (${endpoint}):`, error);
    throw error;
  }
};

export const api = {
  get: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, data, options = {}) => 
    apiFetch(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  put: (endpoint, data, options = {}) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  
  delete: (endpoint, options = {}) =>
    apiFetch(endpoint, { ...options, method: 'DELETE' }),
  
  patch: (endpoint, data, options = {}) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    })
};
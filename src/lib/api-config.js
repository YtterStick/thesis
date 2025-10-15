export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://thesis-g0pr.onrender.com',
  timeout: 10000
};

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
  
  const token = getAuthToken();
  
  if (isPublicEndpoint(endpoint)) {
    console.log(`🌐 Public API Call: ${options.method || 'GET'} ${url}`);
  } else {
    if (!token) {
      console.warn('🚨 No token found for protected endpoint');
      throw new Error('Authentication required');
    }

    if (isTokenExpired(token)) {
      console.warn('🚨 Token expired');
      localStorage.removeItem('authToken');
      throw new Error('Token expired. Please log in again.');
    }
    console.log(`🌐 Protected API Call: ${options.method || 'GET'} ${url}`);
    console.log(`🔐 Using token: ${token.substring(0, 20)}...`);
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

  if (options.headers?.Authorization) {
    delete defaultOptions.headers.Authorization;
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
        localStorage.removeItem('authToken');
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
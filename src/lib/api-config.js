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

// Centralized fetch function with error handling
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for CORS with authentication
    ...options
  };

  try {
    console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, defaultOptions);
    
    console.log(`📡 Response Status: ${response.status} for ${endpoint}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${endpoint}): ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success (${endpoint}):`, data);
    return data;
    
  } catch (error) {
    console.error(`🚨 API Fetch Error (${endpoint}):`, error);
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
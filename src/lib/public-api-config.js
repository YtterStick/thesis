export const PUBLIC_API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://thesis-g0pr.onrender.com',
  timeout: 10000
};

export const getPublicApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${PUBLIC_API_CONFIG.baseURL}/api/${cleanEndpoint}`;
};

export const publicApiFetch = async (endpoint, options = {}) => {
  const url = getPublicApiUrl(endpoint);
  
  console.log(`🌐 Public API Call: ${options.method || 'GET'} ${url}`);

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options
  };

  try {    
    const response = await fetch(url, defaultOptions);
    
    console.log(`📡 Response Status: ${response.status} for ${endpoint}`);
    
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

export const publicApi = {
  get: (endpoint, options = {}) => publicApiFetch(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, data, options = {}) => 
    publicApiFetch(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
};
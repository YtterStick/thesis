export const ALLOWED_SKEW_MS = 5000;
export const REQUEST_TIMEOUT = 10000;

export const isTokenExpired = (token) => {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return Date.now() > decoded.exp * 1000 + ALLOWED_SKEW_MS;
    } catch {
        return true;
    }
};

// UPDATED: Show complete contact number without masking
export const maskContact = (contact) => {
    if (!contact) return "—";
    return contact.toString(); // Return the complete number as-is
};

// NEW: Performance monitoring utility
export const withPerformanceLogging = (fn, name) => {
    return async (...args) => {
        const startTime = performance.now();
        console.log(`⚡ ${name} started`);
        
        try {
            const result = await fn(...args);
            const endTime = performance.now();
            console.log(`✅ ${name} completed in ${(endTime - startTime).toFixed(2)}ms`);
            return result;
        } catch (error) {
            const endTime = performance.now();
            console.error(`❌ ${name} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
            throw error;
        }
    };
};

// NEW: Debounce utility for API calls
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const fetchWithTimeout = (url, options = {}, timeout = REQUEST_TIMEOUT) => {
    const controller = new AbortController();
    const { signal } = controller;

    const token = localStorage.getItem("authToken");
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    return fetch(url, {
        ...options,
        signal,
        headers,
    })
        .then((response) => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        })
        .catch((error) => {
            clearTimeout(timeoutId);
            if (error.name === "AbortError") {
                throw new Error("Request timeout");
            }
            throw error;
        });
};
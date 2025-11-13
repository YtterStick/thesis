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
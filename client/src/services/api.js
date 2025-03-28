// client/src/services/api.js
import axios from 'axios';

// --- Configuration ---
// Use environment variables or fallback to defaults
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
const STATIC_FILE_URL = process.env.REACT_APP_STATIC_FILE_URL || 'http://localhost:5001';

// Log the URLs being used (helpful for debugging)
console.log("API Base URL:", API_BASE_URL);
console.log("Static File URL:", STATIC_FILE_URL);


// --- Axios Instance Creation ---
// Create an Axios instance with the base URL.
// We don't set a default Content-Type here, allowing Axios to handle it automatically
// (e.g., application/json for most requests, multipart/form-data when sending FormData).
const api = axios.create({
  baseURL: API_BASE_URL,
});


// --- Request Interceptor ---
// This runs before each request is sent
api.interceptors.request.use(
  (config) => {
    // --- Add JWT Token to Authorization Header ---
    // Retrieve user info (which contains the token) from localStorage
    const userInfoString = localStorage.getItem('userInfo');
    let userInfo = null;
    if (userInfoString) {
        try {
            userInfo = JSON.parse(userInfoString);
        } catch (e) {
            // If parsing fails, log error and remove invalid item
            console.error("Error parsing userInfo from localStorage", e);
            localStorage.removeItem('userInfo');
        }
    }

    // If userInfo and token exist, add the Bearer token to the request headers
    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }

    // --- Request Logging (Optional but useful for debugging) ---
    // Uncomment the block below if you want to see details about outgoing requests
    /*
    console.log(
        `[Axios Request] ${config.method?.toUpperCase()} ${config.url}`,
        {
            headers: config.headers,
            data: config.data, // Be careful logging data, might contain sensitive info
            params: config.params,
        }
    );
    */

    // Continue with the modified request config
    return config;
  },
  (error) => {
    // Handle errors during request setup (e.g., network issues before sending)
    console.error("Axios request interceptor error:", error);
    // Reject the promise so the calling code knows about the error
    return Promise.reject(error);
  }
);


// --- Response Interceptor ---
// This runs when a response is received
api.interceptors.response.use(
  // Function for successful responses (status code 2xx)
  (response) => {
    // Simply return the response for successful requests
    return response;
  },
  // Function for error responses (status code not 2xx)
  (error) => {
    // --- Centralized Error Handling ---
    // Check for specific error statuses or conditions
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`[Axios Response Error ${error.response.status}] URL: ${error.config.url}`, error.response.data);

        // Specific handling for 401 Unauthorized (e.g., token expired/invalid)
        if (error.response.status === 401) {
            console.warn("Unauthorized (401) response. Token might be invalid or expired.");
            // Potential actions: redirect to login, refresh token, clear user state.
            // For now, just logging. Add specific actions here if needed later.
            // Example: localStorage.removeItem('userInfo'); window.location.href = '/login';
        }
        // You could add handling for other statuses like 403 Forbidden, 404 Not Found, 500 Server Error

    } else if (error.request) {
        // The request was made but no response was received (e.g., network error, server down)
        console.error("[Axios Network/Server Error] No response received:", error.message);
        // You might want to show a generic network error message to the user
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[Axios Setup Error]', error.message);
    }

    // Reject the promise with the error object so the calling code can handle it further if needed
    return Promise.reject(error);
  }
);


// --- Helper Function for Static File URLs ---
// Constructs the full URL for accessing static files (like images) served by the backend.
export const getStaticFileUrl = (relativePath) => {
    if (!relativePath) return null; // Return null if no path is provided
    // Ensure there's exactly one slash between the base URL and the relative path
    const separator = relativePath.startsWith('/') ? '' : '/';
    return `${STATIC_FILE_URL}${separator}${relativePath}`;
};


// --- NEW API Function for Deleting Connections ---
/**
 * Sends a DELETE request to remove a specific connection.
 * @param {string} id - The ID of the connection to delete.
 * @returns {Promise} - The Axios promise for the DELETE request.
 */
export const deleteConnection = (id) => api.delete(`/connections/${id}`); // <-- ADDED


// --- Default Export ---
// Export the configured Axios instance as the default export
export default api;
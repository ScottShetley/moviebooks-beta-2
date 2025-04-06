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
const api = axios.create({
  baseURL: API_BASE_URL,
});


// --- Request Interceptor ---
api.interceptors.request.use(
  (config) => {
    // --- Add JWT Token to Authorization Header ---
    const userInfoString = localStorage.getItem('userInfo');
    let userInfo = null;
    if (userInfoString) {
        try {
            userInfo = JSON.parse(userInfoString);
        } catch (e) {
            console.error("Error parsing userInfo from localStorage", e);
            localStorage.removeItem('userInfo');
        }
    }
    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }
    // --- Request Logging (Optional but useful for debugging) ---
    /*
    console.log(`[Axios Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers, data: config.data, params: config.params,
    });
    */
    return config;
  },
  (error) => {
    console.error("Axios request interceptor error:", error);
    return Promise.reject(error);
  }
);


// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response, // Simply return the successful response
  (error) => {
    // --- Centralized Error Handling ---
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`[Axios Response Error ${error.response.status}] URL: ${error.config.url}`, error.response.data);
        if (error.response.status === 401) {
            console.warn("Unauthorized (401) response received. Token might be invalid or expired.");
            // Potentially trigger logout or token refresh here if needed
            // Example: if (!error.config.url.includes('/auth/login')) { /* logout user */ }
        }
        // Optionally reformat error or add more info before rejecting
        // error.message = error.response.data?.message || error.message;
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
        console.error("[Axios Network/Server Error] No response received:", error.message);
        error.message = "Network Error: Could not connect to the server. Please check your connection."; // More user-friendly message
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[Axios Setup Error]', error.message);
    }
    return Promise.reject(error); // Pass the error along
  }
);


// --- Helper Function for Static File URLs ---
export const getStaticFileUrl = (relativePath) => {
    if (!relativePath) return null;
    // Ensure no double slashes if relativePath starts with /
    const path = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return `${STATIC_FILE_URL}/${path}`;
};


// --- Connection API Functions ---

/**
 * Sends a DELETE request to remove a specific connection.
 * @param {string} id - The ID of the connection to delete.
 * @returns {Promise<axios.AxiosResponse<any>>} - The Axios promise for the DELETE request.
 */
export const deleteConnection = (id) => api.delete(`/connections/${id}`);

// --- NEW Function for fetching multiple connections ---
/**
 * Fetches multiple connections by their IDs. Requires authentication.
 * @param {string[]} connectionIds - An array of connection IDs to fetch.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} - Promise resolving to the Axios response containing an array of populated connection objects.
 */
export const getConnectionsByIds = (connectionIds) => {
    if (!Array.isArray(connectionIds)) {
        console.error("[api.getConnectionsByIds] Input must be an array of connection IDs.");
        return Promise.reject(new Error("Invalid input: Expected an array of connection IDs.")); // Return a rejected promise
    }
    // The backend expects the array under the key "connectionIds" in the body
    return api.post('/connections/batch', { connectionIds });
};
// --- END NEW Function ---


// --- Comment API Functions ---

/**
 * Fetches all comments for a specific connection.
 * @param {string} connectionId - The ID of the connection.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} - Promise resolving to the Axios response containing an array of comment objects.
 */
export const getCommentsForConnection = (connectionId) =>
    api.get(`/connections/${connectionId}/comments`);

/**
 * Creates a new comment on a specific connection.
 * @param {string} connectionId - The ID of the connection to comment on.
 * @param {{ text: string }} commentData - An object containing the comment text.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the newly created comment object (populated with user info).
 */
export const createComment = (connectionId, commentData) =>
    api.post(`/connections/${connectionId}/comments`, commentData);


// --- Default Export ---
// Export the configured Axios instance as the default export
export default api;
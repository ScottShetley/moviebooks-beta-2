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
  (response) => response,
  (error) => {
    // --- Centralized Error Handling ---
    if (error.response) {
        console.error(`[Axios Response Error ${error.response.status}] URL: ${error.config.url}`, error.response.data);
        if (error.response.status === 401) {
            console.warn("Unauthorized (401) response. Token might be invalid or expired.");
            // Add specific actions here if needed later (e.g., logout)
            // Example: localStorage.removeItem('userInfo'); window.location.href = '/login';
        }
    } else if (error.request) {
        console.error("[Axios Network/Server Error] No response received:", error.message);
    } else {
        console.error('[Axios Setup Error]', error.message);
    }
    return Promise.reject(error);
  }
);


// --- Helper Function for Static File URLs ---
export const getStaticFileUrl = (relativePath) => {
    if (!relativePath) return null;
    const separator = relativePath.startsWith('/') ? '' : '/';
    return `${STATIC_FILE_URL}${separator}${relativePath}`;
};


// --- Connection API Functions ---

/**
 * Sends a DELETE request to remove a specific connection.
 * @param {string} id - The ID of the connection to delete.
 * @returns {Promise<axios.AxiosResponse<any>>} - The Axios promise for the DELETE request.
 */
export const deleteConnection = (id) => api.delete(`/connections/${id}`);


// --- Comment API Functions --- NEW ---

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
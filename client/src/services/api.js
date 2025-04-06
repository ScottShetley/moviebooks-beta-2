// client/src/services/api.js (Updated getStaticFileUrl)
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
        console.error(`[Axios Response Error ${error.response.status}] URL: ${error.config.url}`, error.response.data);
        if (error.response.status === 401) {
            console.warn("Unauthorized (401) response received. Token might be invalid or expired.");
        }
    } else if (error.request) {
        console.error("[Axios Network/Server Error] No response received:", error.message);
        error.message = "Network Error: Could not connect to the server. Please check your connection.";
    } else {
        console.error('[Axios Setup Error]', error.message);
    }
    return Promise.reject(error);
  }
);


// --- Helper Function for Static File URLs ---
export const getStaticFileUrl = (relativePath) => {
    if (!relativePath) return null;

    // *** ADDED CHECK: If the path is already a full URL (like Cloudinary), return it directly ***
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        // console.log('[getStaticFileUrl] Path is already a full URL:', relativePath);
        return relativePath;
    }

    // --- Original logic (for relative paths like 'uploads/...') ---
    // Ensure no double slashes if relativePath starts with /
    const path = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    // Ensure STATIC_FILE_URL doesn't have a trailing slash if path doesn't start with one
    const baseUrl = STATIC_FILE_URL.endsWith('/') ? STATIC_FILE_URL.slice(0, -1) : STATIC_FILE_URL;
     // Ensure path starts with a slash
    const finalPath = path.startsWith('/') ? path : `/${path}`;

    // console.log('[getStaticFileUrl] Constructing URL from relative path:', `${baseUrl}${finalPath}`);
    return `${baseUrl}${finalPath}`;
};


// --- Connection API Functions ---

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
    return api.post('/connections/batch', { connectionIds });
};

/**
 * Sends a DELETE request to remove a specific connection.
 * @param {string} id - The ID of the connection to delete.
 * @returns {Promise<axios.AxiosResponse<any>>} - The Axios promise for the DELETE request.
 */
export const deleteConnection = (id) => api.delete(`/connections/${id}`);


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


// --- Movie/Book Detail API Functions ---

/**
 * Fetches details for a specific movie by its ID.
 * @param {string} movieId - The ID of the movie.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the movie object.
 */
export const getMovieById = (movieId) => api.get(`/movies/${movieId}`);

/**
 * Fetches all connections associated with a specific movie ID.
 * @param {string} movieId - The ID of the movie.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} - Promise resolving to the Axios response containing an array of populated connection objects.
 */
export const getConnectionsByMovieId = (movieId) => api.get(`/movies/${movieId}/connections`);

/**
 * Fetches details for a specific book by its ID.
 * @param {string} bookId - The ID of the book.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the book object.
 */
export const getBookById = (bookId) => api.get(`/books/${bookId}`);

/**
 * Fetches all connections associated with a specific book ID.
 * @param {string} bookId - The ID of the book.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} - Promise resolving to the Axios response containing an array of populated connection objects.
 */
export const getConnectionsByBookId = (bookId) => api.get(`/books/${bookId}/connections`);


// --- Default Export ---
// Export the configured Axios instance as the default export
export default api;
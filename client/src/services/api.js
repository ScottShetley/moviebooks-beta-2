// client/src/services/api.js
import axios from 'axios';

// --- Configuration ---
// Define the base URL for API requests. Uses environment variable or defaults to localhost.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
// Define the base URL for serving static files (images, etc.). Uses environment variable or defaults.
const STATIC_FILE_URL = process.env.REACT_APP_STATIC_FILE_URL || 'http://localhost:5001';

// --- Axios Instance Creation ---
// Create a new Axios instance with the configured base URL.
// All requests made using this 'api' instance will automatically use this base URL.
const api = axios.create({
  baseURL: API_BASE_URL,
});


// --- Request Interceptor ---
/**
 * Intercepts outgoing requests *before* they are sent.
 * Primarily used here to automatically add the JWT Authorization header
 * if a user token exists in localStorage.
 */
api.interceptors.request.use(
  (config) => {
    // Retrieve stored user info string from localStorage
    const userInfoString = localStorage.getItem('userInfo');
    let userInfo = null;
    // Safely parse the stored JSON string
    if (userInfoString) {
        try {
            userInfo = JSON.parse(userInfoString);
        } catch (e) {
            // If parsing fails (e.g., corrupted data), log error and remove invalid item
            console.error("Error parsing userInfo from localStorage", e);
            localStorage.removeItem('userInfo');
        }
    }
    // If user info exists and contains a token, add the Authorization header
    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }
    // Return the modified config object for the request to proceed
    return config;
  },
  (error) => {
    // Log any errors that occur during the request setup phase
    console.error("Axios request interceptor error:", error);
    // Reject the promise to propagate the error
    return Promise.reject(error);
  }
);


// --- Response Interceptor ---
/**
 * Intercepts incoming responses *after* they are received from the server.
 * Used here for centralized error handling and logging.
 */
api.interceptors.response.use(
  (response) => response, // If response is successful (2xx status), simply pass it through
  (error) => {
    // --- Centralized Error Handling ---
    // Check if the error has a response object (meaning the server responded with a non-2xx status)
    if (error.response) {
        // Log detailed error information including status, URL, and response data
        console.error(`[Axios Response Error ${error.response.status}] URL: ${error.config.url}`, error.response.data);
        // Specific handling for 401 Unauthorized errors
        if (error.response.status === 401) {
            console.warn("Unauthorized (401) response received. Token might be invalid or expired.");
            // TODO: Implement logic to handle unauthorized access.
            // Options:
            // 1. Automatically log the user out (clear localStorage, context state).
            // 2. Redirect the user to the login page.
            // 3. Attempt to refresh the token if using refresh tokens.
            // Example: window.location.href = '/login'; // Simple redirect
        }
    // Check if the error has a request object but no response (network error, server down)
    } else if (error.request) {
        // Log the network error
        console.error("[Axios Network/Server Error] No response received:", error.message);
        // Create a more user-friendly error message for display in the UI
        const enhancedError = new Error("Network Error: Could not connect to the server. Please check your connection or try again later.");
        enhancedError.originalError = error; // Attach original error for debugging if needed
        // Reject the promise with the enhanced, user-friendly error
        return Promise.reject(enhancedError);
    // Handle errors that occur during Axios setup (before the request is even made)
    } else {
        console.error('[Axios Setup Error]', error.message);
    }
    // For all other cases, or if specific handling wasn't done, reject with the original error object
    return Promise.reject(error);
  }
);


// --- Helper Function for Static File URLs ---
/**
 * Constructs the absolute URL for a static file (like an image) based on its relative path.
 * Handles cases where the path might already be absolute or needs the base URL prepended.
 * Ensures correct formatting with slashes.
 * @param {string | null | undefined} relativePath - The relative path from the server's static folder (e.g., 'uploads/images/poster.jpg') or potentially an absolute URL.
 * @returns {string | null} The full absolute URL for the static file, or null if the input path is invalid.
 */
export const getStaticFileUrl = (relativePath) => {
    // Return null if the path is missing or empty
    if (!relativePath) return null;
    // If the path is already an absolute URL, return it directly
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath;
    }
    // Ensure the base URL doesn't have a trailing slash
    const baseUrl = STATIC_FILE_URL.endsWith('/') ? STATIC_FILE_URL.slice(0, -1) : STATIC_FILE_URL;
    // Ensure the relative path starts with a leading slash
    const finalPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    // Combine the base URL and the path
    return `${baseUrl}${finalPath}`;
};


// --- User API Functions ---

/**
 * Fetches the detailed profile of the currently logged-in user. Requires authentication.
 * @returns {Promise<axios.AxiosResponse<object>>} Promise resolving to the Axios response containing the user's profile data.
 */
export const getMyProfile = () => api.get('/users/me');

/**
 * Updates the profile of the currently logged-in user (text fields only). Requires authentication.
 * @param {object} profileData - An object containing fields like { displayName, bio, location }.
 * @returns {Promise<axios.AxiosResponse<object>>} Promise resolving to the Axios response containing the updated user profile data.
 */
export const updateMyProfile = (profileData) => api.put('/users/profile', profileData);
// Note: Profile picture upload uses a separate endpoint/method, likely handled directly in the component using 'api.put' with FormData.

/**
 * Fetches the public profile information for a specific user by their ID. Public access.
 * @param {string} userId - The ID of the user whose profile is being requested.
 * @returns {Promise<axios.AxiosResponse<object>>} Promise resolving to the Axios response containing public profile data.
 */
export const getPublicUserProfile = (userId) => api.get(`/users/${userId}/profile`);

/**
 * Fetches all connections created by a specific user. Public access.
 * @param {string} userId - The ID of the user whose connections are being requested.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} Promise resolving to the Axios response containing an array of connection objects.
 */
export const getUserConnections = (userId) => api.get(`/users/${userId}/connections`);

// --- Connection API Functions ---

/**
 * Fetches a single connection by its ID. Public access.
 * @param {string} connectionId - The ID of the connection to fetch.
 * @returns {Promise<axios.AxiosResponse<object>>} Promise resolving to the Axios response containing the populated connection object.
 */
export const getConnectionById = (connectionId) => api.get(`/connections/${connectionId}`);

/**
 * Fetches multiple connections by their IDs. Requires authentication.
 * @param {string[]} connectionIds - An array of connection IDs to fetch.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} Promise resolving to the Axios response containing an array of populated connection objects.
 * @throws {Error} If the input is not an array.
 */
export const getConnectionsByIds = (connectionIds) => {
    // Input validation
    if (!Array.isArray(connectionIds)) {
        console.error("[api.getConnectionsByIds] Input must be an array of connection IDs.");
        // Reject promise immediately for invalid input
        return Promise.reject(new Error("Invalid input: Expected an array of connection IDs."));
    }
    // Make POST request with the array of IDs in the request body
    return api.post('/connections/batch', { connectionIds });
};

/**
 * Sends a DELETE request to remove a specific connection. Requires authentication.
 * @param {string} id - The ID of the connection to delete.
 * @returns {Promise<axios.AxiosResponse<any>>} The Axios promise for the DELETE request.
 */
export const deleteConnection = (id) => api.delete(`/connections/${id}`);


// --- Comment API Functions ---

/**
 * Fetches all comments for a specific connection. Public access.
 * @param {string} connectionId - The ID of the connection.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} Promise resolving to the Axios response containing an array of comment objects.
 */
export const getCommentsForConnection = (connectionId) =>
    api.get(`/connections/${connectionId}/comments`);

/**
 * Creates a new comment on a specific connection. Requires authentication.
 * @param {string} connectionId - The ID of the connection to comment on.
 * @param {{ text: string }} commentData - An object containing the comment text.
 * @returns {Promise<axios.AxiosResponse<object>>} Promise resolving to the Axios response containing the newly created comment object.
 */
export const createComment = (connectionId, commentData) =>
    api.post(`/connections/${connectionId}/comments`, commentData);


// --- Movie/Book Detail API Functions ---

/**
 * Fetches details for a specific movie by its ID. Public access.
 * @param {string} movieId - The ID of the movie.
 * @returns {Promise<axios.AxiosResponse<object>>} Promise resolving to the Axios response containing the movie object.
 */
export const getMovieById = (movieId) => api.get(`/movies/${movieId}`);

/**
 * Fetches all connections associated with a specific movie ID. Public access.
 * @param {string} movieId - The ID of the movie.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} Promise resolving to the Axios response containing an array of connection objects.
 */
export const getConnectionsByMovieId = (movieId) => api.get(`/movies/${movieId}/connections`);

/**
 * Fetches details for a specific book by its ID. Public access.
 * @param {string} bookId - The ID of the book.
 * @returns {Promise<axios.AxiosResponse<object>>} Promise resolving to the Axios response containing the book object.
 */
export const getBookById = (bookId) => api.get(`/books/${bookId}`);

/**
 * Fetches all connections associated with a specific book ID. Public access.
 * @param {string} bookId - The ID of the book.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} Promise resolving to the Axios response containing an array of connection objects.
 */
export const getConnectionsByBookId = (bookId) => api.get(`/books/${bookId}/connections`);


// --- Default Export ---
// Export the configured Axios instance as the default export.
// This allows importing components to use 'api.get()', 'api.post()', etc. directly.
export default api;

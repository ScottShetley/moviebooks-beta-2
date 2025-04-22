// client/src/services/api.js
import axios from 'axios';

// --- Configuration ---
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
const STATIC_FILE_URL = process.env.REACT_APP_STATIC_FILE_URL || 'http://localhost:5001';

// Log the URLs being used (helpful for debugging)
// console.log("API Base URL:", API_BASE_URL);
// console.log("Static File URL:", STATIC_FILE_URL);


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
            // Optionally: Trigger logout or token refresh logic here
            // Example: might dispatch a logout action or redirect to login
        }
    } else if (error.request) {
        console.error("[Axios Network/Server Error] No response received:", error.message);
        // Enhance error message for user clarity
        const enhancedError = new Error("Network Error: Could not connect to the server. Please check your connection or try again later.");
        enhancedError.originalError = error; // Keep original error if needed
        return Promise.reject(enhancedError); // Reject with the enhanced error
    } else {
        console.error('[Axios Setup Error]', error.message);
    }
    // Reject with the original error for other cases or if specific handling wasn't done
    return Promise.reject(error);
  }
);


// --- Helper Function for Static File URLs ---
export const getStaticFileUrl = (relativePath) => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath;
    }
    const path = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    const baseUrl = STATIC_FILE_URL.endsWith('/') ? STATIC_FILE_URL.slice(0, -1) : STATIC_FILE_URL;
    const finalPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${finalPath}`;
};


// --- User API Functions ---

/**
 * Fetches the detailed profile of the currently logged-in user. Requires authentication.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the user's profile data (including new fields like displayName, bio, etc.).
 */
export const getMyProfile = () => api.get('/users/me');

/**
 * Updates the profile of the currently logged-in user. Requires authentication.
 * @param {object} profileData - An object containing the fields to update (e.g., { displayName, bio, location, profilePictureUrl }). Only include fields you want to change.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the updated user profile data.
 */
export const updateMyProfile = (profileData) => api.put('/users/profile', profileData);

/**
 * Fetches the public profile information for a specific user by their ID. Public access.
 * @param {string} userId - The ID of the user whose profile is being requested.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the public profile data (username, displayName, bio, location, profilePictureUrl, createdAt, _id).
 */
export const getPublicUserProfile = (userId) => api.get(`/users/${userId}/profile`);

/**
 * Fetches all connections created by a specific user. Public access.
 * @param {string} userId - The ID of the user whose connections are being requested.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} - Promise resolving to the Axios response containing an array of connection objects created by the user.
 */
export const getUserConnections = (userId) => api.get(`/users/${userId}/connections`);

// --- Connection API Functions ---

/**
 * Fetches a single connection by its ID. Public access.
 * @param {string} connectionId - The ID of the connection to fetch.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the populated connection object.
 */
export const getConnectionById = (connectionId) => api.get(`/connections/${connectionId}`);

/**
 * Fetches multiple connections by their IDs. Requires authentication.
 * @param {string[]} connectionIds - An array of connection IDs to fetch.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} - Promise resolving to the Axios response containing an array of populated connection objects.
 */
export const getConnectionsByIds = (connectionIds) => {
    if (!Array.isArray(connectionIds)) {
        console.error("[api.getConnectionsByIds] Input must be an array of connection IDs.");
        return Promise.reject(new Error("Invalid input: Expected an array of connection IDs."));
    }
    return api.post('/connections/batch', { connectionIds });
};

/**
 * Sends a DELETE request to remove a specific connection. Requires authentication.
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
 * Creates a new comment on a specific connection. Requires authentication.
 * @param {string} connectionId - The ID of the connection to comment on.
 * @param {string} commentText - The text of the comment.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the newly created comment object (populated with user info).
 */
export const createComment = (connectionId, commentText) =>
    api.post(`/connections/${connectionId}/comments`, { text: commentText });

/**
 * Updates the text of a specific comment. Requires authentication (and must be the author).
 * @param {string} commentId - The ID of the comment to update.
 * @param {string} newText - The new text for the comment.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the updated comment object (populated with user info).
 */
export const updateComment = (commentId, newText) =>
    api.put(`/comments/${commentId}`, { text: newText }); // Use PUT to /api/comments/:commentId with { text: newText } body

/**
 * Deletes a specific comment. Requires authentication (and must be the author).
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<axios.AxiosResponse<any>>} - Promise resolving to the Axios response. (Backend sends { message: 'Comment removed' })
 */
export const deleteComment = (commentId) =>
    api.delete(`/comments/${commentId}`); // Use DELETE to /api/comments/:commentId


// --- Movie/Book Detail API Functions ---

/**
 * Fetches details for a specific movie by its ID. Public access.
 * @param {string} movieId - The ID of the movie.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the movie object.
 */
export const getMovieById = (movieId) => api.get(`/movies/${movieId}`);

/**
 * Fetches all connections associated with a specific movie ID. Public access.
 * @param {string} movieId - The ID of the movie.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} - Promise resolving to the Axios response containing an array of populated connection objects.
 */
export const getConnectionsByMovieId = (movieId) => api.get(`/movies/${movieId}/connections`);

/**
 * Fetches details for a specific book by its ID. Public access.
 * @param {string} bookId - The ID of the book.
 * @returns {Promise<axios.AxiosResponse<object>>} - Promise resolving to the Axios response containing the book object.
 */
export const getBookById = (bookId) => api.get(`/books/${bookId}`);

/**
 * Fetches all connections associated with a specific book ID. Public access.
 * @param {string} bookId - The ID of the book.
 * @returns {Promise<axios.AxiosResponse<Array<object>>>} - Promise resolving to the Axios response containing an array of populated connection objects.
 */
export const getConnectionsByBookId = (bookId) => api.get(`/books/${bookId}/connections`);


// --- Default Export ---
// Export the configured Axios instance as the default export
export default api;

// --- Named Exports (Corrected: Only include exports not defined with export const) ---
// In this case, only the 'api' instance is not exported with 'export const'.
// If you want to export 'api' as a named export *in addition* to default, you can
// add it here. Otherwise, rely on the default export.
// export { api }; // <--- Uncomment this line if you need 'api' as a named import elsewhere
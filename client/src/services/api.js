// client/src/services/api.js

import axios from 'axios';

// --- Configuration ---
// Use environment variables, default to localhost:5001 if not set
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
const STATIC_FILE_URL = process.env.REACT_APP_STATIC_FILE_URL || 'http://localhost:5001';

// console.log("API Base URL:", API_BASE_URL); // Uncomment for debugging
// console.log("Static File URL:", STATIC_FILE_URL); // Uncomment for debugging


// --- Axios Instance Creation ---
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Optional: Add a timeout
});


// --- Request Interceptor ---
// Add JWT Token to Authorization Header
api.interceptors.request.use(
  (config) => {
    const userInfoString = localStorage.getItem('userInfo');
    let userInfo = null;
    if (userInfoString) {
        try {
            userInfo = JSON.parse(userInfoString);
        } catch (e) {
            console.error("Error parsing userInfo from localStorage:", e);
            localStorage.removeItem('userInfo'); // Clear invalid data
        }
    }
    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    } else {
        // If no token, ensure Authorization header is not set to avoid sending 'Bearer null'
        delete config.headers['Authorization'];
    }
    return config;
  },
  (error) => {
    console.error("Axios request interceptor error:", error);
    return Promise.reject(error); // Pass the error through
  }
);


// --- Response Interceptor ---
// Centralized Error Handling and Token Expiry Detection
api.interceptors.response.use(
  (response) => response, // Simply return the successful response
  (error) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`[Axios Response Error ${error.response.status}] URL: ${error.config.url}`, error.response.data);

        // Specific handling for 401 Unauthorized - potential token expiry
        if (error.response.status === 401) {
            console.warn("Unauthorized (401) response received. Token might be invalid or expired. Consider logging out.");
            // This is where you might trigger a logout action in a real app,
            // e.g., by dispatching a context/Redux action
            // Example: store.dispatch(logoutUser());
             // If you have a useAuth hook, you might trigger context update/logout here
        }

    } else if (error.request) {
        // The request was made but no response was received
        console.error("[Axios Network/Server Error] No response received:", error.message, error.config);
         // Enhance error message for user clarity in UI
        const networkError = new Error("Network Error: Could not connect to the server. Please check your connection or try again later.");
        networkError.originalError = error; // Attach original error for debugging
        return Promise.reject(networkError);

    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[Axios Setup Error]', error.message);
    }
    // Reject with the original error (or enhanced network error) for component-specific handling
    return Promise.reject(error);
  }
);


// --- Helper Function for Static File URLs ---
export const getStaticFileUrl = (relativePath) => {
    if (!relativePath) return null;

    // If the path is already a full URL, return it directly
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath;
    }

    // Ensure the static file URL base does not end with a slash
    const baseUrl = STATIC_FILE_URL.endsWith('/') ? STATIC_FILE_URL.slice(0, -1) : STATIC_FILE_URL;

    // Ensure the relative path starts with a slash
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

    // Construct the full URL
    return `${baseUrl}${path}`;
};


// --- User API Functions ---

export const login = (email, password) => api.post('/auth/login', { email, password });
export const signup = (username, email, password) => api.post('/auth/signup', { username, email, password });
// Note: Logout is typically handled client-side by removing the token.
// A backend logout endpoint might be used to invalidate server-side sessions if applicable,
// but with pure JWT and no sessions, client-side removal is sufficient.

export const getMyProfile = () => api.get('/users/me');
// NOTE: updateUserProfile will handle the isPrivate field now as well
// --- FIX: REMOVE hardcoded multipart/form-data header ---
export const updateMyProfile = (profileData) => api.put('/users/profile', profileData);
// --- END FIX ---

export const getPublicUserProfile = (userId) => api.get(`/users/${userId}/profile`);

// --- NEW: Get list of all public users ---
export const getPublicUsers = () => api.get('/users');
// --- END NEW ---

export const getUserConnections = (userId) => api.get(`/users/${userId}/connections`);


// --- Follow API Functions ---
export const followUser = (userId) => api.post(`/follows/${userId}`);
export const unfollowUser = (userId) => api.delete(`/follows/${userId}`);
export const getFollowing = (userId) => api.get(`/follows/following/${userId}`);
export const getFollowers = (userId) => api.get(`/follows/followers/${userId}`);
export const isFollowing = (userId) => api.get(`/follows/is-following/${userId}`);
// --- END Follow API Functions ---


// --- Connection API Functions ---

// Get connections (feed) - supports filters, sorting, pagination
export const getConnections = (params = {}) => api.get('/connections', { params });

// Get a single connection by ID
export const getConnectionById = (connectionId) => api.get(`/connections/${connectionId}`);

// Create a new connection (supports screenshot upload)
export const createConnection = (connectionData) => api.post('/connections', connectionData, {
    headers: {
        'Content-Type': 'multipart/form-data' // Required for file uploads
    }
});

// --- Update a connection ---
export const updateConnection = (connectionId, connectionData) => api.put(`/connections/${connectionId}`, connectionData, {
     headers: {
        'Content-Type': 'multipart/form-data' // Required for file uploads (if screenshot is updated)
     }
});
// --- END Update a connection ---

// Delete a connection
export const deleteConnection = (connectionId) => api.delete(`/connections/${connectionId}`);

// Like/Unlike a connection
export const likeConnection = (connectionId) => api.post(`/connections/${connectionId}/like`);

// Add/Remove connection from user's favorites
export const addFavorite = (connectionId) => api.post(`/connections/${connectionId}/favorite`);
export const removeFavorite = (connectionId) => api.delete(`/connections/${connectionId}/favorite`);

// Get connections by multiple IDs (used for favorites list, notifications, etc.)
export const getConnectionsByIds = (connectionIds) => {
    if (!Array.isArray(connectionIds) || connectionIds.length === 0) {
        // console.warn("[api.getConnectionsByIds] No IDs provided, returning empty array.");
        return Promise.resolve({ data: [] }); // Resolve immediately with empty data
    }
    // Use POST for batch lookup as IDs can be numerous
    return api.post('/connections/batch', { connectionIds });
};

// Get popular tags (for sidebar filter)
export const getPopularTags = () => api.get('/connections/popular-tags');

// Search connections by multiple criteria (movie, book, context, tags, etc.)
export const searchConnections = (params = {}) => api.get('/connections/search', { params });


// --- Movie Endpoints ---
export const getMovieById = (movieId) => api.get(`/movies/${movieId}`);
export const getConnectionsByMovieId = (movieId) => api.get(`/movies/${movieId}/connections`);


// --- Book Endpoints ---
export const getBookById = (bookId) => api.get(`/books/${bookId}`);
export const getConnectionsByBookId = (bookId) => api.get(`/books/${bookId}/connections`);


// --- Comment Endpoints ---
export const getCommentsForConnection = (connectionId) => api.get(`/connections/${connectionId}/comments`);
export const createComment = (connectionId, text) => api.post(`/connections/${connectionId}/comments`, { text });
export const updateComment = (commentId, text) => api.put(`/comments/${commentId}`, { text });
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);


// --- Notification Endpoints ---
export const getNotifications = () => api.get('/notifications');
export const markNotificationAsRead = (notificationIds) => {
     if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        // console.warn("[api.markNotificationAsRead] No IDs provided for marking as read.");
        return Promise.resolve({ data: { message: "No notifications to mark as read." } });
    }
    return api.put('/notifications/mark-read', { notificationIds });
};


// --- Default Export ---
// Export the configured axios instance itself as the default export
export default api;
// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api'; // Use our configured Axios instance

// Create the context to hold authentication state and functions
const AuthContext = createContext();

// Create the provider component that will wrap parts of your app
export const AuthProvider = ({ children }) => {
  // --- State Variables ---
  // Holds user info object { _id, username, email, token, createdAt, favorites } or null if not logged in
  const [user, setUser] = useState(null);
  // Tracks loading state, primarily during initial check and login/signup attempts
  const [loading, setLoading] = useState(true);
  // Holds error messages related to authentication actions
  const [error, setError] = useState(null);

  // --- Effect for Initial Authentication Check ---
  /**
   * Runs once when the AuthProvider mounts.
   * Checks localStorage for previously saved user session information.
   * If valid info (with token) is found, it sets the user state and configures the API header.
   */
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts during async operations
    setLoading(true);
    // console.log('[AuthContext] Checking local storage for user info...'); // Debug log
    try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const userInfo = JSON.parse(storedUserInfo);
            // Ensure 'favorites' array exists, defaulting to empty if missing (for backward compatibility)
            if (!userInfo.favorites) {
                userInfo.favorites = [];
            }
            // Check if component is still mounted and user info seems valid
            if (isMounted && userInfo && userInfo.token) {
                 // console.log('[AuthContext] Found user info in storage, setting user and API header.'); // Debug log
                 setUser(userInfo); // Restore user state
                 // Set the Authorization header for all subsequent API requests
                 api.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;
            } else if (isMounted) {
                // console.log('[AuthContext] Invalid user info found in storage, clearing.'); // Debug log
                localStorage.removeItem('userInfo'); // Clean up invalid stored data
            }
        } else {
            // console.log('[AuthContext] No user info found in storage.'); // Debug log
        }
    } catch(e) {
        // Log error if reading/parsing localStorage fails
        console.error("[AuthContext] Error reading user info from localStorage", e);
        localStorage.removeItem('userInfo'); // Clean up potentially corrupted data
    } finally {
         // Ensure loading state is set to false once the check is complete
         if (isMounted) {
            setLoading(false);
            // console.log('[AuthContext] Initial user check complete.'); // Debug log
         }
    }
    // Cleanup function: Set isMounted to false when the component unmounts
    return () => { isMounted = false; };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // --- Login Function ---
  /**
   * Handles the user login process.
   * Makes an API call to the login endpoint.
   * On success, updates user state, stores info in localStorage, and sets the API header.
   * Returns true on success, false on failure.
   * @param {string} email - User's email.
   * @param {string} password - User's password.
   * @returns {Promise<boolean>} - True if login successful, false otherwise.
   */
  const login = useCallback(async (email, password) => {
    // console.log('[AuthContext] login function initiated.'); // Debug log
    setLoading(true);
    setError(null);
    try {
      // Basic validation
      if (!email || !password) {
         // console.error("[AuthContext] Email or password is empty."); // Debug log
         setError("Please enter both email and password."); setLoading(false); return false;
      }
      // console.log('[AuthContext] Making API call to /auth/login...'); // Debug log
      // Make the API request
      const { data } = await api.post('/auth/login', { email, password });
      // console.log('[AuthContext] API call successful. Response data:', data); // Debug log

      // Ensure data includes favorites (backend should provide it)
      const userData = { ...data, favorites: data.favorites || [] };

      // Store user info in localStorage for session persistence
      localStorage.setItem('userInfo', JSON.stringify(userData));
      // Set the Authorization header for future API calls
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      // Update the user state in the context
      setUser(userData);
      setLoading(false);
      return true; // Indicate success
    } catch (err) {
      // Handle login errors
      const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      console.error("[AuthContext] Login API error:", message, err.response || err); // Keep error log
      setError(message);
      // If unauthorized (e.g., bad token), clear potentially stale auth state
      if (err.response?.status === 401) {
        // console.log('[AuthContext] Clearing auth state due to 401 error.'); // Debug log
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('userInfo');
        setUser(null);
      }
      setLoading(false);
      return false; // Indicate failure
    }
  }, []); // useCallback with empty dependency array as it doesn't depend on component state/props

  // --- Signup Function ---
  /**
   * Handles the user signup process.
   * Makes an API call to the register endpoint.
   * On success, updates user state, stores info in localStorage, and sets the API header.
   * Returns true on success, false on failure.
   * @param {string} username - Chosen username.
   * @param {string} email - User's email.
   * @param {string} password - User's password.
   * @returns {Promise<boolean>} - True if signup successful, false otherwise.
   */
  const signup = useCallback(async (username, email, password) => {
     // console.log('[AuthContext] signup function initiated.'); // Debug log
     setLoading(true);
     setError(null);
     try {
       // Basic validation
       if (!username || !email || !password) {
           // console.error("[AuthContext] Username, email, or password missing for signup."); // Debug log
           setError("Please fill all required fields for signup."); setLoading(false); return false;
       }
       // console.log('[AuthContext] Making API call to /auth/register...'); // Debug log
       // Make the API request
       const { data } = await api.post('/auth/register', { username, email, password });
       // console.log('[AuthContext] Signup API call successful. Response data:', data); // Debug log

       // Ensure data includes favorites (backend should provide it)
       const userData = { ...data, favorites: data.favorites || [] };

       // Store user info in localStorage
       localStorage.setItem('userInfo', JSON.stringify(userData));
       // Set the Authorization header
       api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
       // Update the user state
       setUser(userData);
       setLoading(false);
       return true; // Indicate success
     } catch (err) {
       // Handle signup errors
       const message = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
       console.error("[AuthContext] Signup API error:", message, err.response || err); // Keep error log
       setError(message);
       // Clear potentially stale auth state on signup failure
       delete api.defaults.headers.common['Authorization'];
       localStorage.removeItem('userInfo');
       setUser(null);
       setLoading(false);
       return false; // Indicate failure
     }
  }, []); // useCallback with empty dependency array

  // --- Logout Function ---
  /**
   * Clears the user session: removes info from localStorage, clears the API header,
   * and resets the user state to null.
   */
  const logout = useCallback(() => {
    // console.log('[AuthContext] logout function initiated.'); // Debug log
    localStorage.removeItem('userInfo');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null); // Clear any lingering errors on logout
    // console.log("[AuthContext] User logged out. Cleared state and token."); // Debug log
  }, []); // useCallback with empty dependency array

  // --- Clear Error Function ---
  /**
   * Manually clears any existing error message in the context state.
   */
  const clearError = useCallback(() => {
      if (error) {
        // console.log('[AuthContext] Clearing error state.'); // Debug log
        setError(null);
      }
  }, [error]); // Dependency: Only recreate if 'error' state changes

  // --- Update User Favorites Function ---
  /**
   * Updates the user's favorites list both in the context state and localStorage.
   * Should be called after a successful API call to favorite/unfavorite.
   * Toggles the presence of the connectionId in the user's favorites array.
   * @param {string} connectionId - The ID of the connection to add/remove from favorites.
   */
  const updateUserFavorites = useCallback((connectionId) => {
    // Basic validation
    if (!connectionId) {
        console.warn("[AuthContext] updateUserFavorites called with invalid connectionId");
        return;
    }
    // Use the functional update form of setUser to ensure we have the latest state
    setUser(currentUser => {
        // If for some reason no user is logged in, do nothing
        if (!currentUser) {
            console.warn("[AuthContext] updateUserFavorites called but no user is logged in.");
            return null;
        }

        // Ensure favorites array exists
        const currentFavorites = currentUser.favorites || [];
        let updatedFavorites;
        // Check if the ID is already in the favorites list
        const isCurrentlyFavorite = currentFavorites.includes(connectionId); // .includes is simpler here

        if (isCurrentlyFavorite) {
            // Remove from favorites: Filter out the matching ID
            updatedFavorites = currentFavorites.filter(id => id !== connectionId);
            // console.log(`[AuthContext] Removing favorite: ${connectionId}. New count: ${updatedFavorites.length}`); // Debug log
        } else {
            // Add to favorites: Create a new array with the existing IDs plus the new one
            updatedFavorites = [...currentFavorites, connectionId];
            // console.log(`[AuthContext] Adding favorite: ${connectionId}. New count: ${updatedFavorites.length}`); // Debug log
        }

        // Create the new user object with the updated favorites list
        const updatedUser = { ...currentUser, favorites: updatedFavorites };

        // Update localStorage synchronously with the state update
        try {
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            // console.log("[AuthContext] Updated localStorage with new favorites list."); // Debug log
        } catch (e) {
            // Log error if localStorage update fails
            console.error("[AuthContext] Failed to update localStorage:", e);
            // Consider if you need error handling here, e.g., notifying the user or reverting state
        }

        // Return the updated user object for React to set as the new state
        return updatedUser;
    });
  }, []); // No external dependencies needed due to functional update form

  // --- Context Value ---
  // Define the object that will be provided to consuming components
  const contextValue = {
      user,           // The user object (or null) - includes updated favorites
      loading,        // Boolean loading state
      error,          // Error message string (or null)
      login,          // Login function
      signup,         // Signup function
      logout,         // Logout function
      clearError,     // Function to clear errors
      updateUserFavorites // Function to update favorites list
  };

  // --- Provider Component ---
  // Render the context provider, passing the contextValue
  return (
    <AuthContext.Provider value={contextValue}>
      {children} {/* Render child components */}
    </AuthContext.Provider>
  );
};

// --- Custom Hook for Consuming Context ---
/**
 * A custom hook to simplify accessing the AuthContext value.
 * Includes an error check to ensure it's used within an AuthProvider.
 * @returns {object} The AuthContext value.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Throw an error if the hook is used outside of an AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

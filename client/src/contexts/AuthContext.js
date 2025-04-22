// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api'; // Use our configured Axios instance

// Create the context
const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  // Holds user info { _id, username, email, token, createdAt, favorites } or null
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect to check localStorage for existing user session on initial app load
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    console.log('[AuthContext] Checking local storage for user info...');
    try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const userInfo = JSON.parse(storedUserInfo);
            // --- Ensure favorites array exists, default to empty if missing (for older stored data) ---
            if (!userInfo.favorites) {
                userInfo.favorites = [];
            }
            // --- End favorites check ---
            if (isMounted && userInfo && userInfo.token) {
                 console.log('[AuthContext] Found user info in storage, setting user and API header.');
                 setUser(userInfo); // Store the full user info, including favorites
                 api.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;
            } else if (isMounted) {
                console.log('[AuthContext] Invalid user info found in storage, clearing.');
                localStorage.removeItem('userInfo');
            }
        } else {
            console.log('[AuthContext] No user info found in storage.');
        }
    } catch(e) {
        console.error("[AuthContext] Error reading user info from localStorage", e);
        localStorage.removeItem('userInfo');
    } finally {
         if (isMounted) {
            setLoading(false);
            console.log('[AuthContext] Initial user check complete.');
         }
    }
    return () => { isMounted = false; };
  }, []);

  // --- Login Function ---
  const login = useCallback(async (email, password) => {
    console.log('[AuthContext] login function initiated.');
    setLoading(true);
    setError(null);
    try {
      if (!email || !password) {
         console.error("[AuthContext] Email or password is empty.");
         setError("Please enter both email and password."); setLoading(false); return false;
      }
      console.log('[AuthContext] Making API call to /auth/login...');
      const { data } = await api.post('/auth/login', { email, password });
      console.log('[AuthContext] API call successful. Response data:', data);

      // Ensure data includes favorites (backend should provide it now)
      const userData = { ...data, favorites: data.favorites || [] };

      localStorage.setItem('userInfo', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      setUser(userData); // Set the full user object including favorites
      setLoading(false);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      console.error("[AuthContext] Login API error:", message, err.response || err);
      setError(message);
      if (err.response?.status === 401) {
        console.log('[AuthContext] Clearing auth state due to 401 error.');
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('userInfo');
        setUser(null);
      }
      setLoading(false);
      return false;
    }
  }, []);

  // --- Signup Function ---
  const signup = useCallback(async (username, email, password) => {
     console.log('[AuthContext] signup function initiated.');
     setLoading(true);
     setError(null);
     try {
       if (!username || !email || !password) {
           console.error("[AuthContext] Username, email, or password missing for signup.");
           setError("Please fill all required fields for signup."); setLoading(false); return false;
       }
       console.log('[AuthContext] Making API call to /auth/register...');
       const { data } = await api.post('/auth/register', { username, email, password });
       console.log('[AuthContext] Signup API call successful. Response data:', data);

       // Ensure data includes favorites (backend should provide it now)
       const userData = { ...data, favorites: data.favorites || [] };

       localStorage.setItem('userInfo', JSON.stringify(userData));
       api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
       setUser(userData); // Set the full user object including favorites
       setLoading(false);
       return true;
     } catch (err) {
       const message = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
       console.error("[AuthContext] Signup API error:", message, err.response || err);
       setError(message);
       delete api.defaults.headers.common['Authorization'];
       localStorage.removeItem('userInfo');
       setUser(null);
       setLoading(false);
       return false;
     }
  }, []);

  // --- Logout Function ---
  const logout = useCallback(() => {
    console.log('[AuthContext] logout function initiated.');
    localStorage.removeItem('userInfo');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
    console.log("[AuthContext] User logged out. Cleared state and token.");
  }, []);

  // Function to manually clear errors
  const clearError = useCallback(() => {
      if (error) {
        console.log('[AuthContext] Clearing error state.');
        setError(null);
      }
  }, [error]);

  // --- NEW: Function to update user's favorites list in context and localStorage ---
  // This function should be called AFTER a successful API call to favorite/unfavorite
  const updateUserFavorites = useCallback((connectionId) => {
    if (!connectionId) {
        console.warn("[AuthContext] updateUserFavorites called with invalid connectionId");
        return;
    }
    setUser(currentUser => {
        if (!currentUser) {
            console.warn("[AuthContext] updateUserFavorites called but no user is logged in.");
            return null; // Should not happen if called when logged in
        }

        const currentFavorites = currentUser.favorites || [];
        let updatedFavorites;
        // Check if the ID is already in the favorites list
        const isCurrentlyFavorite = currentFavorites.some(id => id === connectionId); // Use .some for clarity

        if (isCurrentlyFavorite) {
            // Remove from favorites
            updatedFavorites = currentFavorites.filter(id => id !== connectionId);
            console.log(`[AuthContext] Removing favorite: ${connectionId}. New count: ${updatedFavorites.length}`);
        } else {
            // Add to favorites
            updatedFavorites = [...currentFavorites, connectionId];
            console.log(`[AuthContext] Adding favorite: ${connectionId}. New count: ${updatedFavorites.length}`);
        }

        // Create the new user object with updated favorites
        const updatedUser = { ...currentUser, favorites: updatedFavorites };

        // Update localStorage synchronously with the state update
        try {
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            console.log("[AuthContext] Updated localStorage with new favorites list.");
        } catch (e) {
            console.error("[AuthContext] Failed to update localStorage:", e);
            // Decide if you want to revert the state update or just log the error
        }

        // Return the updated user state for React to set
        return updatedUser;
    });
  }, []); // No external dependencies needed as it uses the functional update form of setUser

  // Value provided by the context
  const contextValue = {
      user,
      loading,
      error,
      login,
      signup,
      logout,
      clearError,
      updateUserFavorites,
      // --- ADD isAuthenticated property here ---
      isAuthenticated: user !== null, // Derived directly from user state
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
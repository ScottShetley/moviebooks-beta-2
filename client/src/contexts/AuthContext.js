// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api'; // Use our configured Axios instance

// Create the context
const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  // Holds user info { _id, username, email, token, createdAt } or null
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Tracks initial loading and auth operations
  const [error, setError] = useState(null); // Holds login/signup error messages

  // Effect to check localStorage for existing user session on initial app load
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    console.log('[AuthContext] Checking local storage for user info...');
    try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const userInfo = JSON.parse(storedUserInfo);
            if (isMounted && userInfo && userInfo.token) {
                 console.log('[AuthContext] Found user info in storage, setting user and API header.');
                 setUser(userInfo);
                 api.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;
            } else if (isMounted) {
                console.log('[AuthContext] Invalid user info found in storage, clearing.');
                localStorage.removeItem('userInfo'); // Clear invalid stored info
            }
        } else {
            console.log('[AuthContext] No user info found in storage.');
        }
    } catch(e) {
        console.error("[AuthContext] Error reading user info from localStorage", e);
        localStorage.removeItem('userInfo'); // Clear potentially corrupted data
    } finally {
         if (isMounted) {
            setLoading(false); // Finished initial check
            console.log('[AuthContext] Initial user check complete.');
         }
    }
    return () => { isMounted = false; };
  }, []); // Runs only once on mount

  // --- Login Function ---
  const login = useCallback(async (email, password) => {
    console.log('[AuthContext] login function initiated.'); // <-- ADDED LOG
    setLoading(true);
    setError(null);
    try {
      // Check if email or password are empty strings before sending
      if (!email || !password) {
         console.error("[AuthContext] Email or password is empty.");
         setError("Please enter both email and password.");
         setLoading(false);
         return false; // Prevent API call if fields are empty
      }

      console.log('[AuthContext] Making API call to /auth/login...'); // <-- ADDED LOG
      const { data } = await api.post('/auth/login', { email, password });
      console.log('[AuthContext] API call successful. Response data:', data); // <-- ADDED LOG

      // Backend now returns username, _id, email, token, createdAt
      localStorage.setItem('userInfo', JSON.stringify(data));
      // Set default auth header for subsequent requests in this session
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data); // User state now includes username
      setLoading(false);
      return true; // Indicate success
    } catch (err) {
      // Extract message more reliably
      const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      // Enhanced Error Logging
      console.error("[AuthContext] Login API error:", message, err.response || err); // <-- ENHANCED ERROR LOG
      setError(message);

      // Clear invalid token/user info if login fails due to auth issue
      if (err.response?.status === 401) {
        console.log('[AuthContext] Clearing auth state due to 401 error.');
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('userInfo');
        setUser(null);
      }
      setLoading(false);
      return false; // Indicate failure
    }
  }, []); // useCallback dependency array is empty, function is stable

  // --- Signup Function ---
  const signup = useCallback(async (username, email, password) => {
     console.log('[AuthContext] signup function initiated.');
     setLoading(true);
     setError(null);
     try {
       // Basic check
       if (!username || !email || !password) {
           console.error("[AuthContext] Username, email, or password missing for signup.");
           setError("Please fill all required fields for signup.");
           setLoading(false);
           return false;
       }
       console.log('[AuthContext] Making API call to /auth/register...');
       const { data } = await api.post('/auth/register', { username, email, password });
       console.log('[AuthContext] Signup API call successful. Response data:', data);

       localStorage.setItem('userInfo', JSON.stringify(data));
       api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
       setUser(data);
       setLoading(false);
       return true; // Indicate success
     } catch (err) {
       const message = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
       console.error("[AuthContext] Signup API error:", message, err.response || err);
       setError(message);

       // Ensure no stale auth state if signup fails
       delete api.defaults.headers.common['Authorization'];
       localStorage.removeItem('userInfo');
       setUser(null);
       setLoading(false);
       return false; // Indicate failure
     }
  }, []); // useCallback dependency array is empty, function is stable

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
      if (error) { // Only log if there was an error to clear
        console.log('[AuthContext] Clearing error state.');
        setError(null);
      }
  }, [error]); // Depend on error state

  // Value provided by the context
  const contextValue = {
      user,           // Current user object { _id, username, email, token, createdAt } or null
      loading,        // Boolean indicating if an auth operation is in progress
      error,          // String containing the last auth error message, or null
      login,          // Async function (email, password) => Promise<boolean>
      signup,         // Async function (username, email, password) => Promise<boolean>
      logout,         // Function () => void
      clearError      // Function () => void
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Render children only after initial loading check is complete? Optional, depends on UX needs */}
      {/* {loading ? <p>Loading application...</p> : children} */}
      {/* Or just always render children: */}
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
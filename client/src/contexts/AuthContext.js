// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api'; // Use our configured Axios instance

// Create the context
const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  // Holds user info { _id, username, email, token, createdAt } or null
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Tracks initial loading state
  const [error, setError] = useState(null); // Holds login/signup error messages

  // Effect to check localStorage for existing user session on initial app load
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const userInfo = JSON.parse(storedUserInfo);
            // Now that username is essential, maybe verify its presence?
            // For now, just load whatever is stored. API calls will fail if token is bad.
            if (isMounted && userInfo && userInfo.token) { // Basic check for token existence
                 setUser(userInfo);
                 // Set the default auth header for subsequent API calls on reload
                 api.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;
            } else if (isMounted) {
                localStorage.removeItem('userInfo'); // Clear invalid stored info
            }
        }
    } catch(e) {
        console.error("Error reading user info from localStorage", e);
        localStorage.removeItem('userInfo'); // Clear potentially corrupted data
    } finally {
         if (isMounted) {
            setLoading(false); // Finished initial check
         }
    }
    return () => { isMounted = false; };
  }, []); // Runs only once on mount

  // --- Login Function ---
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      // Backend now returns username, _id, email, token, createdAt
      localStorage.setItem('userInfo', JSON.stringify(data));
      // Set default auth header for subsequent requests in this session
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data); // User state now includes username
      setLoading(false);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      console.error("Login error:", message);
      setError(message);
      // Clear invalid token if login fails due to auth issue
      if (err.response?.status === 401) {
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('userInfo');
        setUser(null);
      }
      setLoading(false);
      return false;
    }
  }, []);

  // --- Signup Function (MODIFIED) ---
  const signup = useCallback(async (username, email, password) => { // <-- Added username parameter
     setLoading(true);
     setError(null);
     try {
       // --- MODIFICATION START: Send username to API ---
       const { data } = await api.post('/auth/register', { username, email, password });
       // --- MODIFICATION END: Send username to API ---

       // Backend now returns username, _id, email, token, createdAt
       localStorage.setItem('userInfo', JSON.stringify(data));
        // Set default auth header for subsequent requests in this session
       api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
       setUser(data); // User state now includes username
       setLoading(false);
       return true;
     } catch (err) {
       const message = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
       console.error("Signup error:", message);
       setError(message);
       // Ensure no stale auth state if signup fails
       delete api.defaults.headers.common['Authorization'];
       localStorage.removeItem('userInfo');
       setUser(null);
       setLoading(false);
       return false;
     }
  }, []); // useCallback dependency array is empty, function is stable

  // --- Logout Function ---
  const logout = useCallback(() => {
    localStorage.removeItem('userInfo');
    // Remove default auth header on logout
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
    console.log("User logged out.");
    // Navigation should be handled by the component calling logout (e.g., Header)
  }, []);

  // Function to manually clear errors
  const clearError = useCallback(() => {
      setError(null);
  }, []);

  // Value provided by the context
  const contextValue = {
      user,           // Current user object { _id, username, email, token, createdAt } or null
      loading,
      error,
      login,
      signup,         // Updated signup function
      logout,
      clearError
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
// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api'; // Use our configured Axios instance

// Create the context
const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Holds user info { _id, email, token, createdAt } or null
  const [loading, setLoading] = useState(true); // Tracks initial loading state (checking localStorage)
  const [error, setError] = useState(null); // Holds login/signup error messages

  // Effect to check localStorage for existing user session on initial app load
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts quickly
    setLoading(true);
    try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const userInfo = JSON.parse(storedUserInfo);
            // Optional: Add token expiry check here if needed, though API calls will fail anyway
            if (isMounted) {
                 setUser(userInfo);
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
    return () => { isMounted = false; }; // Cleanup function on unmount
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Login Function ---
  const login = useCallback(async (email, password) => {
    setLoading(true); // Indicate loading state
    setError(null); // Clear previous errors
    try {
      // Make API request to login endpoint
      const { data } = await api.post('/auth/login', { email, password });
      // Save user info (including token) to localStorage
      localStorage.setItem('userInfo', JSON.stringify(data));
      // Update user state
      setUser(data);
      setLoading(false);
      return true; // Indicate success
    } catch (err) {
      // Extract error message from API response or use default
      const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      console.error("Login error:", message);
      setError(message); // Set error state
      setLoading(false);
      return false; // Indicate failure
    }
  }, []); // useCallback to memoize the function

  // --- Signup Function ---
  const signup = useCallback(async (email, password) => {
     setLoading(true);
     setError(null);
     try {
       // Make API request to register endpoint
       const { data } = await api.post('/auth/register', { email, password });
       // Save new user info to localStorage
       localStorage.setItem('userInfo', JSON.stringify(data));
       // Update user state
       setUser(data);
       setLoading(false);
       return true; // Indicate success
     } catch (err) {
       const message = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
       console.error("Signup error:", message);
       setError(message);
       setLoading(false);
       return false; // Indicate failure
     }
  }, []); // useCallback

  // --- Logout Function ---
  const logout = useCallback(() => {
    // Remove user info from localStorage
    localStorage.removeItem('userInfo');
    // Clear user state
    setUser(null);
    // Clear any lingering errors
    setError(null);
    // Note: Navigation/redirect after logout should be handled in the component calling logout
    console.log("User logged out.");
  }, []); // useCallback

  // Function to manually clear errors (e.g., when user dismisses an error message)
  const clearError = useCallback(() => {
      setError(null);
  }, []);

  // Value provided by the context
  const contextValue = {
      user,           // Current user object or null
      loading,        // Boolean indicating auth state loading
      error,          // String containing last auth error message or null
      login,          // Function to log in
      signup,         // Function to sign up
      logout,         // Function to log out
      clearError      // Function to clear error message
  };

  return (
    // Provide the context value to children components
    // Only render children once initial loading (localStorage check) is complete
    <AuthContext.Provider value={contextValue}>
      {/* Removed !loading check here - App.js can handle its own loading state if needed */}
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext in components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
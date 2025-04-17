// client/src/pages/LoginPage.js
import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
// Import the form component that handles the actual login logic
import LoginForm from '../components/Auth/LoginForm';
// Import the custom hook to access authentication state
import { useAuth } from '../contexts/AuthContext';
// Optional: Import page-specific styles if you create them
// import styles from './AuthPage.module.css';

/**
 * Renders the Login page.
 * Displays the LoginForm component and redirects authenticated users away.
 */
const LoginPage = () => {
  // --- Hooks ---
  // Get the current user object from the AuthContext
  const { user, loading: authLoading } = useAuth(); // Also get authLoading
  // Get location information, used to determine where to redirect after login (handled in LoginForm)
  // or where to redirect *from* if the user is already logged in.
  const location = useLocation();

  // --- Redirect Logic ---
  // Show loading indicator during initial auth check to prevent flicker
  if (authLoading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            Loading...
        </div>
    );
  }

  // If the initial auth check is done and the user IS logged in, redirect them.
  if (user) {
    // Determine the target path:
    // 1. Use the 'from' state passed during redirection (e.g., from a protected route).
    // 2. Default to the homepage ('/') if no 'from' state exists.
    const from = location.state?.from?.pathname || "/";
    // Use the Navigate component to perform the redirection.
    // 'replace' ensures the login page isn't added to the browser history.
    return <Navigate to={from} replace />;
  }

  // --- Render Logic ---
  // If not loading and not logged in, render the login form and signup link.
  return (
    // Main container div for the login page content.
    // Using inline styles here; consider using a CSS module (e.g., AuthPage.module.css)
    // for consistency with other pages and better style management.
    <div style={{ maxWidth: '450px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Render the LoginForm component */}
      <LoginForm />
      {/* Link to the Signup page */}
      <p style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default LoginPage;

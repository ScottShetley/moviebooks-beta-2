// client/src/pages/SignupPage/SignupPage.js
import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
// Import the form component that handles the actual signup logic
import SignupForm from '../components/Auth/SignupForm';
// Import the custom hook to access authentication state
import { useAuth } from '../contexts/AuthContext';
// Optional: Import page-specific styles if you have them
// import styles from './AuthPage.module.css';

/**
 * Renders the Signup page.
 * Displays the SignupForm component and redirects authenticated users away.
 */
const SignupPage = () => {
  // --- Hooks ---
  // Get user state and auth loading status from AuthContext
  const { user, loading: authLoading } = useAuth();
  // Get location information, used to determine where to redirect *from* if the user is already logged in.
  const location = useLocation();

  // --- Redirect Logic ---
  // Show a simple loading indicator during the initial authentication check
  // to prevent the signup form from briefly flashing for logged-in users.
  if (authLoading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            Loading...
        </div>
    );
  }

  // If the initial auth check is complete and the user IS logged in, redirect them.
  if (user) {
    // Determine the target path:
    // 1. Use the 'from' state passed during redirection (e.g., from a protected route).
    // 2. Default to the homepage ('/') if no 'from' state exists.
    const from = location.state?.from?.pathname || "/";
    // console.log(`User already logged in, redirecting from SignupPage to: ${from}`); // Debug log removed
    // Use the Navigate component to perform the redirection.
    // 'replace' ensures the signup page isn't added to the browser history.
    return <Navigate to={from} replace />;
  }

  // --- Render Logic ---
  // If not loading and not logged in, render the signup form and login link.
  return (
    // Main container div for the signup page content.
    // Using inline styles here; consider using a CSS module (e.g., AuthPage.module.css)
    // for consistency with other pages and better style management.
    <div /* className={styles.authPageContainer} */ style={{ maxWidth: '450px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Render the SignupForm component */}
      <SignupForm />
      {/* Link to the Login page */}
      <p style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
};

export default SignupPage;

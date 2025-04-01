// client/src/pages/SignupPage/SignupPage.js
import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
// CORRECT - Stays within src/
import SignupForm from '../components/Auth/SignupForm'; // Changed from ../../ to ../
import { useAuth } from '../contexts/AuthContext';      // Changed from ../../ to ../
// Optional: Import page-specific styles if you have them
// import styles from './AuthPage.module.css';

const SignupPage = () => {
  const { user, loading: authLoading } = useAuth(); // Use authLoading from context
  const location = useLocation();

  // Don't redirect during initial auth check
  if (authLoading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            Loading...
        </div>
    );
  }

  // If user is already logged in AFTER initial check, redirect them away
  if (user) {
    // Redirect to the page they came from, or default to homepage
    const from = location.state?.from?.pathname || "/";
    console.log(`User already logged in, redirecting from SignupPage to: ${from}`);
    return <Navigate to={from} replace />;
  }

  // If not loading and not logged in, show the signup form
  return (
    // Optional: Add a container class if needed for styling
    <div /* className={styles.authPageContainer} */ style={{ maxWidth: '450px', margin: '2rem auto', padding: '0 1rem' }}>
      <SignupForm />
      <p style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
};

export default SignupPage;
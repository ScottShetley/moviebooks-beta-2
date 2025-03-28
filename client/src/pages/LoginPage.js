// client/src/pages/LoginPage.js
import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import LoginForm from '../components/Auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

// Optional: Add page-specific styles if needed
// import styles from './AuthPage.module.css';

const LoginPage = () => {
  const { user } = useAuth(); // Get user state to redirect if already logged in
  const location = useLocation(); // Get location to potentially redirect back after login

  // If user is already logged in, redirect them away from login page
  if (user) {
    // Redirect to the page they came from, or default to homepage
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return (
    <div /* className={styles.authPageContainer} */ >
      <LoginForm />
      <p style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default LoginPage;
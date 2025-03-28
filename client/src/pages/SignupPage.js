// client/src/pages/SignupPage.js
import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import SignupForm from '../components/Auth/SignupForm';
import { useAuth } from '../contexts/AuthContext';

// Optional: Add page-specific styles if needed
// import styles from './AuthPage.module.css';

const SignupPage = () => {
  const { user } = useAuth(); // Check if user is already logged in
  const location = useLocation();

  // Redirect if already logged in
  if (user) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return (
    <div /* className={styles.authPageContainer} */ >
      <SignupForm />
      <p style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default SignupPage;
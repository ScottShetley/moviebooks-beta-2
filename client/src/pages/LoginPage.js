// client/src/pages/LoginPage.js
import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import LoginForm from '../components/Auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return (
    // Add the style attribute here
    <div style={{ maxWidth: '450px', margin: '2rem auto', padding: '0 1rem' }}>
      <LoginForm />
      <p style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default LoginPage;
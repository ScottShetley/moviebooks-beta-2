// client/src/components/Auth/LoginForm.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../Common/Input/Input';
import Button from '../Common/Button/Button';
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import styles from './AuthForm.module.css'; // Import the CSS module

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[LoginForm] handleSubmit triggered.'); // <-- ADD LOG 1
    clearError();
    console.log('[LoginForm] Attempting login with:', email); // <-- ADD LOG 2

    try {
        const success = await login(email, password); // Call the login function from context
        console.log('[LoginForm] login function returned:', success); // <-- ADD LOG 3

        if (success) {
          const from = location.state?.from?.pathname || "/";
          console.log(`[LoginForm] Login successful, navigating to: ${from}`); // <-- EXISTING LOG (modified slightly)
          navigate(from, { replace: true });
        } else {
          // Error should be handled by AuthContext setting the error state
          console.log('[LoginForm] Login function returned false (error likely set in context).'); // <-- ADD LOG 4
        }
    } catch (err) {
        // This catch block might not even be necessary if login() handles its own errors
        console.error('[LoginForm] Unexpected error during handleSubmit:', err); // <-- ADD LOG 5
        // Display a generic error? Or rely on AuthContext's error?
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    // Add noValidate to the form tag
    <form onSubmit={handleSubmit} noValidate> {/* <<<<<<<<<<<<<<< ADD noValidate HERE */}
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>Login</h2>
      <ErrorMessage message={authError} />

      <Input
        label="Email Address"
        type="email"
        id="login-email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        placeholder="you@example.com"
        disabled={loading}
      />

      <div className={styles.passwordWrapper}>
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={loading}
          inputClassName={styles.passwordInputWithIcon}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
        </button>
      </div>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%' }}
        >
          {loading ? <LoadingSpinner size="small" inline /> : 'Login'}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
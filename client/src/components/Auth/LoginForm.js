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
    clearError();
    const success = await login(email, password);
    if (success) {
      const from = location.state?.from?.pathname || "/";
      console.log(`Login successful, navigating to: ${from}`);
      navigate(from, { replace: true });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit}>
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

      {/* Wrap Input and Toggle Button */}
      {/* The Input component itself now handles margin-bottom via .inputGroup */}
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
          // --- MODIFICATION: Pass specific class to Input component ---
          inputClassName={styles.passwordInputWithIcon}
          // --- END MODIFICATION ---
        />
        {/* Toggle Button - positioning adjusted in CSS */}
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
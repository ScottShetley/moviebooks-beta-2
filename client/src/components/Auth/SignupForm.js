// client/src/components/Auth/SignupForm.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../Common/Input/Input';
import Button from '../Common/Button/Button';
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import styles from './AuthForm.module.css'; // Import the CSS module

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const { signup, loading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
    }

    const success = await signup(email, password);

    if (success) {
      const from = location.state?.from?.pathname || "/";
      console.log(`Signup successful, navigating to: ${from}`);
      navigate(from, { replace: true });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>Sign Up</h2>
      <ErrorMessage message={localError || authError} />

      <Input
        label="Email Address"
        type="email"
        id="signup-email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        placeholder="you@example.com"
        disabled={loading}
      />

      {/* Password Field */}
      <div className={styles.passwordWrapper}>
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="signup-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Create a password (min. 6 characters)"
          disabled={loading}
          // --- MODIFICATION: Pass specific class to Input component ---
          inputClassName={styles.passwordInputWithIcon}
          // --- END MODIFICATION ---
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

      {/* Confirm Password Field */}
      <div className={styles.passwordWrapper}>
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          id="signup-confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Re-enter your password"
          disabled={loading}
           // --- MODIFICATION: Pass specific class to Input component ---
           inputClassName={styles.passwordInputWithIcon}
           // --- END MODIFICATION ---
        />
         <button
          type="button"
          className={styles.passwordToggle}
          onClick={toggleConfirmPasswordVisibility}
          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          title={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
        </button>
      </div>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%' }}
        >
          {loading ? <LoadingSpinner size="small" inline /> : 'Sign Up'}
        </Button>
      </div>
    </form>
  );
};

export default SignupForm;
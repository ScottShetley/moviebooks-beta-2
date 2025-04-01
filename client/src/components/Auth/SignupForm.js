// client/src/components/Auth/SignupForm.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../Common/Input/Input';
import Button from '../Common/Button/Button';
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import styles from './AuthForm.module.css';

const SignupForm = () => {
  // --- MODIFICATION START: Add username state ---
  const [username, setUsername] = useState('');
  // --- MODIFICATION END: Add username state ---
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
    clearError(); // Clear context error
    setLocalError(''); // Clear local error

    // --- MODIFICATION START: Basic frontend validation ---
    if (!username || !email || !password || !confirmPassword) {
        setLocalError('Please fill in all fields.');
        return;
    }
    if (username.length < 3 || username.length > 20) {
        setLocalError('Username must be between 3 and 20 characters.');
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
       setLocalError('Username can only contain letters, numbers, and underscores.');
       return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
    }
    // Basic email check (optional, backend validates more thoroughly)
    if (!/.+@.+\..+/.test(email)) {
        setLocalError('Please enter a valid email address.');
        return;
    }
    // --- MODIFICATION END: Basic frontend validation ---


    // --- MODIFICATION START: Call signup with username ---
    const success = await signup(username, email, password);
    // --- MODIFICATION END: Call signup with username ---

    if (success) {
      // User state in AuthContext now includes username
      // Backend login/signup response now includes username
      const from = location.state?.from?.pathname || "/";
      console.log(`Signup successful for ${username}, navigating to: ${from}`);
      navigate(from, { replace: true });
    }
    // If signup fails, authError state in useAuth() will be set
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <form onSubmit={handleSubmit} noValidate> {/* Add noValidate to rely on our checks */}
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>Sign Up</h2>
      {/* Display local errors first, then context errors */}
      <ErrorMessage message={localError || authError} />

      {/* --- MODIFICATION START: Add Username Input --- */}
      <Input
        label="Username"
        type="text"
        id="signup-username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        minLength={3}
        maxLength={20}
        pattern="^[a-zA-Z0-9_]+$" // Corresponds to backend regex
        title="Username can only contain letters, numbers, and underscores (3-20 characters)."
        autoComplete="username"
        placeholder="Choose a public username"
        disabled={loading}
      />
      {/* --- MODIFICATION END: Add Username Input --- */}


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
          inputClassName={styles.passwordInputWithIcon}
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
// client/src/components/Auth/SignupForm.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { useAuth } from '../../contexts/AuthContext';
import Input from '../Common/Input/Input';
import Button from '../Common/Button/Button';
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner';

// Optional: Define common styles for auth forms if needed
// import styles from './AuthForm.module.css';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(''); // For client-side validation errors (e.g., password mismatch)
  const { signup, loading, error: authError, clearError } = useAuth(); // Rename context error to avoid clash
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError(); // Clear errors from previous attempts (from context)
    setLocalError(''); // Clear local errors from previous attempts

    // --- Client-side validation ---
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return; // Stop submission
    }
    if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return; // Stop submission
    }
    // Add more client-side validation here if needed (e.g., email format)
    // Although the backend and Input type='email' provide some validation

    // Call the signup function from AuthContext
    const success = await signup(email, password);

    if (success) {
      // Redirect after successful signup
       const from = location.state?.from?.pathname || "/"; // Default to homepage
      console.log(`Signup successful, navigating to: ${from}`);
      navigate(from, { replace: true });
    }
    // If signup fails on the backend, the authError state will be set
    // and displayed by the ErrorMessage component below.
  };

  return (
    // Optionally add className={styles.authForm}
    <form onSubmit={handleSubmit}>
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>Sign Up</h2>

      {/* Display API errors from context OR local validation errors */}
      {/* Prioritize local errors if they exist */}
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
        // Pass the specific error related to this field if needed later
        // error={fieldErrors?.email}
      />
      <Input
        label="Password"
        type="password"
        id="signup-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6} // HTML5 validation (also checked in handleSubmit)
        autoComplete="new-password" // Browser hint
        placeholder="Create a password (min. 6 characters)"
        disabled={loading}
         // Pass the specific error related to this field if needed later
        // error={fieldErrors?.password}
      />
       <Input
        label="Confirm Password"
        type="password"
        id="signup-confirm-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        placeholder="Re-enter your password"
        disabled={loading}
         // Pass the specific error related to this field if needed later
        // error={fieldErrors?.confirmPassword || localError} // Show mismatch here too?
      />
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
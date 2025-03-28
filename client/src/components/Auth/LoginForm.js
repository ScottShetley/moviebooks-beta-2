// client/src/components/Auth/LoginForm.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { useAuth } from '../../contexts/AuthContext'; // Use the auth context
import Input from '../Common/Input/Input'; // Use our Input component
import Button from '../Common/Button/Button'; // Use our Button component
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage'; // Use ErrorMessage component
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner'; // Show loading state

// Optional: Define common styles for auth forms if needed
// import styles from './AuthForm.module.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error: authError, clearError } = useAuth(); // Get functions/state from context, rename error
  const navigate = useNavigate(); // Hook for navigation
  const location = useLocation(); // Hook to get current location (for redirect)

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission which causes page reload
    clearError(); // Clear previous context errors before attempting login

    // Call the login function provided by AuthContext
    const success = await login(email, password);

    if (success) {
      // Determine where to redirect after successful login
      // If redirected *to* login (e.g., from a protected route), 'location.state.from' might exist
      const from = location.state?.from?.pathname || "/"; // Default to homepage
      console.log(`Login successful, navigating to: ${from}`);
      navigate(from, { replace: true }); // Use replace to avoid login page in history
    }
    // If login fails, the authError state in the context will be set,
    // and the ErrorMessage component below will display it.
  };

  return (
    // Optionally add className={styles.authForm} for common styling
    <form onSubmit={handleSubmit}>
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>Login</h2>

      {/* Display login error message from AuthContext */}
      <ErrorMessage message={authError} />

      <Input
        label="Email Address"
        type="email"
        id="login-email" // Unique ID for the input
        value={email} // Controlled component value
        onChange={(e) => setEmail(e.target.value)} // Update state on change
        required // HTML5 validation
        autoComplete="email" // Browser hint for autofill
        placeholder="you@example.com"
        disabled={loading} // Disable input while loading
      />
      <Input
        label="Password"
        type="password"
        id="login-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password" // Browser hint for autofill
        placeholder="Enter your password"
        disabled={loading}
      />
      <div style={{ marginTop: 'var(--space-lg)' }}> {/* Add space before button */}
        <Button
            type="submit"
            variant="primary"
            disabled={loading} // Disable button while loading
            style={{ width: '100%' }} // Make button full width
        >
          {/* Show spinner inside button when loading */}
          {loading ? <LoadingSpinner size="small" inline /> : 'Login'}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
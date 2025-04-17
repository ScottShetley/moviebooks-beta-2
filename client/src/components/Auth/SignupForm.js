// client/src/components/Auth/SignupForm.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Import custom context hook for authentication
import { useAuth } from '../../contexts/AuthContext';

// Import reusable UI components
import Input from '../Common/Input/Input';
import Button from '../Common/Button/Button';
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner';

// Import icons for password visibility
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

// Import component-specific styles
import styles from './AuthForm.module.css';

// Define the SignupForm functional component
const SignupForm = () => {
  // --- State Variables ---
  // Store the value of the username input field
  const [username, setUsername] = useState('');
  // Store the value of the email input field
  const [email, setEmail] = useState('');
  // Store the value of the password input field
  const [password, setPassword] = useState('');
  // Store the value of the confirm password input field
  const [confirmPassword, setConfirmPassword] = useState('');
  // Track visibility state for the password field
  const [showPassword, setShowPassword] = useState(false);
  // Track visibility state for the confirm password field
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Store local validation errors (e.g., passwords don't match)
  const [localError, setLocalError] = useState('');

  // --- Hooks ---
  // Get signup function, loading state, context error, and clearError from AuthContext
  const { signup, loading, error: authError, clearError } = useAuth();
  // Get navigation function from React Router
  const navigate = useNavigate();
  // Get location information for potential redirects after signup
  const location = useLocation();

  // --- Event Handlers ---

  /**
   * Handles the form submission for user signup.
   * Performs frontend validation, calls the signup function, and navigates on success.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event object.
   */
  const handleSubmit = async (e) => {
    // Prevent default browser form submission (page reload)
    e.preventDefault();
    // Clear errors from previous attempts
    clearError(); // Clear error state from AuthContext
    setLocalError(''); // Clear local error state within this component

    // --- Frontend Validation Checks ---
    // Check if all fields are filled
    if (!username || !email || !password || !confirmPassword) {
        setLocalError('Please fill in all fields.');
        return; // Stop submission if validation fails
    }
    // Check username length
    if (username.length < 3 || username.length > 20) {
        setLocalError('Username must be between 3 and 20 characters.');
        return;
    }
    // Check username allowed characters (matches backend validation)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
       setLocalError('Username can only contain letters, numbers, and underscores.');
       return;
    }
    // Check if passwords match
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    // Check password minimum length
    if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
    }
    // Basic check for email format (more thorough validation happens on the backend)
    if (!/.+@.+\..+/.test(email)) {
        setLocalError('Please enter a valid email address.');
        return;
    }
    // --- End Frontend Validation ---

    // If validation passes, attempt signup via the AuthContext function
    const success = await signup(username, email, password);

    // Check if signup was successful (returned true from the context function)
    if (success) {
      // Determine redirect path (previous page or homepage)
      const from = location.state?.from?.pathname || "/";
      // Navigate to the determined path, replacing the signup page in history
      navigate(from, { replace: true });
    }
    // If signup fails, the 'authError' state in useAuth() will be set by the context,
    // and the ErrorMessage component will display it.
  };

  /**
   * Toggles the visibility of the main password input field.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Toggles the visibility of the confirm password input field.
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // --- Render Logic ---
  return (
    // Use 'form' element with onSubmit handler and noValidate attribute
    <form onSubmit={handleSubmit} noValidate>
      {/* Form Title */}
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>Sign Up</h2>

      {/* Display Errors: Show local validation errors first, then errors from AuthContext */}
      <ErrorMessage message={localError || authError} />

      {/* Username Input Field */}
      <Input
        label="Username"
        type="text"
        id="signup-username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        minLength={3} // HTML5 validation attribute (matches frontend check)
        maxLength={20} // HTML5 validation attribute (matches frontend check)
        pattern="^[a-zA-Z0-9_]+$" // HTML5 validation attribute (matches frontend check)
        title="Username can only contain letters, numbers, and underscores (3-20 characters)." // Tooltip for pattern
        autoComplete="username" // Browser autofill hint
        placeholder="Choose a public username"
        disabled={loading} // Disable during signup process
      />

      {/* Email Input Field */}
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

      {/* Password Input Field with Visibility Toggle */}
      <div className={styles.passwordWrapper}>
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'} // Dynamic input type
          id="signup-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6} // HTML5 validation attribute
          autoComplete="new-password" // Hint for password managers
          placeholder="Create a password (min. 6 characters)"
          disabled={loading}
          inputClassName={styles.passwordInputWithIcon} // Class for styling with icon
        />
        {/* Password Visibility Toggle Button */}
        <button
          type="button" // Prevent form submission
          className={styles.passwordToggle}
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {/* Conditional icon rendering */}
          {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
        </button>
      </div>

      {/* Confirm Password Input Field with Visibility Toggle */}
      <div className={styles.passwordWrapper}>
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'} // Dynamic input type
          id="signup-confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Re-enter your password"
          disabled={loading}
          inputClassName={styles.passwordInputWithIcon} // Class for styling with icon
        />
        {/* Confirm Password Visibility Toggle Button */}
         <button
          type="button" // Prevent form submission
          className={styles.passwordToggle}
          onClick={toggleConfirmPasswordVisibility}
          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          title={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          {/* Conditional icon rendering */}
          {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
        </button>
      </div>

      {/* Submit Button Wrapper */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        <Button
            type="submit" // Triggers form onSubmit
            variant="primary"
            disabled={loading} // Disable during signup process
            style={{ width: '100%' }} // Full width button
        >
          {/* Show spinner or text based on loading state */}
          {loading ? <LoadingSpinner size="small" inline /> : 'Sign Up'}
        </Button>
      </div>
    </form>
  );
};

export default SignupForm;

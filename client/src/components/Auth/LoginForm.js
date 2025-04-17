// client/src/components/Auth/LoginForm.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Import custom context hook to access authentication functions and state
import { useAuth } from '../../contexts/AuthContext';

// Import reusable UI components
import Input from '../Common/Input/Input';
import Button from '../Common/Button/Button';
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner';

// Import icons for password visibility toggle
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

// Import component-specific styles
import styles from './AuthForm.module.css';

// Define the LoginForm functional component
const LoginForm = () => {
  // --- State Variables ---
  // Store the value of the email input field
  const [email, setEmail] = useState('');
  // Store the value of the password input field
  const [password, setPassword] = useState('');
  // Track whether the password should be shown as text or hidden
  const [showPassword, setShowPassword] = useState(false);

  // --- Hooks ---
  // Get authentication functions (login), loading state, error state, and clearError function from AuthContext
  const { login, loading, error: authError, clearError } = useAuth();
  // Get the navigate function from React Router to redirect the user after login
  const navigate = useNavigate();
  // Get location information, useful for redirecting back to the previous page after login
  const location = useLocation();

  // --- Event Handlers ---

  /**
   * Handles the form submission event.
   * Prevents default form submission, clears errors, calls the login function,
   * and navigates the user on successful login.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event object.
   */
  const handleSubmit = async (e) => {
    // Prevent the browser's default form submission behavior (which causes a page reload)
    e.preventDefault();
    // Clear any previous errors from the authentication context
    clearError();

    // Attempt to log the user in using the email and password from state
    // The login function likely handles API calls and updates the auth context
    const success = await login(email, password);

    // Check if the login function returned successfully
    if (success) {
      // Determine where to redirect the user after login:
      // 1. If the user was redirected to login from a specific page, use that page (location.state.from.pathname).
      // 2. Otherwise, redirect to the homepage ("/").
      const from = location.state?.from?.pathname || "/";
      // Navigate to the determined path, replacing the current history entry
      // so the user doesn't go back to the login page by hitting the back button.
      navigate(from, { replace: true });
    }
    // If login was not successful, the 'authError' state in the AuthContext
    // should have been updated by the 'login' function, and the ErrorMessage component will display it.
  };

  /**
   * Toggles the visibility of the password input field between 'text' and 'password'.
   */
  const togglePasswordVisibility = () => {
    // Update the showPassword state to its opposite value
    setShowPassword(!showPassword);
  };

  // --- Render Logic ---
  return (
    // Use the 'form' element and attach the handleSubmit handler to the 'onSubmit' event.
    // 'noValidate' prevents default browser validation, allowing our custom checks (if any) and error handling.
    <form onSubmit={handleSubmit} noValidate>
      {/* Form Title */}
      <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>Login</h2>

      {/* Display authentication errors from the AuthContext */}
      <ErrorMessage message={authError} />

      {/* Email Input Field */}
      <Input
        label="Email Address"
        type="email"
        id="login-email" // Unique ID for the input, useful for labels and accessibility
        value={email} // Bind input value to the 'email' state
        onChange={(e) => setEmail(e.target.value)} // Update 'email' state when input changes
        required // HTML5 attribute indicating the field must be filled
        autoComplete="email" // Helps browsers autofill the email address
        placeholder="you@example.com" // Placeholder text when the input is empty
        disabled={loading} // Disable input while login is in progress
      />

      {/* Password Input Field Wrapper (includes input and toggle button) */}
      <div className={styles.passwordWrapper}>
        <Input
          label="Password"
          // Dynamically set input type based on 'showPassword' state
          type={showPassword ? 'text' : 'password'}
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password" // Helps browsers autofill saved passwords
          placeholder="Enter your password"
          disabled={loading}
          // Apply specific class for styling when the toggle icon is present
          inputClassName={styles.passwordInputWithIcon}
        />
        {/* Password Visibility Toggle Button */}
        <button
          type="button" // Important: type="button" prevents form submission
          className={styles.passwordToggle} // Apply styles for positioning and appearance
          onClick={togglePasswordVisibility} // Call handler when clicked
          aria-label={showPassword ? 'Hide password' : 'Show password'} // Accessibility label
          title={showPassword ? 'Hide password' : 'Show password'} // Tooltip on hover
        >
          {/* Conditionally render the eye icon based on 'showPassword' state */}
          {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
        </button>
      </div>

      {/* Submit Button Wrapper */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        <Button
            type="submit" // This button triggers the form's onSubmit event
            variant="primary" // Apply primary button styling
            disabled={loading} // Disable button while login is in progress
            style={{ width: '100%' }} // Make button full width
        >
          {/* Show loading spinner if login is in progress, otherwise show 'Login' text */}
          {loading ? <LoadingSpinner size="small" inline /> : 'Login'}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;

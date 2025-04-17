// client/src/components/Common/ErrorMessage/ErrorMessage.js
import React from 'react';
import styles from './ErrorMessage.module.css'; // Import the CSS module

/**
 * A simple, reusable component to display error messages in a visually distinct way.
 * It ensures errors are announced by screen readers using the 'alert' role.
 */
// Props:
// - message: The error string to display. If null, empty, or undefined, the component renders nothing.
// - className: Optional additional CSS class(es) to apply to the container div for custom styling.
const ErrorMessage = ({ message, className = '' }) => {
  // --- Conditional Rendering ---
  // If the 'message' prop is falsy (null, undefined, empty string, 0, false),
  // return null immediately, preventing the component from rendering anything.
  if (!message) {
    return null;
  }

  // --- CSS Class Combination ---
  // Combine the base CSS module class 'errorMessage' with any custom 'className'
  // passed as a prop. This allows for both default styling and specific overrides.
  const classes = `${styles.errorMessage} ${className}`.trim(); // Use trim() to handle potential empty className

  // --- Render Logic ---
  return (
    // The main container div for the error message.
    // - className: Applies the combined styles.
    // - role="alert": An important accessibility attribute. It tells screen readers
    //   to announce the content of this element immediately as an important update,
    //   without interrupting the user's current focus. This is crucial for users
    //   who might not visually see the error message appear.
    <div className={classes} role="alert">
      {/* Display the actual error message string passed via the 'message' prop */}
      {message}
    </div>
  );
};

export default ErrorMessage;

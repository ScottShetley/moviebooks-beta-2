// client/src/components/Common/ErrorMessage/ErrorMessage.js
import React from 'react';
import styles from './ErrorMessage.module.css'; // Import the CSS module

/**
 * Simple component to display error messages visually distinctively.
 * Props:
 * - message: The error string to display. If null/empty, component renders nothing.
 * - className: Optional additional CSS class(es) to apply to the container div.
 */
const ErrorMessage = ({ message, className = '' }) => {
  // Don't render the component if there's no message to display
  if (!message) {
    return null;
  }

  // Combine base style with any additional classes passed in
  const classes = `${styles.errorMessage} ${className}`;

  return (
    // Use 'alert' role for accessibility, indicating an important message
    <div className={classes} role="alert">
      {/* Display the error message passed via props */}
      {message}
    </div>
  );
};

export default ErrorMessage;
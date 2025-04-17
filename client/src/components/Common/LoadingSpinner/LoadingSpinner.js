// client/src/components/Common/LoadingSpinner/LoadingSpinner.js
import React from 'react';
import styles from './LoadingSpinner.module.css'; // Import the CSS module

/**
 * A simple, reusable component to display a CSS-based loading spinner animation.
 * Supports different sizes and inline display.
 */
// Props:
// - size: If set to 'small', applies styles for a smaller spinner.
// - inline: If true, applies styles to make the spinner display inline-block,
//           allowing it to sit alongside text or other inline elements.
// - className: Optional additional CSS class(es) to apply to the spinner div
//              for custom styling or layout adjustments.
const LoadingSpinner = ({ size, inline, className = '' }) => {

  // --- CSS Class Combination ---
  // Dynamically build the list of CSS classes based on the provided props.
  const classes = [
    styles.spinner, // Apply the base spinner animation styles
    // Conditionally add the 'small' class if the size prop is 'small'
    size === 'small' ? styles.small : '',
    // Conditionally add the 'inline' class if the inline prop is true
    inline ? styles.inline : '',
    // Include any custom class names passed via the 'className' prop
    className
  ]
  .filter(Boolean) // Remove any empty strings or falsy values
  .join(' '); // Join the valid class names into a space-separated string

  // --- Render Logic ---
  return (
    // The main div element that will be styled to look like a spinner.
    // - className: Applies the combined styles.
    // - role="status": An accessibility attribute indicating that this element
    //   represents the status of an ongoing task (loading). Screen readers
    //   may announce this status change.
    // - aria-label="Loading...": Provides a textual description of the spinner's
    //   purpose for screen readers, making it accessible to users who cannot
    //   see the visual animation.
    <div className={classes} role="status" aria-label="Loading..."></div>
    // Note: The actual spinning animation is handled entirely by CSS rules
    // associated with the .spinner class in LoadingSpinner.module.css.
  );
};

export default LoadingSpinner;

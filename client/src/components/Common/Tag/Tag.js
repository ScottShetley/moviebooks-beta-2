// client/src/components/Common/Tag/Tag.js
import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes for prop validation
import styles from './Tag.module.css'; // Import the CSS module

/**
 * A simple reusable component to display a tag, typically used for keywords or categories.
 * It renders the tag text prepended with a '#'.
 * This component is intended for display only; wrap it in a Link or Button for interactivity.
 */
// Props:
// - tag: The string content of the tag (e.g., "react", "movies"). Required.
// - className: Optional additional CSS class(es) to apply to the tag span
//              for custom styling or layout adjustments.
const Tag = ({ tag, className = '' }) => { // Default className to empty string

  // --- Conditional Rendering ---
  // If no 'tag' prop is provided (it's null, undefined, or an empty string),
  // render nothing.
  if (!tag) {
    return null;
  }

  // --- CSS Class Combination ---
  // Combine the base tag style with any custom className passed as a prop.
  const tagClasses = [
    styles.tag, // Apply the base tag style from Tag.module.css
    className   // Include any custom class names
  ]
  .filter(Boolean) // Remove any falsy values (like an empty className)
  .join(' '); // Join the valid class names into a space-separated string

  // --- Render Logic ---
  return (
    // Use a <span> element as tags are typically inline elements.
    // Apply the combined CSS classes.
    <span className={tagClasses}>
      {/* Prepend the tag text with a '#' symbol */}
      #{tag}
    </span>
  );
};

// --- Prop Type Validation ---
// Define the expected types for the component's props.
// This helps catch errors during development if incorrect prop types are passed.
Tag.propTypes = {
  /** The text content of the tag. */
  tag: PropTypes.string.isRequired, // 'tag' must be a string and is required.
  /** Optional custom CSS class(es) for additional styling. */
  className: PropTypes.string, // 'className' must be a string, but it's optional.
};

export default Tag;

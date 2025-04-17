// client/src/components/Common/Button/Button.js
import React from 'react';
import styles from './Button.module.css'; // Import the CSS module

/**
 * A reusable Button component that provides consistent styling and behavior.
 * It supports different visual variants, disabled states, and standard button types.
 */
// Props:
// - children: The content inside the button (text, icons, etc.)
// - onClick: Function to call when clicked
// - type: Button type ('button', 'submit', 'reset'), defaults to 'button'
// - variant: Style variant ('primary', 'secondary', 'accent', 'outline', 'ghost'), defaults to 'primary'
// - disabled: Boolean to disable the button, defaults to false
// - className: Additional custom CSS classes to apply alongside the module styles
// - ...props: Any other standard HTML button attributes (e.g., aria-label, title, id)
const Button = ({
  children,
  onClick,
  type = 'button', // Default type is 'button' to prevent accidental form submissions
  variant = 'primary', // Default style variant
  disabled = false, // Default disabled state
  className = '', // Default empty string for custom classes
  ...props // Collect any other props passed down (like aria-label)
}) => {

  // --- CSS Class Combination Logic ---
  // Dynamically build the list of CSS classes to apply to the button element.
  const buttonClasses = [
    styles.button, // Apply the base button style from Button.module.css
    // Apply the style for the specified variant (e.g., styles.primary, styles.secondary).
    // If the provided variant name doesn't match a style, default to styles.primary.
    styles[variant] || styles.primary,
    className, // Include any custom class names passed via the 'className' prop.
    // Conditionally add the 'disabled' style if the 'disabled' prop is true.
    disabled ? styles.disabled : ''
  ]
  // Filter out any falsy values (like empty strings from 'className' or the disabled condition)
  .filter(Boolean)
  // Join the remaining class names into a single space-separated string.
  .join(' ');

  // --- Render Logic ---
  return (
    <button
      type={type} // Set the button's type (button, submit, reset)
      onClick={onClick} // Attach the click handler function
      disabled={disabled} // Set the disabled attribute based on the prop
      className={buttonClasses} // Apply the combined CSS classes
      {...props} // Spread any additional props onto the button element (e.g., aria-label="Close")
    >
      {/* Render the content passed between the <Button> tags */}
      {children}
    </button>
  );
};

export default Button;

// client/src/components/Common/Button/Button.js
import React from 'react';
import styles from './Button.module.css'; // Import the CSS module

// Reusable Button component
// Props:
// - children: The content inside the button (text, icons, etc.)
// - onClick: Function to call when clicked
// - type: Button type ('button', 'submit', 'reset'), defaults to 'button'
// - variant: Style variant ('primary', 'secondary', 'accent', 'outline', 'ghost'), defaults to 'primary'
// - disabled: Boolean to disable the button, defaults to false
// - className: Additional CSS classes to apply
// - ...props: Any other standard button attributes (e.g., aria-label)
const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  ...props // Collect remaining props
}) => {

  // Combine base class, variant class, custom class, and disabled class
  const buttonClasses = [
    styles.button,            // Base button style
    styles[variant] || styles.primary, // Apply variant style, default to primary if invalid
    className,                // Apply any custom classes passed in
    disabled ? styles.disabled : '' // Apply disabled style if disabled
  ].filter(Boolean).join(' '); // Filter out empty strings and join

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses} // Apply combined classes
      {...props} // Spread any additional props like aria-label, etc.
    >
      {children} {/* Render the content passed to the button */}
    </button>
  );
};

export default Button;
// client/src/components/Common/Input/Input.js
import React from 'react';
import styles from './Input.module.css'; // Import CSS module

// Reusable Input component (handles text, email, password, number, textarea)
// Props:
// - label: Text label displayed above the input
// - id: HTML id attribute for the input (and linked by label's htmlFor)
// - type: Input type ('text', 'email', 'password', 'number', 'textarea'), defaults to 'text'
// - value: Controlled component value
// - onChange: Function to handle value changes
// - placeholder: Placeholder text
// - required: Boolean for HTML5 required attribute
// - disabled: Boolean to disable input
// - error: String containing an error message to display below the input
// - className: Additional CSS class for the input group container
// - inputClassName: Additional CSS class specifically for the <input> or <textarea> element
// - ...props: Any other standard input/textarea attributes (e.g., minLength, autoComplete, rows for textarea)
const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error = null, // Expect null or error message string
  className = '', // Class for the whole group div
  inputClassName = '', // Class specifically for the input/textarea element
  ...props // Collect remaining props
}) => {

  // Determine if the input type is a textarea
  const isTextarea = type === 'textarea';

  // Combine classes for the input/textarea element itself
  const inputClasses = [
    styles.input, // Base input style
    isTextarea ? styles.textarea : '', // Add textarea specific style if applicable
    error ? styles.error : '', // Add error style if error exists
    inputClassName, // Add custom input class
  ].filter(Boolean).join(' ');

  // Combine classes for the wrapper div
  const groupClasses = `${styles.inputGroup} ${className}`;

  // Choose the correct element type (input or textarea)
  const InputElement = isTextarea ? 'textarea' : 'input';

  return (
    <div className={groupClasses}>
      {/* Render label if provided */}
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}

      {/* Render the input or textarea element */}
      <InputElement
        id={id}
        type={!isTextarea ? type : undefined} // Don't apply type="textarea"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputClasses} // Apply combined input classes
        aria-invalid={!!error} // Indicate invalid state for accessibility if error exists
        aria-describedby={error ? `${id}-error` : undefined} // Link error message for accessibility
        {...props} // Spread any additional props (like rows, minLength, autoComplete)
      />

      {/* Render error message if provided */}
      {/* Add an id for aria-describedby */}
      {error && (
        <div id={`${id}-error`} className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
      {/* Optional: Render a placeholder div if no error to maintain layout consistency */}
      {/* {!error && <div className={styles.errorMessage}> </div>} */}
    </div>
  );
};

export default Input;
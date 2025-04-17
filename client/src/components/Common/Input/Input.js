// client/src/components/Common/Input/Input.js
import React from 'react';
import styles from './Input.module.css'; // Import CSS module

/**
 * A reusable Input component that renders standard HTML input fields or textareas
 * with consistent styling, labels, error handling, and accessibility features.
 */
// Props:
// - label: Text label displayed above the input
// - id: HTML id attribute for the input (and linked by label's htmlFor)
// - type: Input type ('text', 'email', 'password', 'number', 'textarea'), defaults to 'text'
// - value: Controlled component value
// - onChange: Function to handle value changes
// - placeholder: Placeholder text
// - required: Boolean for HTML5 required attribute
// - disabled: Boolean to disable input
// - error: String containing an error message to display below the input (or null)
// - className: Additional CSS class for the input group container (the wrapper div)
// - inputClassName: Additional CSS class specifically for the <input> or <textarea> element itself
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
  ...props // Collect remaining props like rows, minLength, etc.
}) => {

  // --- Determine Element Type ---
  // Check if the requested type is 'textarea' to render a <textarea> element instead of <input>.
  const isTextarea = type === 'textarea';

  // --- CSS Class Combination for Input/Textarea ---
  // Build the list of classes for the actual input or textarea element.
  const inputClasses = [
    styles.input, // Apply base input/textarea styles
    // Conditionally add textarea-specific styles if it's a textarea
    isTextarea ? styles.textarea : '',
    // Conditionally add error-state styles if an error message is present
    error ? styles.error : '',
    // Include any custom class name passed specifically for the input element
    inputClassName,
  ]
  .filter(Boolean) // Remove any empty strings or falsy values from the array
  .join(' '); // Join the remaining class names into a space-separated string

  // --- CSS Class Combination for Wrapper Div ---
  // Combine the base group style with any custom class passed for the wrapper.
  const groupClasses = `${styles.inputGroup} ${className}`.trim(); // Use trim() to handle potential empty className

  // --- Dynamic Element Selection ---
  // Choose the correct HTML tag ('input' or 'textarea') based on the 'isTextarea' flag.
  // This allows rendering the appropriate element dynamically.
  const InputElement = isTextarea ? 'textarea' : 'input';

  // --- Render Logic ---
  return (
    // The main wrapper div for the label, input/textarea, and error message.
    <div className={groupClasses}>
      {/* Render the label only if a 'label' prop was provided */}
      {label && (
        // The 'htmlFor' attribute links the label to the input element using its 'id',
        // which is important for accessibility (clicking the label focuses the input).
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}

      {/* Render the dynamically chosen InputElement (either <input> or <textarea>) */}
      <InputElement
        id={id} // Assign the id for linking with the label and error message
        // Only apply the 'type' attribute if it's NOT a textarea (textareas don't have a type attribute)
        type={!isTextarea ? type : undefined}
        value={value} // Set the controlled value from state
        onChange={onChange} // Attach the change handler
        placeholder={placeholder} // Set placeholder text
        required={required} // Set the required attribute
        disabled={disabled} // Set the disabled attribute
        className={inputClasses} // Apply the combined styles for the input/textarea
        // --- Accessibility Attributes ---
        // aria-invalid: Set to 'true' if an error exists, indicating an invalid state to screen readers.
        aria-invalid={!!error} // Use double negation (!!) to convert error string/null to boolean
        // aria-describedby: Links the input to the error message element by its ID.
        // Screen readers will announce the error message when the user focuses on this input.
        aria-describedby={error ? `${id}-error` : undefined}
        // --- End Accessibility Attributes ---
        {...props} // Spread any additional props (like rows, minLength, autoComplete, pattern, title)
      />

      {/* Render the error message section only if an 'error' prop was provided */}
      {error && (
        // This div displays the error message text.
        // - id: Creates a unique ID based on the input's ID, used by 'aria-describedby'.
        // - className: Applies styling for the error message.
        // - role="alert": Ensures screen readers announce the error message immediately.
        <div id={`${id}-error`} className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
      {/* Optional: Render a placeholder div with a non-breaking space (&nbsp;) if no error.
          This can help maintain consistent vertical spacing below the input, preventing layout shifts
          when an error message appears or disappears. Uncomment if needed. */}
      {/* {!error && <div className={styles.errorMessage}>&nbsp;</div>} */}
    </div>
  );
};

export default Input;

// client/src/components/Common/LoadingSpinner/LoadingSpinner.js
import React from 'react';
import styles from './LoadingSpinner.module.css'; // Import the CSS module

// Simple Loading Spinner component
// Props:
// - size: 'small' for a smaller version
// - inline: true to display inline with text
// - className: Additional classes to apply
const LoadingSpinner = ({ size, inline, className = '' }) => {
  const classes = [
    styles.spinner,
    size === 'small' ? styles.small : '',
    inline ? styles.inline : '',
    className // Allow passing extra custom classes
  ].filter(Boolean).join(' '); // Join valid classes

  return <div className={classes} role="status" aria-label="Loading..."></div>;
};

export default LoadingSpinner;
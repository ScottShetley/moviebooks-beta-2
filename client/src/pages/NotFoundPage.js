// client/src/pages/NotFoundPage.js
import React from 'react';
import { Link } from 'react-router-dom'; // Used to link back to the homepage

// Optional: Import page-specific styles if you create them
// import styles from './NotFoundPage.module.css';

/**
 * Renders a simple 404 "Page Not Found" message with a link back to the homepage.
 */
const NotFoundPage = () => {
  return (
    // Main container div for the 404 page content.
    // Using inline styles here; consider creating a CSS module (e.g., NotFoundPage.module.css)
    // and a container class for consistent page styling (centering, padding, etc.).
    <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
      {/* Main heading indicating the error */}
      <h1>404 - Page Not Found</h1>
      {/* Explanatory paragraph */}
      <p>Oops! The page you are looking for does not exist.</p>
      {/* Link component to navigate back to the homepage */}
      <Link to="/">Go back to the Home Page</Link>
    </div>
  );
};

export default NotFoundPage;

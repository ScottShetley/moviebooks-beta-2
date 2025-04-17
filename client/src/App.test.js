// client/src/App.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import App from './App';

// Mock the contexts if necessary, or provide basic values
// For a simple render test, wrapping might be enough

test('renders the header or footer text', () => {
  // Wrap App in necessary providers for rendering
  render(
    <React.StrictMode>
      <HelmetProvider>
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AuthProvider>
        </Router>
      </HelmetProvider>
    </React.StrictMode>
  );

  // Check for text that is always present, like in the Header or Footer
  // Use a regular expression for case-insensitivity and flexibility
  // Example: Check for "MovieBooks" in the Header
  const headerElement = screen.getByText(/MovieBooks/i);
  expect(headerElement).toBeInTheDocument();

  // Or check for text in the Footer
  // const footerElement = screen.getByText(/© \d{4} MovieBooks/i); // Regex for year
  // expect(footerElement).toBeInTheDocument();
});


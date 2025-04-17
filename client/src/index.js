// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Import the new ReactDOM client API for React 18+
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router for handling client-side routing
import { HelmetProvider } from 'react-helmet-async'; // Import provider for managing document head tags

// Import global styles and the main App component
// Import styles BEFORE App component to ensure correct cascade
import './styles/tokens.css'; // Import tokens first
import './styles/global.css'; // Import global styles
import App from './App';

// Import custom context providers
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Import web vitals reporting function (optional)
import reportWebVitals from './reportWebVitals';

// Get the root DOM element where the React app will be mounted
// Assumes you have <div id="root"></div> in your public/index.html
const rootElement = document.getElementById('root');

// Create a root instance using the new ReactDOM client API
const root = ReactDOM.createRoot(rootElement);

// Render the application into the root element
root.render(
  // React.StrictMode enables checks and warnings for potential problems in the app during development.
  // It does not affect the production build.
  <React.StrictMode>
    {/* HelmetProvider provides context for react-helmet-async to manage document head changes. */}
    <HelmetProvider>
      {/* Router provides routing capabilities to the entire application. */}
      <Router>
        {/* AuthProvider makes authentication state and functions available to components. */}
        <AuthProvider>
          {/* NotificationProvider makes notification state and functions available. */}
          <NotificationProvider>
            {/* The main App component containing layout and page routes. */}
            <App />
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// This is optional and can be removed if not needed.
reportWebVitals();

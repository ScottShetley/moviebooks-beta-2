// client/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// --- START: Font Awesome Configuration (Imports at the very top) ---
// Configure Font Awesome library here to add global icons used throughout the app
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons'; // Import the specific icon
// --- END: Font Awesome Configuration ---

// Import styles BEFORE App component to ensure correct cascade (Imports should also be at top)
import './styles/tokens.css';
import './styles/global.css';

// Import Components and Contexts (Imports should also be at top)
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';


// Add the imported icons to the library so they can be used by the component
library.add(faBookOpen);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider> {/* <-- Wrap the entire app */}
      <Router> {/* Handles routing */}
        <AuthProvider> {/* Provides authentication state/functions */}
          <NotificationProvider> {/* Provides notification state/functions */}
              <App /> {/* The main application component */}
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider> {/* <-- Close HelmetProvider */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
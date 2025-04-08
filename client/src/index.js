// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // <-- Import HelmetProvider

// Import styles BEFORE App component to ensure correct cascade
import './styles/tokens.css'; // Import tokens first
import './styles/global.css'; // Import global styles
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

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
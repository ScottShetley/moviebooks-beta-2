// client/src/App.js
import React, { useState, useCallback } from 'react';
// *** Ensure Navigate is imported from react-router-dom ***
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header/Header';
import Footer from './components/Layout/Footer/Footer';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage/LandingPage';
// *** Ensure LoginPage and SignupPage components are imported ***
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
// *** --- ***
import CreateConnectionPage from './pages/CreateConnectionPage';
import MovieDetailPage from './pages/MovieDetailPage';
import BookDetailPage from './pages/BookDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage/AboutPage';
import HelpPage from './pages/HelpPage/HelpPage';
// Optional: Import LoadingSpinner if you want a visual indicator
// import LoadingSpinner from './components/Common/LoadingSpinner/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); // Use loading state from auth context

  // Show loading indicator while checking auth status
  if (authLoading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            {/* Optional: <LoadingSpinner /> */}
            Checking authentication...
        </div>
    );
  }

  // If not loading, redirect to login if no user exists
  // Using 'replace' prevents the login page from ending up in the history stack
  return user ? children : <Navigate to="/login" replace />;
};


// Main App Component
function App() {
  // Get user and loading status from AuthContext
  // Renamed loading to authLoading to avoid naming conflicts if other loading states are added later
  const { user, loading: authLoading } = useAuth();

  // State for controlling sidebar visibility (moved from HomePage)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Callback to toggle sidebar state, stable due to empty dependency array
  const toggleSidebar = useCallback((forceState) => {
      setIsSidebarOpen(prev => typeof forceState === 'boolean' ? forceState : !prev);
  }, []);

  // Display a global loading state only during the initial authentication check
  // This prevents the entire UI from flashing or rendering prematurely
  if (authLoading) {
      return (
        <>
          {/* Render a minimal layout during this initial check */}
          <Header isSidebarOpen={false} onSidebarToggle={() => {}} />
          <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: ' calc(100vh - 120px)' }}>
             {/* Optional: <LoadingSpinner /> */}
             Initializing Application...
          </main>
          <Footer />
        </>
      );
  }

  // Once initial auth check is done, render the main application layout
  return (
    <>
      {/* Header receives sidebar state and toggle function */}
      <Header
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={toggleSidebar}
      />
      {/* Main content area where routes are rendered */}
      <main>
        <Routes>
          {/* --- Public Routes --- */}

          {/* Root Route: Shows LandingPage if logged out, HomePage if logged in */}
          <Route
            path="/"
            element={
                user
                ? <HomePage isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                : <LandingPage />
            }
          />

          {/* Login Route: Shows LoginPage if logged out, redirects to Home if logged in */}
          <Route
             path="/login"
             element={!user ? <LoginPage /> : <Navigate to="/" replace />}
          />

          {/* Signup Route: Shows SignupPage if logged out, redirects to Home if logged in */}
          <Route
             path="/signup"
             element={!user ? <SignupPage /> : <Navigate to="/" replace />}
          />

          {/* Other public routes accessible whether logged in or not */}
          {MovieDetailPage && <Route path="/movies/:movieId" element={<MovieDetailPage />} />}
          {BookDetailPage && <Route path="/books/:bookId" element={<BookDetailPage />} />}
          <Route path="/users/:userId" element={<ProfilePage />} /> {/* Public view of user profiles */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />


          {/* --- Protected Routes (Require Login) --- */}

          {/* Create Connection Route */}
          <Route
             path="/create"
             element={<ProtectedRoute><CreateConnectionPage /></ProtectedRoute>}
          />

          {/* Logged-in User's Profile Route (assuming /profile means 'my profile') */}
          {/* ProfilePage component might need logic to fetch logged-in user's data if no ID is provided */}
          <Route
            path="/profile"
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />

          {/* Notifications Route */}
          <Route
             path="/notifications"
             element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
          />
          {/* Add other protected routes here using the <ProtectedRoute> wrapper */}


          {/* --- Not Found Route (Catch-all) --- */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {/* Footer is rendered outside the main content area */}
      <Footer />
    </>
  );
}

export default App;
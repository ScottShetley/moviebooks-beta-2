// client/src/App.js
import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'; // Added useNavigate, useLocation
import { useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header/Header';
import Footer from './components/Layout/Footer/Footer';
import Sidebar from './components/Sidebar/Sidebar'; // Import Sidebar
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
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

import './AppLayout.css'; // Import layout CSS (we will create this)

// Protected Route Component (remains the same)
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        Checking authentication...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};


// Main App Component
function App() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate(); // Hook for navigation
  const location = useLocation(); // Hook to get current path

  // State for controlling sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // State for the active tag filter (lifted from HomePage)
  const [currentFilterTag, setCurrentFilterTag] = useState(null);

  // Callback to toggle sidebar state
  const toggleSidebar = useCallback((forceState) => {
    setIsSidebarOpen(prev => typeof forceState === 'boolean' ? forceState : !prev);
  }, []);

  // Callback function to handle clicks on tags in the Sidebar
  const handleTagClick = useCallback((tag) => {
    console.log('Tag clicked in App:', tag);
    setCurrentFilterTag(tag); // Set the filter state
    // If not already on HomePage, navigate there
    if (location.pathname !== '/') {
      navigate('/');
    }
    // Close sidebar after tag click (especially needed on mobile)
    toggleSidebar(false);
  }, [navigate, toggleSidebar, location.pathname]); // Dependencies

  // Function to clear the tag filter (will be passed down)
  const clearTagFilter = useCallback(() => {
      setCurrentFilterTag(null);
  }, []);

  // Global loading state during initial auth check (remains the same)
  if (authLoading) {
    return (
      <>
        <Header isSidebarOpen={false} onSidebarToggle={() => {}} />
        <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: ' calc(100vh - 120px)' }}>
           Initializing Application...
        </main>
        <Footer />
      </>
    );
  }

  // Main application layout
  return (
    <>
      {/* Header still receives toggle controls */}
      <Header
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={toggleSidebar}
      />

      {/* NEW: Layout container for Sidebar and Main Content */}
      <div className="appLayout">
        {/* Render Sidebar globally if user is logged in */}
        {user && (
           <Sidebar
             isOpen={isSidebarOpen}
             closeSidebar={() => toggleSidebar(false)} // Pass explicit close function
             onTagClick={handleTagClick} // Pass the new handler
             currentFilterTag={currentFilterTag} // Pass the current filter state
           />
         )}

        {/* Main content area where routes are rendered */}
        {/* The 'main' tag now takes the remaining space */}
        <main className="mainContent">
          <Routes>
            {/* --- Public Routes --- */}

            {/* Root Route: Always render HomePage if logged in, pass filter state */}
            <Route
              path="/"
              element={
                  user
                  ? <HomePage
                      currentFilterTag={currentFilterTag}
                      clearTagFilter={clearTagFilter} // Pass function to clear filter
                    />
                  : <LandingPage />
              }
            />

            {/* Login Route (no changes needed here) */}
            <Route
               path="/login"
               element={!user ? <LoginPage /> : <Navigate to="/" replace />}
            />

            {/* Signup Route (no changes needed here) */}
            <Route
               path="/signup"
               element={!user ? <SignupPage /> : <Navigate to="/" replace />}
            />

            {/* Other public routes (no changes needed here) */}
            {MovieDetailPage && <Route path="/movies/:movieId" element={<MovieDetailPage />} />}
            {BookDetailPage && <Route path="/books/:bookId" element={<BookDetailPage />} />}
            <Route path="/users/:userId" element={<ProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />


            {/* --- Protected Routes (Require Login) --- */}

            {/* Create Connection Route (no changes needed here) */}
            <Route
               path="/create"
               element={<ProtectedRoute><CreateConnectionPage /></ProtectedRoute>}
            />

            {/* Profile Route (no changes needed here) */}
            <Route
              path="/profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />

            {/* Notifications Route (no changes needed here) */}
            <Route
               path="/notifications"
               element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
            />


            {/* --- Not Found Route (Catch-all) --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>

      {/* Footer remains outside the main layout flex container */}
      <Footer />
    </>
  );
}

export default App;
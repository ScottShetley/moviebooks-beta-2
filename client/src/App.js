// client/src/App.js
import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header/Header';
import Footer from './components/Layout/Footer/Footer';
import Sidebar from './components/Sidebar/Sidebar';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateConnectionPage from './pages/CreateConnectionPage';
import MovieDetailPage from './pages/MovieDetailPage';
import BookDetailPage from './pages/BookDetailPage';
import ConnectionDetailPage from './pages/ConnectionDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage/AboutPage';
import HelpPage from './pages/HelpPage/HelpPage';
import EditProfilePage from './pages/EditProfilePage';
import UpdatesPage from './pages/UpdatesPage';
import SearchPage from './pages/SearchPage'; // <-- Import SearchPage

// --- NEW: Import EditConnectionPage ---
import EditConnectionPage from './pages/EditConnectionPage';

import './AppLayout.css'; // Import layout CSS

// Protected Route Component (remains the same)
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  // We wait for authLoading to be false before deciding to render children or redirect.
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
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentFilterTag, setCurrentFilterTag] = useState(null);

  const toggleSidebar = useCallback((forceState) => {
    setIsSidebarOpen(prev => typeof forceState === 'boolean' ? forceState : !prev);
  }, []);

  // REMOVED: The useEffect that was causing the sidebar to close immediately on open.
  // The logic for closing the sidebar when clicking a link *inside* it
  // is handled correctly within the Sidebar component's handleLinkClick.
  // useEffect(() => {
  //   if (isSidebarOpen) {
  //     toggleSidebar(false);
  //   }
  // }, [location.pathname, isSidebarOpen, toggleSidebar]);


  const handleTagClick = useCallback((tag) => {
    // console.log('Tag clicked in App:', tag);
    setCurrentFilterTag(tag);
    if (location.pathname !== '/') {
      navigate('/');
    }
    toggleSidebar(false); // Close sidebar after tag click
  }, [navigate, toggleSidebar, location.pathname]);

  const clearTagFilter = useCallback(() => {
      setCurrentFilterTag(null);
  }, []);

  // Show a global loading state while the initial authentication check is happening
  if (authLoading) {
    return (
      <>
        {/* Minimal header while loading */}
        <Header isSidebarOpen={false} onSidebarToggle={() => {}} />
        {/* Centered loading message */}
        <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: ' calc(100vh - var(--header-height) - var(--footer-height))' }}>
           Initializing Application...
        </main>
        {/* Minimal footer */}
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={toggleSidebar}
      />

      <div className="appLayout">
        {/* Added Overlay for closing sidebar on mobile */}
        {/* Only show overlay if sidebar is open AND user is logged in (sidebar is only shown for logged-in users) */}
        {isSidebarOpen && user && (
            <div
                className="sidebarOverlay"
                onClick={() => toggleSidebar(false)}
                aria-hidden="true"
            ></div>
        )}

        {/* Render Sidebar globally if user is logged in */}
        {user && (
           <Sidebar
             isOpen={isSidebarOpen}
             closeSidebar={() => toggleSidebar(false)}
             onTagClick={handleTagClick}
             currentFilterTag={currentFilterTag}
           />
         )}

        {/* Main content area where routes are rendered */}
        <main className="mainContent">
          <Routes>
            {/* --- Public Routes --- */}
            {/* The homepage element is conditional based on user */}
            <Route
              path="/"
              element={
                  user
                  ? <HomePage
                      currentFilterTag={currentFilterTag}
                      clearTagFilter={clearTagFilter}
                    />
                  : <LandingPage />
              }
            />
             {/* Redirect authenticated users away from login/signup */}
            <Route
               path="/login"
               element={!user ? <LoginPage /> : <Navigate to="/" replace />}
            />
            <Route
               path="/signup"
               element={!user ? <SignupPage /> : <Navigate to="/" replace />}
            />
            <Route path="/movies/:movieId" element={<MovieDetailPage />} />
            <Route path="/books/:bookId" element={<BookDetailPage />} />
            <Route path="/connections/:connectionId" element={<ConnectionDetailPage />} />
            <Route path="/users/:userId" element={<ProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/updates" element={<UpdatesPage />} />

            {/* --- Route for Search Results Page --- */}
            <Route path="/search" element={<SearchPage />} />


            {/* --- Protected Routes (Require Login) --- */}
            <Route
               path="/create"
               element={<ProtectedRoute><CreateConnectionPage /></ProtectedRoute>}
            />
             {/* User Profile (no ID) typically means the logged-in user's profile */}
            <Route
              path="/profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
             {/* Edit Profile Page */}
            <Route
              path="/profile/edit"
              element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>}
            />
             {/* Notifications Page */}
            <Route
               path="/notifications"
               element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
            />

            {/* --- NEW: Route for Edit Connection Page --- */}
            {/* This route is protected because only logged-in users can edit connections */}
            {/* Ensure EditConnectionPage is imported */}
            <Route
               path="/connections/:connectionId/edit"
               element={<ProtectedRoute><EditConnectionPage /></ProtectedRoute>}
            />
            {/* --- END NEW ROUTE --- */}


            {/* --- Not Found Route (Catch-all) --- */}
            {/* This should be the last route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>

      <Footer />
    </>
  );
}

export default App;
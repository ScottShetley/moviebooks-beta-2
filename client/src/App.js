// client/src/App.js
import React, { useState, useCallback } from 'react';
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
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage/AboutPage';
import HelpPage from './pages/HelpPage/HelpPage';
import EditProfilePage from './pages/EditProfilePage';
import UpdatesPage from './pages/UpdatesPage';
import SearchPage from './pages/SearchPage';

import EditConnectionPage from './pages/EditConnectionPage';
import ProfilePage from './pages/ProfilePage';
// --- NEW: Import Follower and Following Pages ---
import FollowersPage from './pages/FollowersPage';
import FollowingPage from './pages/FollowingPage';
// --- END NEW ---

import './AppLayout.css'; // Import layout CSS

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  // We wait for authLoading to be false before deciding to render children or redirect.
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}>
        Checking authentication...
      </div>
    );
  }
  // If not authenticated and not loading, redirect to login
  return user ? children : <Navigate to="/login" replace />;
};


// Main App Component
function App() {
  // --- DIAGNOSTIC LOG: Confirm App component is rendering and location ---
  const location = useLocation(); // Get location here
  console.log("[App Component Rendered]", { pathname: location.pathname, hash: location.hash, search: location.search });
  // --- END DIAGNOSTIC LOG ---

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentFilterTag, setCurrentFilterTag] = useState(null);

  const toggleSidebar = useCallback((forceState) => {
    setIsSidebarOpen(prev => typeof forceState === 'boolean' ? forceState : !prev);
  }, []);

  const handleTagClick = useCallback((tag) => {
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
             {/* Consolidated Profile Route: Handles /users (own via ID) and /users/:userId (other) */}
            {/* *** THIS MUST MATCH LINKS GENERATED BY UserListItem and NotificationItem *** */}
            <Route
              path="/users/:userId?" // Use /users/ to match links. userId param is optional (e.g., /users for own if no ID in params, but we mostly navigate with ID)
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
             {/* Edit Profile Page - remains specific for logged-in user, typically no userId param in URL */}
             {/* Uses /profile/edit route */}
            <Route
              path="/profile/edit"
              element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>}
            />
             {/* Notifications Page - remains specific */}
            <Route
               path="/notifications"
               element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
            />

            {/* --- Route for Edit Connection Page --- */}
            <Route
               path="/connections/:connectionId/edit"
               element={<ProtectedRoute><EditConnectionPage /></ProtectedRoute>}
            />
            {/* --- END NEW ROUTE --- */}

            {/* --- NEW: Routes for Follower/Following Lists --- */}
            {/* *** THESE MUST MATCH LINKS GENERATED BY ProfilePage *** */}
            {/* *** DO NOT put conditional logic with loggedInUser or userId here. Use ProtectedRoute and the component handles params/auth. *** */}
            <Route
               path="/users/:userId/followers" // Use /users/ to match links
               element={<ProtectedRoute><FollowersPage /></ProtectedRoute>}
            />
             <Route
               path="/users/:userId/following" // Use /users/ to match links
               element={<ProtectedRoute><FollowingPage /></ProtectedRoute>}
            />
            {/* --- END NEW ROUTES --- */}


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
// client/src/App.js
import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
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
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage/AboutPage';
import HelpPage from './pages/HelpPage/HelpPage';

import './AppLayout.css'; // Import layout CSS

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
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentFilterTag, setCurrentFilterTag] = useState(null);

  const toggleSidebar = useCallback((forceState) => {
    setIsSidebarOpen(prev => typeof forceState === 'boolean' ? forceState : !prev);
  }, []);

  // *** START: Close sidebar on route change (for mobile) ***
  useEffect(() => {
    // If the sidebar is open when the location changes, close it.
    // This handles cases like browser back/forward navigation while sidebar is open on mobile.
    if (isSidebarOpen) {
      toggleSidebar(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Depend only on pathname to avoid closing on hash changes etc.
  // *** END: Close sidebar on route change ***


  const handleTagClick = useCallback((tag) => {
    console.log('Tag clicked in App:', tag);
    setCurrentFilterTag(tag);
    if (location.pathname !== '/') {
      navigate('/');
    }
    toggleSidebar(false); // Close sidebar after tag click
  }, [navigate, toggleSidebar, location.pathname]);

  const clearTagFilter = useCallback(() => {
      setCurrentFilterTag(null);
  }, []);

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

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={toggleSidebar}
      />

      <div className="appLayout">
        {/* *** START: Added Overlay for closing sidebar on mobile *** */}
        {isSidebarOpen && user && (
            <div
                className="sidebarOverlay"
                onClick={() => toggleSidebar(false)} // Close sidebar when overlay is clicked
                aria-hidden="true"
            ></div>
        )}
        {/* *** END: Added Overlay *** */}

        {/* Render Sidebar globally if user is logged in */}
        {user && (
           <Sidebar
             isOpen={isSidebarOpen}
             closeSidebar={() => toggleSidebar(false)} // Pass explicit close function
             onTagClick={handleTagClick}
             currentFilterTag={currentFilterTag}
           />
         )}

        {/* Main content area where routes are rendered */}
        <main className="mainContent">
          <Routes>
            {/* --- Public Routes --- */}
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
            <Route
               path="/login"
               element={!user ? <LoginPage /> : <Navigate to="/" replace />}
            />
            <Route
               path="/signup"
               element={!user ? <SignupPage /> : <Navigate to="/" replace />}
            />
            {MovieDetailPage && <Route path="/movies/:movieId" element={<MovieDetailPage />} />}
            {BookDetailPage && <Route path="/books/:bookId" element={<BookDetailPage />} />}
            <Route path="/users/:userId" element={<ProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />

            {/* --- Protected Routes (Require Login) --- */}
            <Route
               path="/create"
               element={<ProtectedRoute><CreateConnectionPage /></ProtectedRoute>}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
            <Route
               path="/notifications"
               element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
            />

            {/* --- Not Found Route (Catch-all) --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>

      <Footer />
    </>
  );
}

export default App;
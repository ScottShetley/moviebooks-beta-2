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
import SearchPage from './pages/SearchPage'; // <-- NEW: Import SearchPage

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

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    if (isSidebarOpen) {
      toggleSidebar(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);


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
        {/* Added Overlay for closing sidebar on mobile */}
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
            <Route path="/movies/:movieId" element={<MovieDetailPage />} />
            <Route path="/books/:bookId" element={<BookDetailPage />} />
            <Route path="/connections/:connectionId" element={<ConnectionDetailPage />} />
            <Route path="/users/:userId" element={<ProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/updates" element={<UpdatesPage />} />

            {/* --- NEW: Route for Search Results Page --- */}
            {/* This route should be public */}
            <Route path="/search" element={<SearchPage />} />
            {/* --- END NEW ROUTE --- */}


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
              path="/profile/edit" // Define the path
              element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} // Wrap with ProtectedRoute
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
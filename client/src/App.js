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
import FollowersPage from './pages/FollowersPage';
import FollowingPage from './pages/FollowingPage';
import UsersPage from './pages/UsersPage';

// --- NEW: Import WhatsNewBanner ---
import WhatsNewBanner from './components/WhatsNewBanner/WhatsNewBanner';
// --- END NEW ---

import './AppLayout.css'; // Import layout CSS

// --- NEW: Define the current update batch ID and message ---
// Increment this ID when new updates are deployed that you want to announce.
const UPDATE_BATCH_ID = "20240328-comment-notifications-ui-fixes"; // Example: YYYYMMDD-feature-name
const WHATS_NEW_MESSAGE = "New: Comment Notifications & UI improvements!";
const LOCAL_STORAGE_KEY_WHATS_NEW = "dismissedUpdateBatchId";
// --- END NEW ---

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}>
        Checking authentication...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};


// Main App Component
function App() {
  const location = useLocation();
  // console.log("[App Component Rendered]", { pathname: location.pathname, hash: location.hash, search: location.search }); // Kept for your diagnostic reference

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentFilterTag, setCurrentFilterTag] = useState(null);

  // --- NEW: State for "What's New" banner ---
  const [showWhatsNewBanner, setShowWhatsNewBanner] = useState(false);
  // --- END NEW ---

  // --- NEW: useEffect to check if "What's New" banner should be shown ---
  useEffect(() => {
    const dismissedBatchId = localStorage.getItem(LOCAL_STORAGE_KEY_WHATS_NEW);
    if (dismissedBatchId !== UPDATE_BATCH_ID) {
      setShowWhatsNewBanner(true);
    }
  }, []); // Empty dependency array: run once on component mount
  // --- END NEW ---

  // --- NEW: Handler to dismiss "What's New" banner ---
  const handleDismissWhatsNew = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY_WHATS_NEW, UPDATE_BATCH_ID);
    setShowWhatsNewBanner(false);
  };
  // --- END NEW ---

  const toggleSidebar = useCallback((forceState) => {
    setIsSidebarOpen(prev => typeof forceState === 'boolean' ? forceState : !prev);
  }, []);

  const handleTagClick = useCallback((tag) => {
    setCurrentFilterTag(tag);
    if (location.pathname !== '/') {
      navigate('/');
    }
    toggleSidebar(false);
  }, [navigate, toggleSidebar, location.pathname]);

  const clearTagFilter = useCallback(() => {
      setCurrentFilterTag(null);
  }, []);

  if (authLoading) {
    return (
      <>
        <Header isSidebarOpen={false} onSidebarToggle={() => {}} />
        <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: ' calc(100vh - var(--header-height) - var(--footer-height))' }}>
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
        {isSidebarOpen && user && (
            <div
                className="sidebarOverlay"
                onClick={() => toggleSidebar(false)}
                aria-hidden="true"
            ></div>
        )}

        {user && (
           <Sidebar
             isOpen={isSidebarOpen}
             closeSidebar={() => toggleSidebar(false)}
             onTagClick={handleTagClick}
             currentFilterTag={currentFilterTag}
           />
         )}

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
            <Route path="/all-users" element={<UsersPage />} />
            <Route path="/movies/:movieId" element={<MovieDetailPage />} />
            <Route path="/books/:bookId" element={<BookDetailPage />} />
            <Route path="/connections/:connectionId" element={<ConnectionDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* --- Protected Routes (Require Login) --- */}
            <Route
               path="/create"
               element={<ProtectedRoute><CreateConnectionPage /></ProtectedRoute>}
            />
            <Route
              path="/users/:userId?"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
            <Route
              path="/profile/edit"
              element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>}
            />
            <Route
               path="/notifications"
               element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
            />
            <Route
               path="/connections/:connectionId/edit"
               element={<ProtectedRoute><EditConnectionPage /></ProtectedRoute>}
            />
            <Route
               path="/users/:userId/followers"
               element={<ProtectedRoute><FollowersPage /></ProtectedRoute>}
            />
             <Route
               path="/users/:userId/following"
               element={<ProtectedRoute><FollowingPage /></ProtectedRoute>}
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>

      <Footer />

      {/* --- NEW: Conditionally render the "What's New" Banner --- */}
      {showWhatsNewBanner && (
        <WhatsNewBanner
          onDismiss={handleDismissWhatsNew}
          updateMessage={WHATS_NEW_MESSAGE}
          // updatesPageLink="/updates" // This is the default, but can be overridden if needed
        />
      )}
      {/* --- END NEW --- */}
    </>
  );
}

export default App;
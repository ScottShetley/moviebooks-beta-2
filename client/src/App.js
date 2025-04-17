// client/src/App.js
import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Import custom hook for authentication context
import { useAuth } from './contexts/AuthContext';

// Import Layout Components
import Header from './components/Layout/Header/Header';
import Footer from './components/Layout/Footer/Footer';
import Sidebar from './components/Sidebar/Sidebar';

// Import Page Components
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

// Import layout CSS (defines .appLayout, .mainContent, .sidebarOverlay)
import './AppLayout.css';

/**
 * A reusable component to protect routes that require authentication.
 * Renders children if the user is authenticated, otherwise redirects to the login page.
 * Shows a loading indicator during the initial authentication check.
 */
const ProtectedRoute = ({ children }) => {
  // Get user state and auth loading status from AuthContext
  const { user, loading: authLoading } = useAuth();

  // Show loading indicator while checking authentication status
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        Checking authentication...
      </div>
    );
  }
  // If auth check is done and user exists, render the protected content
  // Otherwise, redirect to the login page, preserving the intended destination
  return user ? children : <Navigate to="/login" replace />;
};


/**
 * The main application component.
 * Sets up the overall layout (Header, Sidebar, Footer), defines routes,
 * manages global UI state (sidebar visibility, tag filters), and handles
 * authentication checks for routing.
 */
function App() {
  // --- Hooks ---
  // Get user state and auth loading status from AuthContext
  const { user, loading: authLoading } = useAuth();
  // Get navigation function from React Router
  const navigate = useNavigate();
  // Get current location information (used for sidebar closing and tag clicks)
  const location = useLocation();

  // --- Global UI State ---
  // Tracks whether the sidebar is currently open or closed
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Stores the tag currently selected for filtering the feed (null if no tag filter)
  const [currentFilterTag, setCurrentFilterTag] = useState(null);

  // --- Callbacks ---
  /**
   * Toggles the sidebar's open/closed state.
   * Can optionally accept a boolean to force a specific state.
   * Wrapped in useCallback to prevent unnecessary re-renders of child components.
   * @param {boolean} [forceState] - Optional boolean to force open (true) or closed (false).
   */
  const toggleSidebar = useCallback((forceState) => {
    setIsSidebarOpen(prev => typeof forceState === 'boolean' ? forceState : !prev);
  }, []); // Empty dependency array: function logic doesn't depend on component state/props

  /**
   * Handles clicks on tags within the Sidebar.
   * Sets the global tag filter, navigates to the homepage if not already there,
   * and closes the sidebar.
   * Wrapped in useCallback for optimization.
   * @param {string} tag - The tag string that was clicked.
   */
  const handleTagClick = useCallback((tag) => {
    setCurrentFilterTag(tag); // Set the global filter
    // If not already on the homepage, navigate there to apply the filter
    if (location.pathname !== '/') {
      navigate('/');
    }
    toggleSidebar(false); // Close sidebar after tag selection
  }, [navigate, toggleSidebar, location.pathname]); // Dependencies

  /**
   * Clears the currently active global tag filter.
   * Passed down to HomePage to be triggered from the filter status display.
   * Wrapped in useCallback for optimization.
   */
  const clearTagFilter = useCallback(() => {
      setCurrentFilterTag(null);
  }, []); // Empty dependency array

  // --- Effects ---
  /**
   * useEffect hook to automatically close the sidebar when the route changes (location.pathname).
   * Useful for mobile navigation where the sidebar overlays content.
   */
  useEffect(() => {
    // If the sidebar is open, close it
    if (isSidebarOpen) {
      toggleSidebar(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Dependency: Run only when the pathname changes

  // --- Initial Loading State ---
  // Display a minimal layout with a loading message during the initial authentication check.
  // This prevents layout shifts and ensures header/footer are present early.
  if (authLoading) {
    return (
      <>
        {/* Render Header with sidebar toggle disabled */}
        <Header isSidebarOpen={false} onSidebarToggle={() => {}} />
        {/* Main content area showing loading message */}
        <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: ' calc(100vh - 120px)' }}>
           Initializing Application...
        </main>
        {/* Render Footer */}
        <Footer />
      </>
    );
  }

  // --- Main Render Logic ---
  // Render the full application layout once authentication check is complete.
  return (
    <>
      {/* Render the Header, passing sidebar state and toggle function */}
      <Header
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={toggleSidebar}
      />

      {/* Main layout container using flexbox (defined in AppLayout.css) */}
      <div className="appLayout">
        {/* Overlay shown when sidebar is open (for mobile), clicking it closes the sidebar */}
        {isSidebarOpen && user && (
            <div
                className="sidebarOverlay"
                onClick={() => toggleSidebar(false)}
                aria-hidden="true" // Hide from accessibility tree as it's purely visual
            ></div>
        )}

        {/* Render Sidebar globally if a user is logged in */}
        {/* Pass necessary props: state, close function, tag click handler, current filter */}
        {user && (
           <Sidebar
             isOpen={isSidebarOpen}
             closeSidebar={() => toggleSidebar(false)}
             onTagClick={handleTagClick}
             currentFilterTag={currentFilterTag}
           />
         )}

        {/* Main content area where page components are rendered based on the current route */}
        <main className="mainContent">
          {/* Define application routes using React Router */}
          <Routes>
            {/* --- Public Routes --- */}
            {/* Homepage: Render HomePage if logged in, LandingPage otherwise */}
            <Route
              path="/"
              element={
                  user
                  ? <HomePage
                      currentFilterTag={currentFilterTag} // Pass filter state
                      clearTagFilter={clearTagFilter} // Pass clear function
                    />
                  : <LandingPage />
              }
            />
            {/* Login/Signup: Render only if user is NOT logged in, otherwise redirect to home */}
            <Route
               path="/login"
               element={!user ? <LoginPage /> : <Navigate to="/" replace />}
            />
            <Route
               path="/signup"
               element={!user ? <SignupPage /> : <Navigate to="/" replace />}
            />
            {/* Public Detail Pages & Static Pages */}
            {/* Order matters: More specific paths like /connections/:id should come before broader ones if overlap exists */}
            <Route path="/connections/:connectionId" element={<ConnectionDetailPage />} />
            <Route path="/movies/:movieId" element={<MovieDetailPage />} />
            <Route path="/books/:bookId" element={<BookDetailPage />} />
            <Route path="/users/:userId" element={<ProfilePage />} /> {/* Public profile view */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/updates" element={<UpdatesPage />} />


            {/* --- Protected Routes (Require Login) --- */}
            {/* Wrap page components with the ProtectedRoute component */}
            <Route
               path="/create"
               element={<ProtectedRoute><CreateConnectionPage /></ProtectedRoute>}
            />
            <Route
              path="/profile" // Route for viewing own profile (no ID needed)
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
            <Route
              path="/profile/edit" // Route for editing own profile
              element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>}
            />
            <Route
               path="/notifications"
               element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
            />

            {/* --- Not Found Route (Catch-all) --- */}
            {/* This route matches any path not defined above */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div> {/* End appLayout */}

      {/* Render the Footer */}
      <Footer />
    </>
  );
}

export default App;

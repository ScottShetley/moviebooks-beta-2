// client/src/App.js
import React, { Suspense } from 'react'; // Suspense for lazy loading (optional but good practice)
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // To manage protected routes

// --- Layout Components ---
// Import Header and Footer - These will likely cause errors until created/filled
import Header from './components/Layout/Header/Header';
import Footer from './components/Layout/Footer/Footer';

// --- Common Components ---
// Import LoadingSpinner - Needed for Auth check and potentially lazy loading
import LoadingSpinner from './components/Common/LoadingSpinner/LoadingSpinner';

// --- Page Components ---
// Import pages directly for now. Consider lazy loading later for performance.
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateConnectionPage from './pages/CreateConnectionPage';
import MovieDetailPage from './pages/MovieDetailPage';
import BookDetailPage from './pages/BookDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';

// --- Protected Route Component ---
// Wrapper component to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext

  if (loading) {
    // Show a loading spinner while the auth state is being determined (checking localStorage)
    // You might want a more centered/full-page loading indicator style
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  // If loading is finished and there's no user, redirect to login page
  // 'replace' prevents the login page from being added to history stack
  return user ? children : <Navigate to="/login" replace />;
};

// --- Main App Component ---
function App() {
   // We don't necessarily need the authLoading state directly here anymore
   // as the ProtectedRoute component handles the loading state check.

  return (
    <> {/* Use Fragment to avoid unnecessary div */}
      <Header /> {/* Render the Header on all pages */}

      {/* Main content area with container class for max-width and padding */}
      <main className="container">
        {/* Suspense fallback for lazy loading (if implemented later) */}
        {/* <Suspense fallback={<LoadingSpinner />}> */}
          <Routes> {/* Define application routes */}
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/movies/:movieId" element={<MovieDetailPage />} />
            <Route path="/books/:bookId" element={<BookDetailPage />} />
            {/* Route for viewing other users' profiles */}
            <Route path="/users/:userId" element={<ProfilePage />} />

            {/* Protected Routes (wrapped with ProtectedRoute) */}
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateConnectionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile" // Specific route for the logged-in user's own profile
              element={
                <ProtectedRoute>
                   {/* Render ProfilePage - it can determine if it's the 'own' profile */}
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
             <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Not Found Route - Catches any route not matched above */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        {/* </Suspense> */}
      </main>

      <Footer /> {/* Render the Footer on all pages */}
    </>
  );
}

export default App;
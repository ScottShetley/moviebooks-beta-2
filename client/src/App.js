// client/src/App.js
import React from 'react'; // Removed Suspense for now as it wasn't used
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // To manage protected routes and root view

// --- Layout Components ---
import Header from './components/Layout/Header/Header';
import Footer from './components/Layout/Footer/Footer';

// --- Common Components ---
import LoadingSpinner from './components/Common/LoadingSpinner/LoadingSpinner';

// --- Page Components ---
import HomePage from './pages/HomePage'; // Your main feed/dashboard page for logged-in users
import LandingPage from './pages/LandingPage/LandingPage'; // The NEW landing page for logged-out users
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateConnectionPage from './pages/CreateConnectionPage';
import MovieDetailPage from './pages/MovieDetailPage';
import BookDetailPage from './pages/BookDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
// Add imports for ForgotPasswordPage and ResetPasswordPage if you have them
// import ForgotPasswordPage from './pages/ForgotPasswordPage';
// import ResetPasswordPage from './pages/ResetPasswordPage';


// --- Protected Route Component ---
// Wrapper component to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext

  // Note: We handle the initial app loading state in the App component now.
  // This loading check is still useful if navigating *between* protected routes
  // or if the auth state changes while the app is running.
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};


// --- Main App Component ---
function App() {
  // Get auth state here to determine root page and handle global loading
  const { user, loading } = useAuth();

  // --- Global Loading Check ---
  // Show a spinner for the whole page until the initial authentication check is complete
  if (loading) {
    return (
      <>
        <Header />
        <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: ' calc(100vh - 120px)' /* Adjust based on header/footer height */ }}>
          <LoadingSpinner />
        </main>
        <Footer />
      </>
    );
  }

  // --- Render App Structure ---
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          {/* --- Root Route (Conditional) --- */}
          <Route
            path="/"
            element={user ? <HomePage /> : <LandingPage />} // Show HomePage if logged in, LandingPage if not
          />

          {/* --- Auth Routes --- */}
          {/* Redirect logged-in users away from login/signup */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" replace /> : <SignupPage />}
          />
          {/* Add routes for Forgot/Reset Password if they exist, potentially redirecting logged-in users too */}
          {/* <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} /> */}
          {/* <Route path="/reset-password/:token" element={user ? <Navigate to="/" replace /> : <ResetPasswordPage />} /> */}


          {/* --- Other Public Routes --- */}
          <Route path="/movies/:movieId" element={<MovieDetailPage />} />
          <Route path="/books/:bookId" element={<BookDetailPage />} />
          <Route path="/users/:userId" element={<ProfilePage />} /> {/* Allows viewing profiles when logged out */}


          {/* --- Protected Routes (wrapped with ProtectedRoute) --- */}
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
          {/* Add any other protected routes here */}


          {/* --- Not Found Route --- */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
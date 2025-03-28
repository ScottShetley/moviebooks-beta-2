// client/src/components/Layout/Header/Header.js
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom'; // Use NavLink for active styles
import { useAuth } from '../../../contexts/AuthContext'; // Get user and logout function
import { useNotifications } from '../../../contexts/NotificationContext'; // Get unread count
import styles from './Header.module.css';

const Header = () => {
  const { user, logout } = useAuth(); // Get auth state and logout function
  const { unreadCount } = useNotifications(); // Get unread notification count
  const navigate = useNavigate(); // Hook for programmatic navigation

  const handleLogout = () => {
    logout(); // Call logout function from context
    navigate('/'); // Redirect to homepage after logout
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.navContainer}`}> {/* Combine classes */}
        <div className={styles.logo}>
          <Link to="/">MovieBooks</Link>
        </div>
        <nav>
          <ul className={styles.navLinks}>
            <li>
              {/* Use NavLink for automatic active class styling */}
              <NavLink
                to="/"
                className={({ isActive }) => isActive ? styles.active : ''}
              >
                Feed
              </NavLink>
            </li>

            {user ? (
              // --- Links shown when user IS logged in ---
              <>
                <li>
                  <NavLink
                    to="/create"
                    className={({ isActive }) => isActive ? styles.active : ''}
                  >
                    + Add New
                  </NavLink>
                </li>
                 <li>
                  <NavLink
                    to="/notifications"
                    className={({ isActive }) => `${styles.notificationLink} ${isActive ? styles.active : ''}`} // Combine classes
                  >
                    Notifications
                    {unreadCount > 0 && (
                       <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span> // Show badge if count > 0
                    )}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/profile" // Links to the user's own profile page
                    className={({ isActive }) => isActive ? styles.active : ''}
                  >
                    My Profile
                  </NavLink>
                </li>
                <li>
                  <button onClick={handleLogout}>Logout</button>
                </li>
              </>
            ) : (
              // --- Links shown when user is NOT logged in ---
              <>
                <li>
                  <NavLink
                    to="/login"
                    className={({ isActive }) => isActive ? styles.active : ''}
                  >
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/signup"
                    className={({ isActive }) => isActive ? styles.active : ''}
                  >
                    Sign Up
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
// client/src/components/Layout/Header/Header.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import styles from './Header.module.css';

// Simple hamburger icon component (using spans)
const HamburgerIcon = ({ isOpen }) => (
  <div className={`${styles.hamburgerIcon} ${isOpen ? styles.open : ''}`}>
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const Header = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hamburgerButtonRef = useRef(null); // Ref for the hamburger button

  const handleLogout = () => {
    // Ensure menu closes reliably before logging out and navigating
    if (isMobileMenuOpen) {
        closeMobileMenu(false); // Close without forcing focus back to button (it might unmount)
    }
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    const menuWillOpen = !isMobileMenuOpen; // State before update
    setIsMobileMenuOpen(menuWillOpen);

    // If closing the menu via toggle, shift focus back to the button.
    if (!menuWillOpen) {
        // Schedule focus move after state update and re-render
        setTimeout(() => hamburgerButtonRef.current?.focus(), 0);
    }
    // If opening, focus will be handled manually if needed (e.g., focus first item)
    // For now, we let the user tab naturally.
  };

  const closeMobileMenu = (focusToggle = true) => {
    if (!isMobileMenuOpen) return; // Avoid unnecessary state changes/focus shifts

    setIsMobileMenuOpen(false);
    // Optionally move focus back to the toggle button
    if (focusToggle && hamburgerButtonRef.current) {
         // Schedule focus move after state update and re-render
        setTimeout(() => hamburgerButtonRef.current?.focus(), 0);
    }
  };

  // Effect to close mobile menu if window resizes wider than breakpoint
  useEffect(() => {
    const handleResize = () => {
      const breakpoint = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-md'), 10);
      if (window.innerWidth > breakpoint && isMobileMenuOpen) {
        closeMobileMenu(false); // Don't shift focus on resize close
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]); // Depend on isMobileMenuOpen

  // Effect to add/remove body class to prevent scrolling
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add(styles.noScroll);
    } else {
      document.body.classList.remove(styles.noScroll);
    }
    // Cleanup function
    return () => document.body.classList.remove(styles.noScroll);
  }, [isMobileMenuOpen]); // Depend on isMobileMenuOpen


  // Common NavLink className function
  const getNavLinkClass = ({ isActive }) => isActive ? styles.active : '';
  const getMobileNavLinkClass = ({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.active : ''}`;

  // Wrapper function for mobile link clicks to ensure menu closes
  const handleMobileLinkClick = (focusToggle = true) => {
      closeMobileMenu(focusToggle);
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.navContainer}`}>
        <div className={styles.logo}>
          <Link to="/" onClick={() => handleMobileLinkClick(false)}>MovieBooks</Link>
        </div>

        {/* Hamburger Button */}
        <button
          ref={hamburgerButtonRef}
          className={styles.hamburgerButton}
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-links"
        >
          <HamburgerIcon isOpen={isMobileMenuOpen} />
        </button>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <ul className={styles.navLinks}>
            {/* Desktop links */}
            <li><NavLink to="/" className={getNavLinkClass}>Feed</NavLink></li>
            {user ? (
              <>
                <li><NavLink to="/create" className={getNavLinkClass}>+ Add New</NavLink></li>
                <li>
                  <NavLink to="/notifications" className={({isActive}) => `${styles.notificationLink} ${isActive ? styles.active : ''}`}>
                    Notifications
                    {unreadCount > 0 && (<span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>)}
                  </NavLink>
                </li>
                <li><NavLink to="/profile" className={getNavLinkClass}>My Profile</NavLink></li>
                <li><button onClick={handleLogout} className={styles.logoutButton}>Logout</button></li>
              </>
            ) : (
              <>
                <li><NavLink to="/login" className={getNavLinkClass}>Login</NavLink></li>
                <li><NavLink to="/signup" className={getNavLinkClass}>Sign Up</NavLink></li>
              </>
            )}
          </ul>
        </nav>

        {/* Mobile Navigation (Overlay) */}
        <nav
          className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}
          aria-label="Mobile navigation"
          // Use boolean directly for inert attribute - simpler
          inert={!isMobileMenuOpen || undefined} // Add inert attribute when menu is NOT open
        >
           <div className={styles.mobileNavOverlay} onClick={() => handleMobileLinkClick(true)}></div>
           <div className={styles.mobileNavContent}>
              <ul className={styles.mobileNavLinks} id="mobile-nav-links">
                  {/* Mobile links */}
                  <li><NavLink to="/" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>Feed</NavLink></li>
                  {user ? (
                      <>
                          <li><NavLink to="/create" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>+ Add New</NavLink></li>
                          <li>
                              <NavLink to="/notifications" className={({isActive}) => `${styles.notificationLink} ${styles.mobileNavLink} ${isActive ? styles.active : ''}`} onClick={() => handleMobileLinkClick(true)}>
                                  Notifications
                                  {unreadCount > 0 && (<span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>)}
                              </NavLink>
                          </li>
                          <li><NavLink to="/profile" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>My Profile</NavLink></li>
                          <li><button onClick={handleLogout} className={`${styles.mobileNavLink} ${styles.logoutButton}`}>Logout</button></li> {/* handleLogout now closes menu */}
                      </>
                  ) : (
                      <>
                          <li><NavLink to="/login" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>Login</NavLink></li>
                          <li><NavLink to="/signup" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>Sign Up</NavLink></li>
                      </>
                  )}
              </ul>
           </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
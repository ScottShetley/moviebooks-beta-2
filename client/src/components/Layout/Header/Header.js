// client/src/components/Layout/Header/Header.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import styles from './Header.module.css';

// HamburgerIcon Component (Corrected)
const HamburgerIcon = ({ isOpen }) => (
  <div className={`${styles.hamburgerIcon} ${isOpen ? styles.open : ''}`}>
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const Header = ({ onSidebarToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hamburgerButtonRef = useRef(null);

  // Wrap closeMobileMenu in useCallback
  const closeMobileMenu = useCallback((focusToggle = true) => {
    setIsMobileMenuOpen(currentIsOpen => {
        if (!currentIsOpen) return false;
        if (focusToggle && hamburgerButtonRef.current) {
            setTimeout(() => hamburgerButtonRef.current?.focus(), 0);
        }
        return false;
    });
  }, []);

  const handleLogout = () => {
    if (isMobileMenuOpen) {
        closeMobileMenu(false);
    }
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    const menuWillOpen = !isMobileMenuOpen;
    setIsMobileMenuOpen(menuWillOpen);
    if (!menuWillOpen) {
        setTimeout(() => hamburgerButtonRef.current?.focus(), 0);
    }
  };


  // Effect for resize cleanup
  useEffect(() => {
        const handleResize = () => {
            const breakpoint = 768;
            if (window.innerWidth > breakpoint) {
                closeMobileMenu(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
   }, [closeMobileMenu]);


  const getNavLinkClass = ({ isActive }) => isActive ? styles.active : '';
  const getMobileNavLinkClass = ({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.active : ''}`;
  const handleMobileLinkClick = (focusToggle = true) => { closeMobileMenu(focusToggle); };

  return (
     <header className={styles.header}>
      <div className={`container ${styles.navContainer}`}>
        <button className={styles.sidebarToggleButton} onClick={onSidebarToggle} aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"} aria-expanded={isSidebarOpen} aria-controls="app-sidebar">
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className={styles.logo}>
             <Link to="/updates" onClick={() => handleMobileLinkClick(false)}>MovieBooks</Link>
        </div>
        <button ref={hamburgerButtonRef} className={styles.hamburgerButton} onClick={toggleMobileMenu} aria-label={isMobileMenuOpen ? "Close main menu" : "Open main menu"} aria-expanded={isMobileMenuOpen} aria-controls="mobile-nav-links">
            <HamburgerIcon isOpen={isMobileMenuOpen} />
        </button>
        <nav className={styles.desktopNav} aria-label="Main navigation">
             <ul className={styles.navLinks}><li><NavLink to="/" className={getNavLinkClass}>Feed</NavLink></li>{user ? (<><li><NavLink to="/create" className={getNavLinkClass}>+ Add New</NavLink></li><li><NavLink to="/notifications" className={({isActive}) => `${styles.notificationLink} ${isActive ? styles.active : ''}`}> Notifications {unreadCount > 0 && (<span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>)} </NavLink></li><li><NavLink to="/profile" className={getNavLinkClass}>My Profile</NavLink></li><li><button onClick={handleLogout} className={styles.logoutButton}>Logout</button></li></>) : (<><li><NavLink to="/login" className={getNavLinkClass}>Login</NavLink></li><li><NavLink to="/signup" className={getNavLinkClass}>Sign Up</NavLink></li></>)}</ul>
        </nav>
         {/* *** MODIFIED inert attribute below *** */}
        <nav className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`} aria-label="Mobile navigation" inert={!isMobileMenuOpen ? "true" : undefined}>
           <div className={styles.mobileNavOverlay} onClick={() => handleMobileLinkClick(true)}></div><div className={styles.mobileNavContent}><ul className={styles.mobileNavLinks} id="mobile-nav-links"><li><NavLink to="/" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>Feed</NavLink></li>{user ? (<><li><NavLink to="/create" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>+ Add New</NavLink></li><li><NavLink to="/notifications" className={({isActive}) => `${styles.notificationLink} ${styles.mobileNavLink} ${isActive ? styles.active : ''}`} onClick={() => handleMobileLinkClick(true)}> Notifications {unreadCount > 0 && (<span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>)} </NavLink></li><li><NavLink to="/profile" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>My Profile</NavLink></li><li><button onClick={handleLogout} className={`${styles.mobileNavLink} ${styles.logoutButton}`}>Logout</button></li></>) : (<><li><NavLink to="/login" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>Login</NavLink></li><li><NavLink to="/signup" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>Sign Up</NavLink></li></>)}</ul></div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
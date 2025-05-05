// client/src/components/Layout/Header/Header.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import styles from './Header.module.css';

// HamburgerIcon Component
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
  const [searchTerm, setSearchTerm] = useState('');
  const hamburgerButtonRef = useRef(null);
  const searchInputRef = useRef(null); // Ref for search input

  // Wrap closeMobileMenu in useCallback
  const closeMobileMenu = useCallback((focusToggle = true) => {
    setIsMobileMenuOpen(currentIsOpen => {
        if (!currentIsOpen) return false;
        // Delay focus slightly to allow menu to close completely
        if (focusToggle && hamburgerButtonRef.current) {
            setTimeout(() => hamburgerButtonRef.current?.focus(), 50);
        }
        return false;
    });
  }, []); // Dependency array is empty as it doesn't depend on props or state inside the effect/callback itself

  // Handle logout, close mobile menu first if open
  const handleLogout = () => {
    if (isMobileMenuOpen) {
        closeMobileMenu(false); // Don't focus toggle button after logout
    }
    logout();
    navigate('/'); // Redirect to home after logout
  };

  // Toggle main mobile menu
  const toggleMobileMenu = () => {
    const menuWillOpen = !isMobileMenuOpen;
    setIsMobileMenuOpen(menuWillOpen);
    if (!menuWillOpen) {
        // Delay focus slightly to allow menu to close completely
        setTimeout(() => hamburgerButtonRef.current?.focus(), 50);
    } else {
         // Optional: Focus the search input when the mobile menu opens
         // setTimeout(() => searchInputRef.current?.focus(), 350); // Adjust delay if needed
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
      e.preventDefault();
      const trimmedSearchTerm = searchTerm.trim();
      if (trimmedSearchTerm) {
          // Navigate to the search results page with the query
          navigate(`/search?q=${encodeURIComponent(trimmedSearchTerm)}`);
          // Clear the search input field after submitting
          setSearchTerm('');
          // Close the mobile menu if it's open
          if (isMobileMenuOpen) {
              // Delay closing slightly if search input was focused, for smoother UX
              setTimeout(() => closeMobileMenu(true), 100); // Adjust delay if needed
          }
           // Optional: blur search input if focused
           searchInputRef.current?.blur();
      }
  };

  // Effect for resize cleanup
  useEffect(() => {
        const handleResize = () => {
            const breakpoint = 768; // Matches mobile breakpoint
            if (window.innerWidth > breakpoint && isMobileMenuOpen) {
                closeMobileMenu(false); // Close menu if window is resized above mobile breakpoint while menu is open
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
   }, [closeMobileMenu, isMobileMenuOpen]); // Added isMobileMenuOpen as dependency

   // Effect to manage body scroll lock when mobile menu is open
   useEffect(() => {
       if (isMobileMenuOpen) {
           // Add a class to the body to prevent scrolling
           document.body.classList.add('noScroll');
       } else {
            // Remove the class
           document.body.classList.remove('noScroll');
       }
       // Cleanup function to remove the class if the component unmounts while menu is open
       return () => {
           document.body.classList.remove('noScroll');
       };
   }, [isMobileMenuOpen]); // This effect should re-run when isMobileMenuOpen changes


  // Helper functions for NavLink class names
  const getNavLinkClass = ({ isActive }) => isActive ? styles.active : '';
  const getMobileNavLinkClass = ({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.active : ''}`;

  // Helper for mobile link clicks that also closes the menu
  const handleMobileLinkClick = useCallback((focusToggle = true) => {
       closeMobileMenu(focusToggle);
   }, [closeMobileMenu]); // Added closeMobileMenu as dependency


  return (
     <header className={styles.header}>
      <div className={`container ${styles.navContainer}`}>
        {/* Sidebar Toggle Button (only visible >= 992px) */}
        {user && ( // Only show sidebar toggle if logged in
             <button className={styles.sidebarToggleButton} onClick={onSidebarToggle} aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"} aria-expanded={isSidebarOpen} aria-controls="app-sidebar">
                 {isSidebarOpen ? <FaTimes /> : <FaBars />}
             </button>
         )}

        <div className={styles.logo}>
             {/* Logo links to the Updates page */}
             {/* Use handleMobileLinkClick for the onClick handler */}
             <Link to="/updates" onClick={() => handleMobileLinkClick(false)} aria-label="Movie-Books Updates">Movie-Books</Link>
        </div>

         {/* Main Nav Hamburger Button (only visible <= 768px) */}
        <button ref={hamburgerButtonRef} className={styles.hamburgerButton} onClick={toggleMobileMenu} aria-label={isMobileMenuOpen ? "Close main menu" : "Open main menu"} aria-expanded={isMobileMenuOpen} aria-controls="mobile-nav-links">
            <HamburgerIcon isOpen={isMobileMenuOpen} />
        </button>

        {/* --- Desktop Navigation --- */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
             <ul className={styles.navLinks}>
                {/* Search Form - Desktop */}
                 <li className={styles.searchFormContainer}>
                     <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
                         <input
                             ref={searchInputRef} // Attach ref
                             type="text"
                             placeholder="Search connections..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className={styles.searchInput}
                             aria-label="Search connections"
                         />
                         <button type="submit" className={styles.searchButton} aria-label="Submit search">
                             <FaSearch />
                         </button>
                     </form>
                 </li>
                 {/* Desktop Nav Links */}
                 {/* Use NavLink for feed link to get active styling */}
                 <li><NavLink to="/" className={getNavLinkClass}>Feed</NavLink></li>
                 {user ? (
                     <>
                         <li><NavLink to="/create" className={getNavLinkClass}>+ Add New</NavLink></li>
                         <li>
                             <NavLink to="/notifications" className={({isActive}) => `${styles.notificationLink} ${isActive ? styles.active : ''}`}>
                                 Notifications
                                 {/* Check unreadCount before rendering badge */}
                                 {unreadCount > 0 && (
                                     <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                                 )}
                             </NavLink>
                         </li>
                         {/* Desktop Profile Link - UPDATED */}
                         <li><NavLink to={user ? `/users/${user._id}` : '#'} className={getNavLinkClass}>My Profile</NavLink></li>
                         {/* Desktop Logout Button */}
                         <li><button onClick={handleLogout} className={styles.logoutButton}>Logout</button></li>
                     </>
                 ) : (
                     <>
                         {/* Desktop Login/Signup Links */}
                         <li><NavLink to="/login" className={getNavLinkClass}>Login</NavLink></li>
                         <li><NavLink to="/signup" className={getNavLinkClass}>Sign Up</NavLink></li>
                     </>
                 )}
                 {/* Removed: About, Help, Updates links from desktop main nav */}
             </ul>
        </nav>

         {/* *** Mobile Navigation (Main Nav) *** */}
         {/* Added role="dialog" and aria-modal="true" for accessibility */}
         {/* inert attribute is removed when mobile menu is open */}
        <nav
            className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}
            aria-label="Mobile navigation"
            inert={!isMobileMenuOpen ? "true" : undefined}
            role={isMobileMenuOpen ? "dialog" : undefined}
            aria-modal={isMobileMenuOpen ? "true" : undefined}
        >
           {/* Overlay to close mobile menu */}
           <div className={styles.mobileNavOverlay} onClick={() => handleMobileLinkClick(true)} aria-label="Close menu"></div>
           {/* Mobile menu content */}
           <div className={styles.mobileNavContent}>
                {/* Search Form - Mobile */}
                 <div className={styles.searchFormContainerMobile}>
                     <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
                         <input
                             type="text"
                             placeholder="Search connections..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className={styles.searchInput}
                             aria-label="Search connections"
                         />
                          <button type="submit" className={styles.searchButton} aria-label="Submit search">
                             <FaSearch />
                         </button>
                     </form>
                 </div>
                <ul className={styles.mobileNavLinks} id="mobile-nav-links">
                    {/* Mobile Nav Links */}
                    {/* Use NavLink here for active class styling */}
                    {/* Ensure handleMobileLinkClick is used for onClick */}
                    <li><NavLink to="/" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>Feed</NavLink></li>
                    {user ? (
                        <>
                            <li><NavLink to="/create" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>+ Add New</NavLink></li>
                            <li>
                                <NavLink
                                    to="/notifications"
                                    className={({isActive}) => `${styles.notificationLink} ${styles.mobileNavLink} ${isActive ? styles.active : ''}`}
                                    onClick={() => handleMobileLinkClick(true)}
                                >
                                    Notifications
                                    {/* Check unreadCount before rendering badge */}
                                    {unreadCount > 0 && (
                                        <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                                    )}
                                </NavLink>
                            </li>
                             {/* Mobile Profile Link - UPDATED */}
                            <li><NavLink to={user ? `/users/${user._id}` : '#'} className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>My Profile</NavLink></li>
                             {/* Mobile Logout Button */}
                            <li><button onClick={handleLogout} className={`${styles.mobileNavLink} ${styles.logoutButton}`}>Logout</button></li>
                        </>
                    ) : (
                        <>
                            {/* Mobile Login/Signup Links */}
                            <li><NavLink to="/login" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>Login</NavLink></li>
                            <li><NavLink to="/signup" className={getMobileNavLinkClass} onClick={() => handleMobileLinkClick(true)}>Sign Up</NavLink></li>
                        </>
                    )}
                    {/* Removed: About, Help, Updates links from mobile main nav */}
                </ul>
            </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
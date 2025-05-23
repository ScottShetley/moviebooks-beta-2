// client/src/components/Sidebar/Sidebar.js
import React, { useState, useEffect } from 'react';
// *** Link and NavLink are both needed ***
import { Link, NavLink } from 'react-router-dom';
import {
    FaUserCircle, FaRegListAlt, FaRegStar, FaInfoCircle, FaQuestionCircle, FaTags,
    FaChevronDown, FaChevronUp, FaUsers // <-- NEW: Import FaUsers icon
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner';
// CORRECTED THIS IMPORT PATH: From '../components/Common/ErrorMessage/ErrorMessage' to '../Common/ErrorMessage/ErrorMessage'
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage';
import styles from './Sidebar.module.css';

// PopularTagsList component (no changes needed)
const PopularTagsList = ({ tags, onTagClick, currentFilterTag }) => {
    if (!tags || tags.length === 0) {
        return <p className={styles.noTags}>No popular tags found yet.</p>;
    }
    return (
        <ul className={styles.tagList}>
            {tags.map(({ tag, count }) => {
                const isActive = currentFilterTag && currentFilterTag.toLowerCase() === tag.toLowerCase();
                return (
                    <li key={tag}>
                        <button
                            onClick={() => onTagClick(tag)}
                            className={`${styles.tagButton} ${isActive ? styles.activeTag : ''}`}
                            title={`Filter by tag: ${tag} (${count} connections)`}
                            aria-pressed={isActive}
                        >
                             # {tag}
                            <span className={styles.tagCount}>{count}</span>
                        </button>
                    </li>
                );
             })}
        </ul>
    );
};


// Main Sidebar component updated with corrected links and new Users link
const Sidebar = ({ className, onTagClick, currentFilterTag, isOpen, closeSidebar }) => {
    const { user } = useAuth();
    const sidebarClasses = `${styles.sidebar} ${className || ''} ${isOpen ? styles.sidebarOpen : ''}`;

    // State for popular tags data
    const [popularTags, setPopularTags] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagsError, setTagsError] = useState(null);

    // State for controlling tags section visibility
    const [isTagsExpanded, setIsTagsExpanded] = useState(true);

    // Define NavLink active style logic
    const getNavLinkClass = ({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

    // Fetch tags logic (no changes)
    useEffect(() => {
        const fetchTags = async () => {
            setTagsLoading(true);
            setTagsError(null);
            try {
                console.log("Sidebar: Attempting to fetch popular tags...");
                const { data } = await api.get('/connections/popular-tags');
                console.log("Sidebar: Received popular tags data:", data);
                setPopularTags(data || []);
            } catch (err) {
                console.error("Sidebar: Error fetching popular tags:", err);
                setTagsError("Could not load tags.");
                setPopularTags([]);
            } finally {
                setTagsLoading(false);
            }
        };

        fetchTags();
    }, []);

    // Wrapper for ALL link clicks to close sidebar
    const handleLinkClick = () => {
        if (isOpen && typeof closeSidebar === 'function') {
            closeSidebar();
        }
    };

    // Function to toggle the tags section
    const toggleTagsSection = () => {
        setIsTagsExpanded(prev => !prev);
    };

    // Keyboard handler for collapsible title accessibility
    const handleTagsToggleKeyDown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleTagsSection();
      }
    };

    // Prevent clicks inside sidebar content from closing sidebar via overlay
    const handleSidebarClick = (e) => {
        e.stopPropagation();
    };


    return (
        <aside
            id="app-sidebar"
            className={sidebarClasses}
            onClick={handleSidebarClick} // Handles clicks within sidebar content
        >
            {user && (
                <>
                    {/* User Profile Section */}
                    <div className={styles.sidebarSection}>
                        {/* Link to the user's own profile /users/:userId */}
                        <Link to={user ? `/users/${user._id}` : '#'} className={styles.profileLink} onClick={handleLinkClick}>
                            <FaUserCircle size={24} className={styles.icon} />
                            <span className={styles.username}>{user.username}</span>
                        </Link>
                    </div>

                    {/* Your Content Section */}
                    <div className={styles.sidebarSection}>
                        <h3 className={styles.sectionTitle}>Your Content</h3>
                        <ul className={styles.navList}>
                            <li>
                                {/* My Connections NavLink - Links to the base profile page */}
                                <NavLink to={user ? `/users/${user._id}` : '#'} className={getNavLinkClass} onClick={handleLinkClick} end>
                                    <FaRegListAlt className={styles.icon} /> My Connections
                                </NavLink>
                            </li>
                            <li>
                                {/* My Favorites Link - Links to the profile page with #favorites hash */}
                                {/* Use basic styles.navLink because the path is the same, only the hash differs */}
                                <Link to={user ? `/users/${user._id}#favorites` : '#'} className={styles.navLink} onClick={handleLinkClick}>
                                    <FaRegStar className={styles.icon} /> My Favorites
                                </Link>
                            </li>
                        </ul>
                    </div>
                </>
            )}

            {/* Discovery Section (Popular Tags & Users List) */}
            <div className={styles.sidebarSection}>
                 {/* --- NEW: Link to All Public Users Page --- */}
                 {/* Placed outside the collapsible tags for visibility */}
                 <ul className={styles.navList}> {/* Use navList style for consistency */}
                    <li>
                       {/* Use NavLink for active styling */}
                       {/* This link is public, no user check needed */}
                       <NavLink to="/all-users" className={getNavLinkClass} onClick={handleLinkClick}>
                           <FaUsers className={styles.icon} /> All Public Users
                       </NavLink>
                    </li>
                 </ul>
                 {/* --- END NEW --- */}

                 <h3
                    className={styles.collapsibleTitle}
                    onClick={toggleTagsSection}
                    onKeyDown={handleTagsToggleKeyDown}
                    role="button"
                    aria-expanded={isTagsExpanded}
                    aria-controls="popular-tags-content"
                    tabIndex="0"
                 >
                    <span className={styles.collapsibleTitleText}>
                        <FaTags className={styles.titleIcon} /> Popular Tags
                    </span>
                    {isTagsExpanded
                        ? <FaChevronUp className={styles.collapseIcon} aria-hidden="true" />
                        : <FaChevronDown className={styles.collapseIcon} aria-hidden="true" />
                    }
                </h3>
                 <div id="popular-tags-content">
                    {isTagsExpanded && (
                        <>
                            {tagsLoading && <div className={styles.tagsLoading}><LoadingSpinner size="small" /></div>}
                            {tagsError && <ErrorMessage message={tagsError} variant="inline" />}
                            {!tagsLoading && !tagsError && (
                                <PopularTagsList
                                    tags={popularTags}
                                    onTagClick={onTagClick}
                                    currentFilterTag={currentFilterTag}
                                />
                            )}
                        </>
                    )}
                 </div>
            </div>

            {/* Site Section */}
            <div className={`${styles.sidebarSection} ${styles.siteSection}`}>
                <ul className={styles.navList}>
                     {/* Home Link (often implicit on logo/site title, but explicit link can be good) */}
                     {/* Added back a Home link for clarity */}
                     <li>
                         <NavLink to="/" className={getNavLinkClass} onClick={handleLinkClick} end> {/* Use 'end' for exact match on "/" */}
                             🏠 Home
                         </NavLink>
                     </li>
                    <li>
                        {/* About remains NavLink */}
                        <NavLink to="/about" className={getNavLinkClass} onClick={handleLinkClick}>
                            <FaInfoCircle className={styles.icon} /> About
                        </NavLink>
                    </li>
                    <li>
                        {/* Help remains NavLink */}
                        <NavLink to="/help" className={getNavLinkClass} onClick={handleLinkClick}>
                            <FaQuestionCircle className={styles.icon} /> Help / FAQ
                        </NavLink>
                    </li>
                    {/* Add other static links like Updates page here if desired */}
                     <li>
                         <NavLink to="/updates" className={getNavLinkClass} onClick={handleLinkClick}>
                             ✨ Updates
                         </NavLink>
                     </li>
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;
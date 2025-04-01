// client/src/components/Sidebar/Sidebar.js
import React, { useState, useEffect } from 'react';
// *** Import Link alongside NavLink ***
import { Link, NavLink } from 'react-router-dom';
import { FaUserCircle, FaRegListAlt, FaRegStar, FaInfoCircle, FaQuestionCircle, FaTags } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api'; // Import the api instance
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner'; // Import spinner
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage'; // Import error message
import styles from './Sidebar.module.css';

// PopularTagsList component (no changes)
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
                            onClick={() => onTagClick(tag)} // Ensure onTagClick handles the tag value
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


// Main Sidebar component updated
const Sidebar = ({ className, onTagClick, currentFilterTag, isOpen, closeSidebar }) => {
    const { user } = useAuth();
    const sidebarClasses = `${styles.sidebar} ${className || ''} ${isOpen ? styles.sidebarOpen : ''}`;

    // State for popular tags
    const [popularTags, setPopularTags] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagsError, setTagsError] = useState(null);

    // Define NavLink active style logic (still needed for About/Help)
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


    // Wrapper for ALL link clicks (Link or NavLink) inside sidebar to close it
    const handleLinkClick = () => {
        if (isOpen && typeof closeSidebar === 'function') { // Check if closeSidebar is a function
            closeSidebar();
        }
    };

    return (
        <aside id="app-sidebar" className={sidebarClasses}>
            {user && (
                <>
                    {/* User Profile Section */}
                    <div className={styles.sidebarSection}>
                        {/* Use Link and apply base style, trigger close */}
                        <Link to="/profile" className={styles.profileLink} onClick={handleLinkClick}>
                            <FaUserCircle size={24} className={styles.icon} />
                            <span className={styles.username}>{user.username}</span>
                        </Link>
                    </div>

                    {/* Your Content Section */}
                    <div className={styles.sidebarSection}>
                        <h3 className={styles.sectionTitle}>Your Content</h3>
                        <ul className={styles.navList}>
                            <li>
                                {/* *** CHANGED NavLink to Link *** */}
                                {/* Removed getNavLinkClass/end, added base style, use handleLinkClick */}
                                <Link to="/profile" className={styles.navLink} onClick={handleLinkClick}>
                                    <FaRegListAlt className={styles.icon} /> My Connections
                                </Link>
                            </li>
                            <li>
                                {/* *** CHANGED NavLink to Link *** */}
                                {/* Removed getNavLinkClass, added base style, use handleLinkClick */}
                                <Link to="/profile" className={styles.navLink} onClick={handleLinkClick}>
                                    <FaRegStar className={styles.icon} /> My Favorites
                                </Link>
                            </li>
                        </ul>
                    </div>
                </>
            )}

            {/* Discovery Section (Popular Tags) */}
            <div className={styles.sidebarSection}>
                <h3 className={styles.sectionTitle}>
                    <FaTags className={styles.titleIcon} /> Popular Tags
                </h3>
                {tagsLoading && <div className={styles.tagsLoading}><LoadingSpinner size="small" /></div>}
                {tagsError && <ErrorMessage message={tagsError} variant="inline" />}
                {!tagsLoading && !tagsError && (
                    <PopularTagsList
                        tags={popularTags}
                        onTagClick={onTagClick} // Pass prop directly
                        currentFilterTag={currentFilterTag}
                    />
                )}
            </div>

            {/* Site Section */}
            <div className={`${styles.sidebarSection} ${styles.siteSection}`}>
                <ul className={styles.navList}>
                    <li>
                        {/* Keep NavLink for About/Help if active state is desired */}
                        <NavLink to="/about" className={getNavLinkClass} onClick={handleLinkClick}>
                            <FaInfoCircle className={styles.icon} /> About
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/help" className={getNavLinkClass} onClick={handleLinkClick}>
                            <FaQuestionCircle className={styles.icon} /> Help / FAQ
                        </NavLink>
                    </li>
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;
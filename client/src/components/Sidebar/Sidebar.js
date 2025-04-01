// client/src/components/Sidebar/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaUserCircle, FaRegListAlt, FaRegStar, FaInfoCircle, FaQuestionCircle, FaTags } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api'; // Import the api instance
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner'; // Import spinner
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage'; // Import error message
import styles from './Sidebar.module.css';

// PopularTagsList component remains the same
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


// Main Sidebar component updated
const Sidebar = ({ className, onTagClick, currentFilterTag, isOpen, closeSidebar }) => { // Accept isOpen and closeSidebar
    const { user } = useAuth();
    const sidebarClasses = `${styles.sidebar} ${className || ''} ${isOpen ? styles.sidebarOpen : ''}`;

    // State for popular tags
    const [popularTags, setPopularTags] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagsError, setTagsError] = useState(null);

    // Define NavLink active style logic
    const getNavLinkClass = ({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

    // *** THIS IS THE CORRECT useEffect for fetching tags ***
    useEffect(() => {
        const fetchTags = async () => {
            setTagsLoading(true);
            setTagsError(null);
            try {
                console.log("Sidebar: Attempting to fetch popular tags..."); // Debug log
                const { data } = await api.get('/connections/popular-tags');
                console.log("Sidebar: Received popular tags data:", data); // Debug log
                setPopularTags(data || []); // Expecting an array like [{ tag: '...', count: ... }]
            } catch (err) {
                console.error("Sidebar: Error fetching popular tags:", err);
                setTagsError("Could not load tags.");
                setPopularTags([]); // Clear tags on error
            } finally {
                setTagsLoading(false);
            }
        };

        fetchTags(); // Actually call the function
    }, []); // Empty dependency array means run once on mount


    // Wrapper for NavLink clicks to close sidebar
    const handleNavLinkClick = (e) => {
        if (isOpen) {
            closeSidebar();
        }
    };

    return (
        <aside id="app-sidebar" className={sidebarClasses}>
            {user && (
                <>
                    {/* User Profile Section */}
                    <div className={styles.sidebarSection}>
                        <Link to="/profile" className={styles.profileLink} onClick={handleNavLinkClick}>
                            <FaUserCircle size={24} className={styles.icon} />
                            <span className={styles.username}>{user.username}</span>
                        </Link>
                    </div>

                    {/* Your Content Section */}
                    <div className={styles.sidebarSection}>
                        <h3 className={styles.sectionTitle}>Your Content</h3>
                        <ul className={styles.navList}>
                            <li>
                                <NavLink to="/profile" end className={getNavLinkClass} onClick={handleNavLinkClick}>
                                    <FaRegListAlt className={styles.icon} /> My Connections
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/profile" className={getNavLinkClass} onClick={handleNavLinkClick}>
                                    <FaRegStar className={styles.icon} /> My Favorites
                                </NavLink>
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
                        onTagClick={onTagClick}
                        currentFilterTag={currentFilterTag}
                    />
                )}
            </div>

            {/* Site Section */}
            <div className={`${styles.sidebarSection} ${styles.siteSection}`}>
                <ul className={styles.navList}>
                    <li>
                        <NavLink to="/about" className={getNavLinkClass} onClick={handleNavLinkClick}>
                            <FaInfoCircle className={styles.icon} /> About
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/help" className={getNavLinkClass} onClick={handleNavLinkClick}>
                            <FaQuestionCircle className={styles.icon} /> Help / FAQ
                        </NavLink>
                    </li>
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;
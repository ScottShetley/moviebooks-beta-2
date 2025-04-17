// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Link is now used
// Import custom hook for authentication context
import { useAuth } from '../contexts/AuthContext';
// Import API functions and helpers
import {
  getPublicUserProfile,
  getUserConnections,
  getConnectionsByIds,
  getStaticFileUrl,
} from '../services/api';
// Import reusable UI components
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
// Import page-specific styles
import styles from './ProfilePage.module.css';
// Import default avatar image
import defaultAvatar from '../assets/images/default-avatar.png';

/**
 * Renders a user's profile page.
 * Displays profile information (avatar, name, bio, etc.) and lists of connections
 * created by the user and/or favorited by the logged-in user (if viewing own profile).
 */
const ProfilePage = () => {
  // --- Hooks ---
  // Get 'userId' from URL parameters, if present (viewing someone else's profile)
  const { userId: paramsUserId } = useParams();
  // Get logged-in user state and auth loading status from AuthContext
  const { user: loggedInUser, loading: authLoading } = useAuth();
  // Get navigation function from React Router
  const navigate = useNavigate();

  // --- Determine Profile to View ---
  // Use the userId from URL params if available, otherwise default to the logged-in user's ID
  const userIdToView = paramsUserId || loggedInUser?._id;
  // Determine if the profile being viewed belongs to the currently logged-in user
  const isOwnProfile = loggedInUser && userIdToView === loggedInUser._id;

  // --- State Variables ---
  // Profile Information
  const [profileData, setProfileData] = useState(null); // Holds fetched profile details
  const [pageLoading, setPageLoading] = useState(true); // Loading state for initial profile/created connections fetch
  const [pageError, setPageError] = useState(null); // Error state for initial fetch

  // Created Connections List
  const [createdConnections, setCreatedConnections] = useState([]); // Array of connections created by the user
  // Removed unused loadingCreated and errorCreated states

  // Favorite Connections List (Only relevant for own profile)
  const [favoriteConnections, setFavoriteConnections] = useState([]); // Array of favorited connections
  const [loadingFavorites, setLoadingFavorites] = useState(false); // Loading state for favorites fetch
  const [errorFavorites, setErrorFavorites] = useState(null); // Error state for favorites fetch
  const [favoritesFetched, setFavoritesFetched] = useState(false); // Flag to prevent re-fetching favorites unnecessarily

  // View Toggle State (Only for own profile)
  const [activeView, setActiveView] = useState('created'); // Tracks which list ('created' or 'favorites') is active

  // --- State Update Callbacks (for ConnectionCard) ---
  /**
   * Updates a connection in both the 'created' and 'favorites' lists if it exists there.
   * Passed down to ConnectionCard components.
   * @param {object} updatedConnection - The updated connection object.
   */
  const updateConnectionInLists = useCallback((updatedConnection) => {
    const updater = (prev) => prev.map(conn => conn._id === updatedConnection._id ? updatedConnection : conn);
    setCreatedConnections(updater);
    setFavoriteConnections(updater); // Update favorites list as well
  }, []); // Empty dependency array

  /**
   * Removes a connection from both the 'created' and 'favorites' lists.
   * Passed down to ConnectionCard components.
   * @param {string} deletedConnectionId - The ID of the connection to remove.
   */
  const deleteConnectionFromLists = useCallback((deletedConnectionId) => {
    const filterer = (prev) => prev.filter(conn => conn._id !== deletedConnectionId);
    setCreatedConnections(filterer);
    setFavoriteConnections(filterer); // Remove from favorites list as well
  }, []); // Empty dependency array

  // --- Effect: Fetch Initial Profile Data & Created Connections ---
  /**
   * Fetches the public profile information and the list of connections created by the user.
   * Runs when the component mounts or when the user being viewed changes.
   */
  useEffect(() => {
    // Exit early if we don't have a user ID to view yet, or if it's own profile and auth is still loading
    if (!userIdToView || (isOwnProfile && authLoading)) {
      setPageLoading(isOwnProfile && authLoading); // Reflect auth loading state if viewing own profile
      // Set specific error if trying to view own profile but not logged in (after auth check)
      if (!paramsUserId && !authLoading && !loggedInUser) {
        setPageError("Please log in to view your profile.");
      }
      return; // Don't proceed with fetching
    }

    const fetchInitialData = async () => {
      // Reset all relevant states before fetching
      setPageLoading(true);
      setPageError(null);
      setProfileData(null);
      setCreatedConnections([]);
      // Removed setErrorCreated(null)
      setActiveView('created'); // Default to 'created' view
      setFavoritesFetched(false); // Reset favorites fetched flag
      setFavoriteConnections([]); // Clear favorites list
      setErrorFavorites(null); // Reset favorites error

      try {
        // Fetch profile details and created connections concurrently
        const [profileRes, connectionsRes] = await Promise.all([
          getPublicUserProfile(userIdToView),
          getUserConnections(userIdToView) // Fetches connections created by this user
        ]);
        // Update state with fetched data
        setProfileData(profileRes.data);
        setCreatedConnections(connectionsRes.data || []); // Ensure it's an array
      } catch (err) {
        // Handle errors during the initial fetch
        const message = err.response?.data?.message || err.message || "Failed to load profile data.";
        console.error("[ProfilePage Fetch] Error:", err); // Keep error log
        // Set specific error message for 404 (User not found)
        if (err.response?.status === 404) {
          setPageError("User not found.");
        } else {
          setPageError(`Error loading profile: ${message}`);
        }
        // Clear data on error
        setProfileData(null);
        setCreatedConnections([]);
      } finally {
        // Ensure loading state is turned off
        setPageLoading(false);
        // Removed setLoadingCreated(false)
      }
    };

    fetchInitialData();
    // Dependencies: Re-run if the target user ID changes, if it becomes own profile, or auth finishes loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdToView, isOwnProfile, authLoading]); // Removed navigate, fetchInitialData as deps

  // --- Effect: Fetch Favorite Connections (Conditional) ---
  /**
   * Fetches the connections favorited by the logged-in user.
   * Runs only when viewing own profile, the 'favorites' view is active,
   * favorites haven't been fetched yet, and the favorites list exists.
   */
  useEffect(() => {
    // Conditions to fetch favorites:
    const shouldFetchFavorites = isOwnProfile && // Must be viewing own profile
                                 activeView === 'favorites' && // Favorites tab must be active
                                 !favoritesFetched && // Haven't fetched them successfully yet
                                 loggedInUser?.favorites && // Logged-in user has a favorites list
                                 !loadingFavorites; // Not already loading favorites

    if (shouldFetchFavorites) {
      const fetchFavorites = async () => {
        setLoadingFavorites(true); // Set loading state for favorites
        setErrorFavorites(null); // Clear previous favorites errors
        try {
          const favoriteIds = loggedInUser.favorites; // Get the array of favorite IDs
          if (favoriteIds.length > 0) {
            // Fetch the full connection objects using their IDs
            const response = await getConnectionsByIds(favoriteIds);
            setFavoriteConnections(response.data || []); // Update state, ensure array
          } else {
            // If the user has no favorite IDs, set an empty array
            setFavoriteConnections([]);
          }
          setFavoritesFetched(true); // Mark favorites as fetched successfully
        } catch (err) {
          // Handle errors during favorites fetch
          const message = err.response?.data?.message || err.message || "Failed to load favorites.";
          console.error("[ProfilePage Favorites Fetch] Error:", err); // Keep error log
          setErrorFavorites(message);
          setFavoritesFetched(false); // Allow retry by resetting the fetched flag
        } finally {
          // Ensure favorites loading state is turned off
          setLoadingFavorites(false);
        }
      };
      fetchFavorites();
    }
    // Dependencies: Re-run when view changes, profile type changes, user/favorites change, or loading state changes
  }, [activeView, isOwnProfile, loggedInUser, favoritesFetched, loadingFavorites]);

  // --- Effect: Redirect Unauthenticated Users ---
  /**
   * Redirects users to the login page if they try to access '/profile' directly
   * without being logged in (after the initial auth check is complete).
   */
  useEffect(() => {
    // If no specific user ID is in the URL params AND auth check is done AND no user is logged in
    if (!paramsUserId && !authLoading && !loggedInUser) {
      // Redirect to login, passing the intended destination ('/profile')
      navigate('/login', { replace: true, state: { from: '/profile' } });
    }
  }, [paramsUserId, authLoading, loggedInUser, navigate]); // Dependencies

  // --- Prepare Display Data ---
  // Determine the name to display (Display Name > Username)
  const displayNameToShow = profileData?.displayName || profileData?.username;
  // Construct the profile image URL, falling back to default avatar
  const profileImageUrl = profileData?.profilePictureUrl
      ? getStaticFileUrl(profileData.profilePictureUrl)
      : defaultAvatar;

  // --- Render Helper Function for Connection Lists ---
  /**
   * Renders the appropriate list of connections based on the activeView state.
   * Handles loading and error states for each list type.
   */
  const renderConnections = () => {
    // --- Render 'Created' Connections ---
    if (activeView === 'created') {
      // Show loading spinner if initial page load (which includes created) is happening
      if (pageLoading) return <div className={styles.loadingSection}><LoadingSpinner /> Loading Creations...</div>;
      // Show error if initial page load failed
      if (pageError) return <ErrorMessage message={`Error loading created connections: ${pageError}`} />; // Show pageError here

      // Render the list or empty message
      return (
        <>
          <h2 className={styles.sectionTitle}>Connections Added ({createdConnections.length})</h2>
          {createdConnections.length === 0 ? (
            <p className={styles.emptyMessage}>{isOwnProfile ? "You haven't" : `${displayNameToShow || 'This user'} hasn't`} added any connections yet.</p>
          ) : (
            <div className={styles.connectionsGrid}>
              {createdConnections.map((connection) => (
                <ConnectionCard
                  key={`created-${connection._id}`} // Use prefix for key uniqueness
                  connection={connection}
                  onUpdate={updateConnectionInLists} // Pass combined update callback
                  onDelete={deleteConnectionFromLists} // Pass combined delete callback
                />
              ))}
            </div>
          )}
        </>
      );
    }
    // --- Render 'Favorites' Connections (Only for Own Profile) ---
    else if (activeView === 'favorites') {
      // Don't render favorites section if viewing someone else's profile
      if (!isOwnProfile) return null;

      // Show loading spinner if favorites are being fetched
      if (loadingFavorites) {
        return <div className={styles.loadingSection}><LoadingSpinner /> Loading Favorites...</div>;
      }
      // Show error if favorites fetch failed
      if (errorFavorites) {
        return <ErrorMessage message={`Error loading favorites: ${errorFavorites}`} />;
      }
      // Render the list or empty message once fetched
      if (favoritesFetched) {
         return (
          <>
            <h2 className={styles.sectionTitle}>My Favorites ({favoriteConnections.length})</h2>
            {favoriteConnections.length === 0 ? (
              <p className={styles.emptyMessage}>You haven't favorited any connections yet.</p>
            ) : (
              <div className={styles.connectionsGrid}>
                {favoriteConnections.map((connection) => (
                  <ConnectionCard
                    key={`favorite-${connection._id}`} // Use prefix for key uniqueness
                    connection={connection}
                    onUpdate={updateConnectionInLists} // Pass combined update callback
                    onDelete={deleteConnectionFromLists} // Pass combined delete callback
                  />
                ))}
              </div>
            )}
          </>
         );
      }
      // Return null if not fetched yet (should be covered by loading state)
      return null;
    }
    // Default return null if activeView is neither 'created' nor 'favorites'
    return null;
  };

  // --- Main Component Render ---

  // Display loading spinner for the entire page during initial fetch
  if (pageLoading && !profileData) { // Show full page load only initially
     return <div className={styles.loadingSection}><LoadingSpinner size="large"/></div>;
  }

  // Display error message if the initial page fetch failed
  if (!pageLoading && pageError) {
     return <div className={styles.profilePage}><ErrorMessage message={pageError} /></div>;
  }

  // Display message if loading finished but no profile data exists (e.g., user deleted?)
  if (!pageLoading && !pageError && !profileData) {
     return <div className={styles.profilePage}><ErrorMessage message="Profile data could not be found." /></div>;
  }

  // Render the full profile page if data is available
  return (
    <div className={styles.profilePage}>
        {/* --- Profile Header Section --- */}
        <div className={styles.profileHeader}>
            {/* Profile Avatar */}
            <img
                src={profileImageUrl} // Use determined URL
                alt={`${displayNameToShow || 'User'}'s avatar`}
                className={styles.profileAvatar}
                // Handle image loading errors, fallback to default avatar
                onError={(e) => { e.target.onerror = null; e.target.src=defaultAvatar }}
            />
            {/* Profile Text Information */}
            <div className={styles.profileInfo}>
                {/* Display Name (or Username) */}
                <h1 className={styles.profileName}>{displayNameToShow}</h1>
                {/* Show Username only if Display Name is also present */}
                {profileData.displayName && <p className={styles.profileUsername}>@{profileData.username}</p>}
                {/* Bio */}
                {profileData.bio && <p className={styles.profileBio}>{profileData.bio}</p>}
                {/* Location */}
                {profileData.location && <p className={styles.profileLocation}>📍 {profileData.location}</p>}
                {/* Joined Date */}
                <p className={styles.profileJoined}>Joined: {new Date(profileData.createdAt).toLocaleDateString()}</p>

                {/* Edit Profile Button (Only for Own Profile) */}
                {isOwnProfile && (
                    <Link to="/profile/edit" className={styles.editProfileButton}>
                        Edit Profile
                    </Link>
                )}
            </div>
        </div>

        {/* --- View Toggle Buttons (Only for Own Profile) --- */}
        {isOwnProfile && (
            <div className={styles.viewToggleContainer}>
                {/* Created Connections Button */}
                <button
                    className={`${styles.toggleButton} ${activeView === 'created' ? styles.active : ''}`}
                    onClick={() => setActiveView('created')}
                    // Disable if already active or if initial page load is happening
                    disabled={activeView === 'created' || pageLoading}
                >
                    My Creations ({createdConnections.length})
                    {/* Show spinner if initial page load is happening */}
                    {pageLoading && activeView === 'created' && <LoadingSpinner size="small" inline marginLeft="0.5rem" />}
                </button>
                {/* Favorite Connections Button */}
                <button
                    className={`${styles.toggleButton} ${activeView === 'favorites' ? styles.active : ''}`}
                    onClick={() => setActiveView('favorites')}
                    // Disable if already active or if favorites are currently loading
                    disabled={activeView === 'favorites' || loadingFavorites}
                >
                    My Favorites ({loggedInUser?.favorites?.length || 0})
                    {/* Show spinner if favorites are loading */}
                    {loadingFavorites && <LoadingSpinner size="small" inline marginLeft="0.5rem" />}
                </button>
            </div>
        )}

        {/* --- Connections Section (Renders Created or Favorites) --- */}
        <div className={styles.connectionsSection}>
            {renderConnections()}
        </div>
    </div>
  );
};

export default ProfilePage;

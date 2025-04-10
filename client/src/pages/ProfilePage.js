// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Link is now used
import { useAuth } from '../contexts/AuthContext';
import {
  getPublicUserProfile,
  getUserConnections,
  getConnectionsByIds,
  getStaticFileUrl,
} from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import styles from './ProfilePage.module.css';
import defaultAvatar from '../assets/images/default-avatar.png';

const ProfilePage = () => {
  const { userId: paramsUserId } = useParams();
  const { user: loggedInUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const userIdToView = paramsUserId || loggedInUser?._id;
  const isOwnProfile = loggedInUser && userIdToView === loggedInUser._id;

  // State for profile info
  const [profileData, setProfileData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  // State for connection lists
  const [createdConnections, setCreatedConnections] = useState([]);
  const [loadingCreated, setLoadingCreated] = useState(false);
  const [errorCreated, setErrorCreated] = useState(null);

  const [favoriteConnections, setFavoriteConnections] = useState([]);
  const [activeView, setActiveView] = useState('created');
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [errorFavorites, setErrorFavorites] = useState(null);
  const [favoritesFetched, setFavoritesFetched] = useState(false);

  // --- Combined Update/Delete Callbacks ---
  const updateConnectionInBothLists = useCallback((updatedConnection) => {
    setCreatedConnections(prev =>
      prev.map(conn => conn._id === updatedConnection._id ? updatedConnection : conn)
    );
    setFavoriteConnections(prev =>
      prev.map(conn => conn._id === updatedConnection._id ? updatedConnection : conn)
    );
  }, []);

  const deleteConnectionFromBothLists = useCallback((deletedConnectionId) => {
    setCreatedConnections(prev => prev.filter(conn => conn._id !== deletedConnectionId));
    setFavoriteConnections(prev => prev.filter(conn => conn._id !== deletedConnectionId));
  }, []);

  // --- Fetch Initial Profile Data ---
  useEffect(() => {
    if (!userIdToView || (isOwnProfile && authLoading)) {
      setPageLoading(isOwnProfile && authLoading);
      if (!paramsUserId && !authLoading && !loggedInUser) {
        setPageError("Please log in to view your profile.");
      }
      return;
    }

    const fetchInitialData = async () => {
      console.log(`[ProfilePage Fetch] Fetching initial data for user ID: ${userIdToView}`);
      setPageLoading(true);
      setPageError(null);
      setProfileData(null);
      setCreatedConnections([]);
      setErrorCreated(null);
      setActiveView('created');
      setFavoritesFetched(false);
      setFavoriteConnections([]);
      setErrorFavorites(null);

      try {
        const [profileRes, connectionsRes] = await Promise.all([
          getPublicUserProfile(userIdToView),
          getUserConnections(userIdToView)
        ]);
        setProfileData(profileRes.data);
        setCreatedConnections(connectionsRes.data || []);
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to load profile data.";
        console.error("[ProfilePage Fetch] Error:", err);
        if (err.response?.status === 404) {
          setPageError("User not found.");
        } else {
          setPageError(`Error loading profile: ${message}`);
        }
        setProfileData(null);
        setCreatedConnections([]);
      } finally {
        setPageLoading(false);
        setLoadingCreated(false);
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdToView, isOwnProfile, authLoading]); // Re-run if user changes or auth loads

  // --- Fetch Favorite Connections ---
  useEffect(() => {
    if (isOwnProfile && activeView === 'favorites' && !favoritesFetched && loggedInUser?.favorites && !loadingFavorites) {
      const fetchFavorites = async () => {
        setLoadingFavorites(true);
        setErrorFavorites(null);
        try {
          const favoriteIds = loggedInUser.favorites;
          if (favoriteIds.length > 0) {
            const response = await getConnectionsByIds(favoriteIds);
            setFavoriteConnections(response.data || []);
          } else {
            setFavoriteConnections([]);
          }
          setFavoritesFetched(true);
        } catch (err) {
          const message = err.response?.data?.message || err.message || "Failed to load favorites.";
          setErrorFavorites(message);
          setFavoritesFetched(false); // Allow retry
        } finally {
          setLoadingFavorites(false);
        }
      };
      fetchFavorites();
    }
  }, [activeView, isOwnProfile, loggedInUser, favoritesFetched, loadingFavorites]);

  // --- Redirect Logic ---
  useEffect(() => {
    if (!paramsUserId && !authLoading && !loggedInUser) {
      navigate('/login', { replace: true, state: { from: '/profile' } });
    }
  }, [paramsUserId, authLoading, loggedInUser, navigate]);

  // --- Determine display name ---
  const displayName = profileData?.displayName || profileData?.username;

  // --- Render Logic ---
  const renderConnections = () => {
    // ... (render logic for created and favorites connections remains the same) ...
    if (activeView === 'created') {
      if (loadingCreated) return <div className={styles.loadingSection}><LoadingSpinner /> Loading Creations...</div>;
      if (errorCreated) return <ErrorMessage message={errorCreated} />;

      return (
        <>
          <h2 className={styles.sectionTitle}>Connections Added ({createdConnections.length})</h2>
          {createdConnections.length === 0 ? (
            <p className={styles.emptyMessage}>{isOwnProfile ? "You haven't" : `${displayName || 'This user'} hasn't`} added any connections yet.</p>
          ) : (
            <div className={styles.connectionsGrid}>
              {createdConnections.map((connection) => (
                <ConnectionCard
                  key={`created-${connection._id}`}
                  connection={connection}
                  onUpdate={updateConnectionInBothLists}
                  onDelete={deleteConnectionFromBothLists}
                />
              ))}
            </div>
          )}
        </>
      );
    } else if (activeView === 'favorites') {
      if (!isOwnProfile) return null;

      if (loadingFavorites) {
        return <div className={styles.loadingSection}><LoadingSpinner /> Loading Favorites...</div>;
      }
      if (errorFavorites) {
        return <ErrorMessage message={errorFavorites} />;
      }
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
                    key={`favorite-${connection._id}`}
                    connection={connection}
                    onUpdate={updateConnectionInBothLists}
                    onDelete={deleteConnectionFromBothLists}
                  />
                ))}
              </div>
            )}
          </>
         );
      }
      return null;
    }
    return null;
  };

  // --- Main Component Return ---
  const profileImageUrl = profileData?.profilePictureUrl
      ? getStaticFileUrl(profileData.profilePictureUrl)
      : defaultAvatar;

  return (
    <div className={styles.profilePage}>
      {pageLoading && <div className={styles.loadingSection}><LoadingSpinner size="large"/></div>}
      {!pageLoading && pageError && <ErrorMessage message={pageError} />}
      {!pageLoading && !pageError && profileData && (
        <>
          {/* --- Profile Header Section --- */}
          <div className={styles.profileHeader}>
             <img
                src={profileImageUrl}
                alt={`${displayName || 'User'}'s avatar`}
                className={styles.profileAvatar}
                // Add error handling for the main avatar display too
                onError={(e) => { e.target.onerror = null; e.target.src=defaultAvatar }}
            />
            <div className={styles.profileInfo}>
                <h1 className={styles.profileName}>{displayName}</h1>
                {profileData.displayName && <p className={styles.profileUsername}>@{profileData.username}</p>}
                {profileData.bio && <p className={styles.profileBio}>{profileData.bio}</p>}
                {profileData.location && <p className={styles.profileLocation}>📍 {profileData.location}</p>}
                <p className={styles.profileJoined}>Joined: {new Date(profileData.createdAt).toLocaleDateString()}</p>

                {/* --- ADDED EDIT PROFILE LINK/BUTTON --- */}
                {isOwnProfile && (
                    <Link to="/profile/edit" className={styles.editProfileButton}>
                        Edit Profile
                    </Link>
                )}
                {/* --- END EDIT PROFILE LINK/BUTTON --- */}

            </div>
          </div>

          {/* --- View Toggle (Only for Own Profile) --- */}
          {isOwnProfile && (
            <div className={styles.viewToggleContainer}>
              <button
                className={`${styles.toggleButton} ${activeView === 'created' ? styles.active : ''}`}
                onClick={() => setActiveView('created')}
                disabled={activeView === 'created' || loadingCreated}
              >
                My Creations ({createdConnections.length})
                {loadingCreated && <LoadingSpinner size="small" inline marginLeft="0.5rem" />}
              </button>
              <button
                className={`${styles.toggleButton} ${activeView === 'favorites' ? styles.active : ''}`}
                onClick={() => setActiveView('favorites')}
                disabled={activeView === 'favorites' || loadingFavorites}
              >
                My Favorites ({loggedInUser?.favorites?.length || 0})
                {loadingFavorites && <LoadingSpinner size="small" inline marginLeft="0.5rem" />}
              </button>
            </div>
          )}

          {/* --- Connections Section --- */}
          <div className={styles.connectionsSection}>
            {renderConnections()}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
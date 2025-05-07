// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import {
  getPublicUserProfile,
  getUserConnections,
  getConnectionsByIds,
  getStaticFileUrl,
  followUser,
  unfollowUser,
  isFollowing,
} from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import styles from './ProfilePage.module.css';

const DEFAULT_AVATAR_PUBLIC_PATH = '/images/default-avatar.png';
const siteBaseUrl = window.location.origin;


const ProfilePage = () => {
  const { userId: paramsUserId } = useParams();
  const { user: loggedInUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileData, setProfileData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const [createdConnections, setCreatedConnections] = useState([]);
  const [favoriteConnections, setFavoriteConnections] = useState([]);
  const [activeView, setActiveView] = useState('created');
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [errorFavorites, setErrorFavorites] = useState(null);
  const [favoritesFetched, setFavoritesFetched] = useState(false);

  const [isFollowingStatus, setIsFollowingStatus] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isFollowingError, setIsFollowingError] = useState(null);
  const [isSelf, setIsSelf] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const viewingOwnProfile = loggedInUser && profileData && loggedInUser._id === profileData._id;

  // Callbacks for connection updates/deletions
  const updateConnectionInBothLists = useCallback((updatedConnection) => {
    setCreatedConnections(prev =>
        prev.map(conn => conn._id === updatedConnection._id ? updatedConnection : conn)
    );
    setFavoriteConnections(prev =>
        prev.map(conn => conn._id === updatedConnection._id ? updatedConnection : conn)
    );
  }, []); // Ensure dependencies are empty if not relying on external scope that changes

  const deleteConnectionFromBothLists = useCallback((deletedConnectionId) => {
    setCreatedConnections(prev => prev.filter(conn => conn._id !== deletedConnectionId));
    setFavoriteConnections(prev => prev.filter(conn => conn._id !== deletedConnectionId));
  }, []); // Ensure dependencies are empty

  // Effect 1: Read URL hash
  useEffect(() => {
    if (location.hash === '#favorites') setActiveView('favorites');
    else setActiveView('created');
  }, [location.pathname, location.hash]);

  // Effect 2: Fetch Initial Profile Data, etc.
  useEffect(() => {
    if (authLoading) { setInitialLoading(true); return; }
    if (!paramsUserId && !loggedInUser) { navigate('/login', { replace: true, state: { from: location.pathname } }); return; }
    const idToFetch = paramsUserId || loggedInUser?._id;
    if (!idToFetch) { setInitialLoading(false); setPageError("No user specified or found."); return; }

    setInitialLoading(true); setPageError(null); setProfileData(null); setCreatedConnections([]);
    setFavoritesFetched(false); setFavoriteConnections([]); setErrorFavorites(null);
    setIsFollowingStatus(false); setIsFollowingError(null); setIsFollowingLoading(false);
    setIsSelf(false); setFollowerCount(0); setFollowingCount(0);

    const fetchInitialData = async () => {
      try {
        const [profileRes, connectionsRes] = await Promise.all([
          getPublicUserProfile(idToFetch), getUserConnections(idToFetch)
        ]);
        setProfileData(profileRes.data); setCreatedConnections(connectionsRes.data || []);
        setFollowerCount(profileRes.data.followerCount || 0);
        setFollowingCount(profileRes.data.followingCount || 0);
        const isCurrentUser = loggedInUser && loggedInUser._id === profileRes.data._id;
        setIsSelf(isCurrentUser);
        if (!isCurrentUser && loggedInUser) {
          setIsFollowingLoading(true);
          try {
            const followStatusRes = await isFollowing(idToFetch);
            setIsFollowingStatus(followStatusRes.data.isFollowing);
          } catch (followErr) {
            setIsFollowingError(followErr.response?.data?.message || "Failed to check follow status.");
            setIsFollowingStatus(false);
          } finally { setIsFollowingLoading(false); }
        }
      } catch (err) {
        let message = err.response?.data?.message || err.message || "Failed to load profile data.";
        if (err.response?.status === 404) message = "User not found or profile is private.";
        setPageError(message); setProfileData(null); setCreatedConnections([]);
        setFollowerCount(0); setFollowingCount(0);
      } finally { setInitialLoading(false); }
    };
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, paramsUserId, loggedInUser, navigate, location.pathname]);

  // Effect 3: Fetch Favorite Connections
  useEffect(() => {
    if (loggedInUser?._id === profileData?._id && activeView === 'favorites' && !favoritesFetched && !loadingFavorites && loggedInUser?.favorites) {
      const fetchFavorites = async () => {
        setLoadingFavorites(true); setErrorFavorites(null);
        try {
          const favoriteIds = loggedInUser.favorites;
          if (favoriteIds.length > 0) {
            const response = await getConnectionsByIds(favoriteIds);
            setFavoriteConnections(response.data || []);
          } else { setFavoriteConnections([]); }
          setFavoritesFetched(true);
        } catch (err) {
          setErrorFavorites(err.response?.data?.message || "Failed to load favorites.");
          setFavoriteConnections([]); setFavoritesFetched(false);
        } finally { setLoadingFavorites(false); }
      };
      fetchFavorites();
    } else if (activeView === 'favorites' && (!loggedInUser || loggedInUser?._id !== profileData?._id)) {
      setActiveView('created');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, loggedInUser, profileData, favoritesFetched, loadingFavorites]);

  // Follow/Unfollow Handlers
  const handleFollow = async () => {
    if (isSelf || !loggedInUser || isFollowingLoading || !profileData?._id) return;
    setIsFollowingLoading(true); setIsFollowingError(null);
    try { await followUser(profileData._id); setIsFollowingStatus(true); setFollowerCount(p => p + 1); }
    catch (err) { setIsFollowingError(err.response?.data?.message || "Failed to follow."); setIsFollowingStatus(false); setFollowerCount(p => Math.max(0, p - 1));}
    finally { setIsFollowingLoading(false); }
  };

  const handleUnfollow = async () => {
    if (isSelf || !loggedInUser || !isFollowingStatus || isFollowingLoading || !profileData?._id) return;
    setIsFollowingLoading(true); setIsFollowingError(null);
    try { await unfollowUser(profileData._id); setIsFollowingStatus(false); setFollowerCount(p => Math.max(0, p - 1)); }
    catch (err) { setIsFollowingError(err.response?.data?.message || "Failed to unfollow."); setIsFollowingStatus(true); setFollowerCount(p => Math.max(0, p + 1));}
    finally { setIsFollowingLoading(false); }
  };

  // Helper to render connections list
  const renderConnectionsList = (connections, listLoading, listError) => {
      if (listLoading) return <div className={styles.loadingSection}><LoadingSpinner /> Loading...</div>;
      if (listError) return <ErrorMessage message={listError} />;
      if (!Array.isArray(connections) || connections.length === 0) {
        let message;
        if (viewingOwnProfile) {
          message = activeView === 'created' ? "You haven't added any connections yet." : "You haven't favorited any connections yet.";
        } else {
           message = `${displayName || 'This user'} hasn't added any connections yet.`;
        }
        return <p className={styles.emptyMessage}>{message}</p>;
      }
      return (
          <div className={styles.connectionsGrid}>
              {connections.map((connection) => (
                  <ConnectionCard
                      key={connection._id}
                      connection={connection}
                      onUpdate={updateConnectionInBothLists}
                      onDelete={deleteConnectionFromBothLists}
                      isAuthor={viewingOwnProfile && activeView === 'created' && connection.author === loggedInUser?._id}
                  />
              ))}
          </div>
      );
  };

  const displayName = profileData?.displayName || profileData?.username;

  // Render Logic for Follow Button
  const renderFollowButton = () => {
    if (isSelf || authLoading || !loggedInUser || !profileData || pageError) return null;
    const buttonContent = isFollowingLoading ? <LoadingSpinner size="small" inline color="white" /> : (isFollowingStatus ? 'Following' : 'Follow');
    const buttonClass = isFollowingStatus ? styles.followingButton : styles.followButton;
    return (
        <>
          {isFollowingError && !isFollowingLoading && <ErrorMessage message={isFollowingError} />}
          <button className={buttonClass} onClick={isFollowingStatus ? handleUnfollow : handleFollow} disabled={isFollowingLoading}>
              {buttonContent}
          </button>
        </>
    );
  };

  if (initialLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Profile... | Movie-Books</title>
        </Helmet>
        <div className={styles.pageLoading}><LoadingSpinner size="large"/></div>
      </>
    );
  }

  if (pageError) {
    return (
      <>
        <Helmet>
          <title>Profile Error | Movie-Books</title>
          <meta name="description" content="Could not load user profile. The user may not exist or their profile might be private." />
        </Helmet>
        <div className={styles.pageError}><ErrorMessage message={pageError} /></div>
      </>
    );
  }

  if (!profileData) {
    return (
      <>
        <Helmet>
          <title>Profile Not Found | Movie-Books</title>
          <meta name="description" content="User profile data could not be loaded." />
        </Helmet>
        <div className={styles.pageError}><ErrorMessage message="Profile data could not be loaded." /></div>
      </>
    );
  }

  const profilePageTitle = `${displayName || 'User'}'s Profile | Movie-Books`;
  const profileMetaDescription = `View the profile of ${displayName || 'user'} on Movie-Books. Discover their movie-book connections, followers, and who they follow. ${profileData?.bio ? profileData.bio.substring(0, 100) + '...' : ''}`;
  const profileCanonicalUrl = `${siteBaseUrl}/users/${profileData._id}`;
  const profileMetaImageUrl = profileData?.profilePictureUrl
      ? getStaticFileUrl(profileData.profilePictureUrl)
      : `${siteBaseUrl}${DEFAULT_AVATAR_PUBLIC_PATH}`;

  const profileImageUrl = profileData?.profilePictureUrl
      ? getStaticFileUrl(profileData.profilePictureUrl)
      : getStaticFileUrl(DEFAULT_AVATAR_PUBLIC_PATH);

  return (
    <>
      <Helmet>
        <title>{profilePageTitle}</title>
        <meta name="description" content={profileMetaDescription} />
        <link rel="canonical" href={profileCanonicalUrl} />
        <meta property="og:title" content={profilePageTitle} />
        <meta property="og:description" content={profileMetaDescription} />
        <meta property="og:url" content={profileCanonicalUrl} />
        <meta property="og:image" content={profileMetaImageUrl} />
        <meta property="og:type" content="profile" />
        {profileData.username && <meta property="profile:username" content={profileData.username} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={profilePageTitle} />
        <meta name="twitter:description" content={profileMetaDescription} />
        <meta name="twitter:image" content={profileMetaImageUrl} />
      </Helmet>

      <div className={styles.profilePage}>
        <div className={styles.profileHeader}>
            <img
                src={profileImageUrl}
                alt={`${displayName || 'User'}'s avatar`}
                className={styles.profileAvatar}
                onError={(e) => { e.target.onerror = null; e.target.src = getStaticFileUrl(DEFAULT_AVATAR_PUBLIC_PATH); }}
            />
            <div className={styles.profileInfo}>
                <h1 className={styles.profileName}>{displayName}</h1>
                {profileData.displayName && <p className={styles.profileUsername}>@{profileData.username}</p>}
                {profileData.bio && <p className={styles.profileBio}>{profileData.bio}</p>}
                {profileData.location && <p className={styles.profileLocation}>📍 {profileData.location}</p>}
                <div className={styles.followCounts}>
                    {profileData && profileData._id && (
                        <>
                            <Link to={`/users/${profileData._id}/followers`} className={styles.followCountLink}>
                                <span><strong>{followerCount}</strong> Followers</span>
                            </Link>
                            <Link to={`/users/${profileData._id}/following`} className={styles.followCountLink}>
                                <span><strong>{followingCount}</strong> Following</span>
                            </Link>
                        </>
                    )}
                </div>
                <p className={styles.profileJoined}>Joined: {new Date(profileData.createdAt).toLocaleDateString()}</p>
                <div className={styles.actionButtons}>
                    {viewingOwnProfile ? (
                        <Link to="/profile/edit" className={styles.editProfileButton}>Edit Profile</Link>
                    ) : (
                        renderFollowButton()
                    )}
                </div>
            </div>
        </div>

        {viewingOwnProfile && (
          <div className={styles.viewToggleContainer}>
            <button
              className={`${styles.toggleButton} ${activeView === 'created' ? styles.active : ''}`}
              onClick={() => { setActiveView('created'); navigate(location.pathname, { replace: true }); }}
              disabled={activeView === 'created'}
            >
              My Creations ({createdConnections.length})
            </button>
            <button
              className={`${styles.toggleButton} ${activeView === 'favorites' ? styles.active : ''}`}
              onClick={() => { setActiveView('favorites'); navigate(location.pathname + '#favorites', { replace: true }); }}
              disabled={activeView === 'favorites' || (activeView !== 'favorites' && loadingFavorites)}
            >
              My Favorites ({loggedInUser?.favorites?.length || 0})
              {loadingFavorites && activeView === 'favorites' && <LoadingSpinner size="small" inline marginLeft="0.5rem" />}
            </button>
          </div>
        )}

        {profileData && (
            <h2 className={styles.sectionTitle}>
                {viewingOwnProfile
                    ? (activeView === 'created' ? `My Creations (${createdConnections.length})` : `My Favorites (${favoriteConnections.length})`)
                    : `Connections Added (${createdConnections.length})`
                }
            </h2>
        )}

        <div className={styles.connectionsSection}>
            {activeView === 'created' && renderConnectionsList(createdConnections, initialLoading && !profileData, pageError && !profileData)}
            {activeView === 'favorites' && viewingOwnProfile && renderConnectionsList(favoriteConnections, loadingFavorites, errorFavorites)}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
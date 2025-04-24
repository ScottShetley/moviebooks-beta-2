// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import defaultAvatar from '../assets/images/default-avatar.png';

const ProfilePage = () => {
  const { userId: paramsUserId } = useParams();
  const { user: loggedInUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State for profile info
  const [profileData, setProfileData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true); // Used for initial fetch of profile + created connections
  const [pageError, setPageError] = useState(null);

  // State for connection lists
  const [createdConnections, setCreatedConnections] = useState([]);
  const [errorCreated, setErrorCreated] = useState(null); // Still keep error state

  const [favoriteConnections, setFavoriteConnections] = useState([]);
  const [activeView, setActiveView] = useState('created');
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [errorFavorites, setErrorFavorites] = useState(null);
  const [favoritesFetched, setFavoritesFetched] = useState(false);

  // State for Follow Status and Counts
  const [isFollowingStatus, setIsFollowingStatus] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isFollowingError, setIsFollowingError] = useState(null);
  const [isSelf, setIsSelf] = useState(false); // To know if viewing own profile for button logic
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);


  // Check if viewing own profile (derived state)
  // Use profileData?._id after it's successfully fetched
  const viewingOwnProfile = loggedInUser && profileData && loggedInUser._id === profileData._id;


  // Combined Update/Delete Callbacks
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

  // Fetch Initial Profile Data, Created Connections, and Follow Status
  useEffect(() => {
     // Wait for auth to load to know if logged in
    if (authLoading) {
        setPageLoading(true);
        return;
    }

    // If no userId in params and not logged in after auth loads, redirect to login
    if (!paramsUserId && !loggedInUser) {
        console.log("[ProfilePage Effect] No user ID in params and not logged in. Redirecting.");
        navigate('/login', { replace: true, state: { from: '/users' } }); // Changed from /profile to /users
        return;
    }

    // Determine the actual userId to fetch profile for
    // Use paramsUserId if it exists. If not, and loggedInUser exists, use loggedInUser._id (for own profile)
    const idToFetch = paramsUserId || loggedInUser?._id;

    // If still no ID (shouldn't happen if logic above is correct, but a safeguard)
    if (!idToFetch) {
        console.error("[ProfilePage Effect] No ID determined to fetch profile.");
        setPageLoading(false);
        setPageError("No user specified or found.");
        return;
    }

    console.log(`[ProfilePage Fetch] Fetching initial data for user ID: ${idToFetch}`);
    setPageLoading(true);
    setPageError(null);
    setProfileData(null);
    setCreatedConnections([]);
    setErrorCreated(null);
    setActiveView('created'); // Reset view on profile change
    setFavoritesFetched(false);
    setFavoriteConnections([]);
    setErrorFavorites(null);

    // Reset follow status and counts state
    setIsFollowingStatus(false);
    setIsFollowingError(null);
    setIsFollowingLoading(false);
    setIsSelf(false); // Assume not self until profile data confirms
    setFollowerCount(0); // Reset counts
    setFollowingCount(0); // Reset counts


    const fetchInitialData = async () => {
      try {
        const [profileRes, connectionsRes] = await Promise.all([
          getPublicUserProfile(idToFetch),
          getUserConnections(idToFetch)
        ]);

        setProfileData(profileRes.data);
        setCreatedConnections(connectionsRes.data || []);

        // Extract and set follower/following counts
        setFollowerCount(profileRes.data.followerCount || 0);
        setFollowingCount(profileRes.data.followingCount || 0);


        // Determine if the fetched profile belongs to the logged-in user
        const isCurrentUser = loggedInUser && loggedInUser._id === profileRes.data._id;
        setIsSelf(isCurrentUser); // Set isSelf based on fetched profile data

        // Fetch Follow Status if viewing another user's profile
        // Only fetch if not viewing own profile AND logged in (cannot follow/check status if not logged in)
        if (!isCurrentUser && loggedInUser) {
            console.log(`[ProfilePage Fetch] Checking follow status for user ${loggedInUser._id} following ${idToFetch}`);
            setIsFollowingLoading(true);
            try {
                const followStatusRes = await isFollowing(idToFetch);
                // The backend returns { isFollowing: boolean, isSelf: boolean }
                setIsFollowingStatus(followStatusRes.data.isFollowing);
                 // Although backend sends isSelf, we rely on our frontend check based on fetched profile for render logic primarily
                 // setIsSelf(followStatusRes.data.isSelf); // Can log or use this if needed, but redundant with our check
                console.log(`[ProfilePage Fetch] Follow status: ${followStatusRes.data.isFollowing}`);

            } catch (followErr) {
                 const followErrorMessage = followErr.response?.data?.message || followErr.message || "Failed to check follow status.";
                 console.error("[ProfilePage Fetch] Error checking follow status:", followErr);
                 setIsFollowingError(followErrorMessage);
                 setIsFollowingStatus(false); // Assume not following on error
            } finally {
                 setIsFollowingLoading(false);
            }
        } else if (isCurrentUser) {
             console.log("[ProfilePage Fetch] Viewing own profile. Skipping follow status check.");
             setIsSelf(true); // Explicitly set isSelf true if it's own profile
        } else if (!loggedInUser) {
             console.log("[ProfilePage Fetch] Not logged in. Cannot check/show follow button.");
             setIsSelf(false); // Explicitly set isSelf false if not logged in
        }
        // End Fetch Follow Status

      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to load profile data.";
        console.error("[ProfilePage Fetch] Error:", err);
        if (err.response?.status === 404) {
          setPageError("User not found.");
        } else {
          setPageError(`Error loading profile: ${message}`);
        }
        setProfileData(null); // Ensure profileData is null on error
        setCreatedConnections([]);
        // Reset counts on error
        setFollowerCount(0);
        setFollowingCount(0);
      } finally {
        setPageLoading(false); // End overall page loading
      }
    };

     // Only fetch if we have an ID to fetch
    if (idToFetch) {
        fetchInitialData();
    }

  }, [paramsUserId, loggedInUser, authLoading, navigate]); // Depend on auth status, params ID, and loggedInUser change


  // Fetch Favorite Connections (This effect only runs for the logged-in user's profile)
  useEffect(() => {
    // Only fetch if viewing own profile, 'favorites' tab is active, favorites not fetched, and not already loading
    // Check loggedInUser?._id against profileData?._id to be sure it's the logged-in user's *fetched* profile
    if (loggedInUser?._id === profileData?._id && activeView === 'favorites' && !favoritesFetched && !loadingFavorites && loggedInUser?.favorites) {
      const fetchFavorites = async () => {
        setLoadingFavorites(true);
        setErrorFavorites(null);
        console.log("[ProfilePage Fetch] Fetching favorite connections.");
        try {
          const favoriteIds = loggedInUser.favorites; // Favorites list is on the loggedInUser context object
          if (favoriteIds.length > 0) {
            const response = await getConnectionsByIds(favoriteIds);
            setFavoriteConnections(response.data || []);
            console.log(`[ProfilePage Fetch] Found ${response.data?.length || 0} favorites.`);
          } else {
            setFavoriteConnections([]);
            console.log("[ProfilePage Fetch] No favorite IDs found for user.");
          }
          setFavoritesFetched(true); // Mark as fetched on success
        } catch (err) {
          const message = err.response?.data?.message || err.message || "Failed to load favorites.";
          setErrorFavorites(message);
          setFavoritesFetched(false); // Allow retry if there was an error
          console.error("[ProfilePage Fetch] Error fetching favorites:", err);
        } finally {
          setLoadingFavorites(false);
        }
      };
      fetchFavorites();
    } else if (activeView === 'favorites' && (!loggedInUser || loggedInUser?._id !== profileData?._id)) {
        // If 'favorites' tab is active but not viewing own profile, should ideally not happen due to render logic,
        // but log a warning or reset view if needed.
        console.warn("[ProfilePage Effect] Favorites view active but not viewing own profile. This state should be prevented by UI logic.");
        // Optionally setActiveView('created') here if you want to auto-switch back
    }
     // Dependencies: activeView, loggedInUser (to get favorites list & _id), profileData (_id check), favoritesFetched, loadingFavorites
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, loggedInUser, profileData, favoritesFetched]);


  // Follow/Unfollow Handlers
  const handleFollow = async () => {
    // Only proceed if not viewing self, logged in, and not already loading
    if (isSelf || !loggedInUser || isFollowingLoading || !profileData?._id) {
        console.warn("[ProfilePage] Follow attempted under invalid conditions.");
        return;
    }
    console.log(`[ProfilePage] Attempting to follow user ${profileData._id}`);
    setIsFollowingLoading(true);
    setIsFollowingError(null);
    try {
      await followUser(profileData._id); // Call the follow API
      setIsFollowingStatus(true); // Optimistically update state to 'following'
      setFollowerCount(prevCount => prevCount + 1); // Optimistically increment follower count
      console.log(`Successfully followed user ${profileData.username}`);
       // Consider adding logic here to trigger a refetch of profile stats (like follower count)
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to follow user.";
      setIsFollowingError(message);
      console.error("[ProfilePage] Follow Error:", err);
       // If follow failed, revert the status and count back
       setIsFollowingStatus(false); // Revert optimistic update
       setFollowerCount(prevCount => Math.max(0, prevCount - 1)); // Revert count, ensure not negative
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleUnfollow = async () => {
     // Only proceed if not viewing self, logged in, currently following, and not already loading
    if (isSelf || !loggedInUser || !isFollowingStatus || isFollowingLoading || !profileData?._id) {
       console.warn("[ProfilePage] Unfollow attempted under invalid conditions.");
       return;
    }
    console.log(`[ProfilePage] Attempting to unfollow user ${profileData._id}`);
    setIsFollowingLoading(true);
    setIsFollowingError(null);
     try {
      await unfollowUser(profileData._id); // Call the unfollow API
      setIsFollowingStatus(false); // Optimistically update state to 'not following'
      setFollowerCount(prevCount => Math.max(0, prevCount - 1)); // Optimistically decrement follower count
       console.log(`Successfully unfollowed user ${profileData.username}`);
       // Consider adding logic here to trigger a refetch of profile stats (like follower count)
    } catch (err) {
       const message = err.response?.data?.message || err.message || "Failed to unfollow user.";
       setIsFollowingError(message);
       console.error("[ProfilePage] Unfollow Error:", err);
        // If unfollow failed, revert the status and count back
        setIsFollowingStatus(true); // Revert optimistic update
        setFollowerCount(prevCount => prevCount + 1); // Revert count
    } finally {
       setIsFollowingLoading(false);
    }
  };


  // Determine display name
  // Use profileData.displayName if available, fallback to profileData.username
  const displayName = profileData?.displayName || profileData?.username;

  // Render Logic for Follow Button (No changes needed here, uses isFollowingStatus)
  const renderFollowButton = () => {
      // Don't show button if:
      // - Viewing own profile (isSelf is true)
      // - Auth is loading or user is not logged in (cannot follow if not logged in)
      // - Profile data hasn't loaded yet or there was a page error during initial load
      if (isSelf || authLoading || !loggedInUser || !profileData || pageError) {
          return null;
      }

      // Show loading spinner inside the button if action is in progress
      const buttonContent = isFollowingLoading ? (
          <LoadingSpinner size="small" inline color="white" />
      ) : (
          isFollowingStatus ? 'Following' : 'Follow'
      );

      const buttonClass = isFollowingStatus ? styles.followingButton : styles.followButton;

      return (
          <>
            {/* isFollowingError is displayed below buttons */}
            <button
                className={buttonClass}
                onClick={isFollowingStatus ? handleUnfollow : handleFollow}
                disabled={isFollowingLoading} // Disable button while action is loading
            >
                {buttonContent}
            </button>
          </>
      );
  };


  // Render Logic for Connections (No changes needed here)
  const renderConnections = () => {
    if (activeView === 'created') {
      // Use pageLoading for initial fetch of created connections
      if (pageLoading) return <div className={styles.loadingSection}><LoadingSpinner /> Loading Creations...</div>;
      // Use errorCreated state specifically for created connections list errors if they were fetched separately later
      // For initial load errors, pageError handles it.
      if (errorCreated) return <ErrorMessage message={errorCreated} />; // Keep this in case we add specific fetch later

      return (
        <>
          {/* Title is rendered outside this function when not viewing own profile */}
          {viewingOwnProfile && <h2 className={styles.sectionTitle}>My Creations ({createdConnections.length})</h2>}
          {createdConnections.length === 0 ? (
            <p className={styles.emptyMessage}>{viewingOwnProfile ? "You haven't" : `${displayName || 'This user'} hasn't`} added any connections yet.</p>
          ) : (
            <div className={styles.connectionsGrid}>
              {createdConnections.map((connection) => (
                // Pass isOwnProfile down to ConnectionCard if needed for edit/delete buttons
                <ConnectionCard
                  key={`created-${connection._id}`}
                  connection={connection}
                  onUpdate={updateConnectionInBothLists}
                  onDelete={deleteConnectionFromBothLists}
                  isAuthor={viewingOwnProfile} // Pass down whether the logged-in user is the author
                />
              ))}
            </div>
          )}
        </>
      );
    } else if (activeView === 'favorites') {
      // Favorites view is only for own profile
      if (!viewingOwnProfile) return null;

      if (loadingFavorites) {
        return <div className={styles.loadingSection}><LoadingSpinner /> Loading Favorites...</div>;
      }
      if (errorFavorites) {
        return <ErrorMessage message={errorFavorites} />;
      }
      // Only render the list if favoritesFetched is true and there's no error
      if (favoritesFetched && !errorFavorites) {
         return (
          <>
            <h2 className={styles.sectionTitle}>My Favorites ({favoriteConnections.length})</h2>
            {favoriteConnections.length === 0 ? (
              <p className={styles.emptyMessage}>You haven't favorited any connections yet.</p>
            ) : (
              <div className={styles.connectionsGrid}>
                {favoriteConnections.map((connection) => (
                   // Pass isOwnProfile down (true for favorites)
                  <ConnectionCard
                    key={`favorite-${connection._id}`}
                    connection={connection}
                    onUpdate={updateConnectionInBothLists}
                    onDelete={deleteConnectionFromBothLists}
                    isAuthor={viewingOwnProfile} // This will be true here
                  />
                ))}
              </div>
            )}
          </>
         );
      }
      return null; // Don't render anything if not own profile or not fetched/loading
    }
    return null; // Should not happen with current activeView values
  };

  // Main Component Return (Handles initial page loading/errors before rendering profile structure)

  // --- DIAGNOSTIC LOGS ---
  // These logs will help us see the state right before the component decides what to render.
  if (pageLoading) {
      console.log("[ProfilePage Render] Status: Loading", {
          pageLoading: pageLoading,
          pageError: pageError,
          profileData: profileData,
          paramsUserId: paramsUserId,
          loggedInUser: loggedInUser?._id,
          isSelf: isSelf // Check if this derived state is correct while loading (it might not be until data loads)
      });
      return <div className={styles.pageLoading}><LoadingSpinner size="large"/></div>;
  }

  if (pageError) {
      console.log("[ProfilePage Render] Status: Error", {
           pageLoading: pageLoading, // Should be false
           pageError: pageError,     // Should be the error object/string
           profileData: profileData, // Should be null
           paramsUserId: paramsUserId,
           loggedInUser: loggedInUser?._id,
           isSelf: isSelf,
           errorMessage: pageError // Log the actual error message
      });
      return <div className={styles.pageError}><ErrorMessage message={pageError} /></div>;
  }

  // Render profile only if profileData is available after loading and no pageError
  if (!profileData) {
       // This case should ideally be caught by pageError or pageLoading, but as a fallback:
        console.log("[ProfilePage Render] Status: Not Loading, No Error, but NO Profile Data", {
           pageLoading: pageLoading, // Should be false
           pageError: pageError,     // Should be null
           profileData: profileData, // Should be null
           paramsUserId: paramsUserId,
           loggedInUser: loggedInUser?._id,
           isSelf: isSelf // Check if this derived state is correct
        });
      return <div className={styles.pageError}><ErrorMessage message="Profile data could not be loaded." /></div>;
  }

  // If we reach here, profileData should be available and no page error.
  // Proceed with rendering the main profile JSX.
  console.log("[ProfilePage Render] Status: Rendering Profile", {
      pageLoading: pageLoading, // Should be false
      pageError: pageError,     // Should be null
      profileData: profileData, // Should be an object. >>> EXPAND THIS IN CONSOLE <<<
      paramsUserId: paramsUserId,
      loggedInUser: loggedInUser?._id,
      isSelf: isSelf, // Check if this derived state is correct (true for own, false for others)
      activeView: activeView,
      followerCount: followerCount,
      followingCount: followingCount,
      isFollowingStatus: isFollowingStatus,
      isFollowingLoading: isFollowingLoading
  });
  // --- END DIAGNOSTIC LOGS ---


  // Correctly calculate profileImageUrl AFTER profileData is confirmed available
   const profileImageUrl = profileData?.profilePictureUrl
      ? getStaticFileUrl(profileData.profilePictureUrl)
      : defaultAvatar;


  return (
    <div className={styles.profilePage}>
      {/* --- Profile Header Section --- */}
      <div className={styles.profileHeader}>
          <img
              src={profileImageUrl}
              alt={`${displayName || 'User'}'s avatar`}
              className={styles.profileAvatar}
              onError={(e) => { e.target.onerror = null; e.target.src=defaultAvatar }}
          />
          <div className={styles.profileInfo}>
              <h1 className={styles.profileName}>{displayName}</h1>
              {/* Only show @username if displayName is also set, otherwise displayName is the username */}
              {profileData.displayName && <p className={styles.profileUsername}>@{profileData.username}</p>}
              {profileData.bio && <p className={styles.profileBio}>{profileData.bio}</p>}
              {profileData.location && <p className={styles.profileLocation}>📍 {profileData.location}</p>}

              {/* --- NEW: Follower/Following Counts Display (now using Links) --- */}
               <div className={styles.followCounts}>
                   {/* Only display counts if profileData is loaded */}
                   {profileData && profileData._id && ( // Ensure profileData and its ID are available
                       <>
                           {/* Use /users/ path consistent with App.js */}
                           <Link to={`/users/${profileData._id}/followers`} className={styles.followCountLink}>
                               <span><strong>{followerCount}</strong> Followers</span>
                           </Link>
                           {/* Use /users/ path consistent with App.js */}
                           <Link to={`/users/${profileData._id}/following`} className={styles.followCountLink}>
                               <span><strong>{followingCount}</strong> Following</span>
                           </Link>
                       </>
                   )}
               </div>
              {/* --- END NEW --- */}

              <p className={styles.profileJoined}>Joined: {new Date(profileData.createdAt).toLocaleDateString()}</p>

              {/* --- Action Buttons (Edit or Follow/Unfollow) --- */}
              <div className={styles.actionButtons}>
                  {viewingOwnProfile ? (
                      // Show Edit Profile button for own profile - uses /profile/edit route
                      <Link to="/profile/edit" className={styles.editProfileButton}>
                          Edit Profile
                      </Link>
                  ) : (
                      // Show Follow/Unfollow button for other users' profiles IF logged in and profileData exists
                      renderFollowButton() // Call the helper function
                  )}
              </div>
              {/* --- Display follow error message below buttons if needed --- */}
              {isFollowingError && !isFollowingLoading && <ErrorMessage message={isFollowingError} />}

              {/* --- End Action Buttons --- */}
          </div>
      </div>

      {/* --- View Toggle (Only for Own Profile) --- */}
      {viewingOwnProfile && ( // Use viewingOwnProfile derived state
        <div className={styles.viewToggleContainer}>
          <button
            className={`${styles.toggleButton} ${activeView === 'created' ? styles.active : ''}`}
            onClick={() => setActiveView('created')}
            disabled={activeView === 'created'} // Disable while already on this tab
          >
            My Creations ({createdConnections.length})
             {/* Don't show specific loading spinner here, pageLoading covers initial load */}
          </button>
          <button
            className={`${styles.toggleButton} ${activeView === 'favorites' ? styles.active : ''}`}
            onClick={() => setActiveView('favorites')}
            disabled={activeView === 'favorites' || loadingFavorites} // Disable while already on this tab or favorites are loading
          >
            My Favorites ({loggedInUser?.favorites?.length || 0})
            {loadingFavorites && <LoadingSpinner size="small" inline marginLeft="0.5rem" />}
          </button>
        </div>
      )}
      {/* If viewing another user's profile, only the 'Created Connections' list is relevant and we need a title */}
      {/* Ensure profileData is available before showing this title */}
      {!viewingOwnProfile && profileData && (
           <h2 className={styles.sectionTitle}>Connections Added ({createdConnections.length})</h2>
      )}


      {/* --- Connections Section --- */}
      {/* Render the connections list/grid */}
       <div className={styles.connectionsSection}>
            {renderConnections()}
       </div>

    </div>
  );
};

export default ProfilePage;
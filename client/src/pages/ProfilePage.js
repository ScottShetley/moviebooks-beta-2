// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'; // <-- Import useLocation
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
  const location = useLocation(); // <-- Initialize useLocation

  // State for profile info
  const [profileData, setProfileData] = useState(null);
  // Use a single loading state for the initial profile/created connections fetch
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageError, setPageError] = useState(null); // For errors during initial fetch

  // State for connection lists
  const [createdConnections, setCreatedConnections] = useState([]);
  // We'll mostly rely on pageError for initial created connections errors,
  // but keeping a dedicated state could be useful if we add separate fetches later.
  // const [errorCreated, setErrorCreated] = useState(null);

  const [favoriteConnections, setFavoriteConnections] = useState([]);
  const [activeView, setActiveView] = useState('created'); // Default view
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [errorFavorites, setErrorFavorites] = useState(null);
  const [favoritesFetched, setFavoritesFetched] = useState(false); // To prevent re-fetching favorites unnecessarily

  // State for Follow Status and Counts
  const [isFollowingStatus, setIsFollowingStatus] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isFollowingError, setIsFollowingError] = useState(null);
  const [isSelf, setIsSelf] = useState(false); // To know if viewing own profile for button logic
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);


  // Check if viewing own profile (derived state). Use profileData?._id after it's successfully fetched
  // This also updates when profileData changes
  const viewingOwnProfile = loggedInUser && profileData && loggedInUser._id === profileData._id;


  // Combined Update/Delete Callbacks (used for both created and favorites lists)
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


  // Effect 1: Read URL hash and set activeView state
  useEffect(() => {
    console.log("[ProfilePage Effect 1] Reading hash:", location.hash);
    if (location.hash === '#favorites') {
      setActiveView('favorites');
    } else {
      setActiveView('created');
    }
    // This effect should react to changes in the URL path or hash
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash]); // Depend on location changes


  // Effect 2: Fetch Initial Profile Data, Created Connections, and Follow Status
  useEffect(() => {
     console.log("[ProfilePage Effect 2] Starting Effect 2..."); // LOG 1
     console.log("[ProfilePage Effect 2] Effect dependencies:", { paramsUserId, loggedInUser: loggedInUser?._id, authLoading, locationPathname: location.pathname }); // LOG 2

     // Wait for auth to load to know if logged in
    if (authLoading) {
        console.log("[ProfilePage Effect 2] authLoading is true, returning early."); // LOG 3a
        setInitialLoading(true); // Ensure loading is true while waiting for auth
        return;
    }

    console.log("[ProfilePage Effect 2] authLoading is false."); // LOG 3b

    // If no userId in params and not logged in after auth loads, redirect to login
    if (!paramsUserId && !loggedInUser) {
        console.log("[ProfilePage Effect 2] No user ID in params and not logged in. Redirecting."); // LOG 4a
        navigate('/login', { replace: true, state: { from: location.pathname } }); // Use current path for 'from'
        return;
    }

     console.log("[ProfilePage Effect 2] User ID determined."); // LOG 4b
    // Determine the actual userId to fetch profile for
    // Use paramsUserId if it exists. If not, and loggedInUser exists, use loggedInUser._id (for own profile)
    const idToFetch = paramsUserId || loggedInUser?._id;

    console.log("[ProfilePage Effect 2] idToFetch:", idToFetch); // LOG 5


    // If still no ID (shouldn't happen if logic above is correct, but a safeguard)
    if (!idToFetch) {
        console.error("[ProfilePage Effect 2] No ID determined to fetch profile. Returning early."); // LOG 6a
        setInitialLoading(false);
        setPageError("No user specified or found.");
        return;
    }

     console.log("[ProfilePage Effect 2] ID to fetch profile is available."); // LOG 6b


    console.log(`[ProfilePage Effect 2] Fetching initial data for user ID: ${idToFetch}`); // LOG 7
    setInitialLoading(true); // Start initial loading
    setPageError(null); // Clear previous page errors
    setProfileData(null); // Clear previous profile data
    setCreatedConnections([]); // Clear previous connections

    // Reset favorites specific states as well, as a new profile means new favorites list
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
        console.log(`[ProfilePage Effect 2] Inside fetchInitialData async function for ID: ${idToFetch}`); // LOG 8
        // Fetch profile and created connections concurrently
        console.log(`[ProfilePage Effect 2] Calling getPublicUserProfile(${idToFetch}) and getUserConnections(${idToFetch})...`); // LOG 9
        const [profileRes, connectionsRes] = await Promise.all([
          getPublicUserProfile(idToFetch),
          getUserConnections(idToFetch)
        ]);
        console.log(`[ProfilePage Effect 2] API calls completed. Profile status: ${profileRes.status}, Connections status: ${connectionsRes.status}`); // LOG 10


        setProfileData(profileRes.data);
        setCreatedConnections(connectionsRes.data || []);

        // Extract and set follower/following counts from the fetched profile
        setFollowerCount(profileRes.data.followerCount || 0);
        setFollowingCount(profileRes.data.followingCount || 0);


        // Determine if the fetched profile belongs to the logged-in user
        const isCurrentUser = loggedInUser && loggedInUser._id === profileRes.data._id;
        setIsSelf(isCurrentUser); // Set isSelf based on fetched profile data

        // Fetch Follow Status if viewing another user's profile AND logged in
        if (!isCurrentUser && loggedInUser) {
            console.log(`[ProfilePage Effect 2] Checking follow status for user ${loggedInUser._id} following ${idToFetch}`);
            setIsFollowingLoading(true);
            try {
                const followStatusRes = await isFollowing(idToFetch);
                setIsFollowingStatus(followStatusRes.data.isFollowing);
                console.log(`[ProfilePage Effect 2] Follow status: ${followStatusRes.data.isFollowing}`);

            } catch (followErr) {
                 const followErrorMessage = followErr.response?.data?.message || followErr.message || "Failed to check follow status.";
                 console.error("[ProfilePage Effect 2] Error checking follow status:", followErr);
                 setIsFollowingError(followErrorMessage);
                 setIsFollowingStatus(false); // Assume not following on error
            } finally {
                 setIsFollowingLoading(false);
            }
        } else if (isCurrentUser) {
             console.log("[ProfilePage Effect 2] Viewing own profile. Skipping follow status check.");
             setIsSelf(true); // Explicitly set isSelf true if it's own profile
        } else if (!loggedInUser) {
             console.log("[ProfilePage Effect 2] Not logged in. Cannot check/show follow button.");
             setIsSelf(false); // Explicitly set isSelf false if not logged in
        }
        // End Fetch Follow Status

      } catch (err) {
        console.error("[ProfilePage Effect 2] Error during initial fetch:", err); // Log full error object

        let message = err.response?.data?.message || err.message || "Failed to load profile data.";

        // Check specifically for the 404 status code from the backend
        if (err.response?.status === 404) {
             // Use a more specific message for 404s, which might indicate a private profile
             message = "User not found or profile is private.";
             console.warn(`[ProfilePage Effect 2] Received 404 for user ID ${idToFetch}. Displaying private/not found message.`);
        } else {
             // For other errors, use the default error message
             console.error(`[ProfilePage Effect 2] Non-404 error (${err.response?.status || 'network'}): ${message}`);
        }

        setPageError(message); // Set the state with the determined message
        setProfileData(null); // Ensure profileData is null on *any* error
        setCreatedConnections([]); // Ensure connections are empty on *any* error
        // Reset counts on error
        setFollowerCount(0);
        setFollowingCount(0);

      } finally {
        console.log("[ProfilePage Effect 2] fetchInitialData finished."); // LOG 11
        setInitialLoading(false); // End initial loading
      }
    };

     // Only fetch if we have an ID to fetch
    if (idToFetch) {
        console.log("[ProfilePage Effect 2] Calling fetchInitialData..."); // LOG 12
        fetchInitialData();
    } else {
        console.log("[ProfilePage Effect 2] No ID to fetch, not calling fetchInitialData."); // LOG 13
    }


    // Dependencies: authLoading, paramsUserId, loggedInUser, navigate, location.pathname
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, paramsUserId, loggedInUser, navigate, location.pathname]);


  // Effect 3: Fetch Favorite Connections (This effect only runs for the logged-in user's profile when favorites view is active)
  useEffect(() => {
    // Only fetch if viewing own profile, 'favorites' tab is active, favorites not fetched, and not already loading
    // Check loggedInUser?._id against profileData?._id to be sure it's the logged-in user's *fetched* profile
    // Also ensure loggedInUser and their favorites list exists before attempting to fetch
    if (loggedInUser?._id === profileData?._id && activeView === 'favorites' && !favoritesFetched && !loadingFavorites && loggedInUser?.favorites) {
      const fetchFavorites = async () => {
        setLoadingFavorites(true); // Start favorites loading
        setErrorFavorites(null); // Clear previous favorites errors
        console.log("[ProfilePage Effect 3] Fetching favorite connections.");
        try {
          const favoriteIds = loggedInUser.favorites; // Favorites list is on the loggedInUser context object
          if (favoriteIds.length > 0) {
            const response = await getConnectionsByIds(favoriteIds);
            setFavoriteConnections(response.data || []);
            console.log(`[ProfilePage Effect 3] Found ${response.data?.length || 0} favorites.`);
          } else {
            setFavoriteConnections([]); // Set empty array if no favorites IDs
            console.log("[ProfilePage Effect 3] No favorite IDs found for user.");
          }
          setFavoritesFetched(true); // Mark as fetched on success
        } catch (err) {
          const message = err.response?.data?.message || err.message || "Failed to load favorites.";
          setErrorFavorites(message);
          setFavoriteConnections([]); // Clear list on error
          setFavoritesFetched(false); // Allow retry if there was an error
          console.error("[ProfilePage Effect 3] Error fetching favorites:", err);
        } finally {
          setLoadingFavorites(false); // End favorites loading
        }
      };

      // Only fetch if we are viewing our own profile AND the activeView is 'favorites'
      // This check is already in the outer if, but reinforcing intent.
      if (viewingOwnProfile && activeView === 'favorites') {
           fetchFavorites();
      }

    } else if (activeView === 'favorites' && (!loggedInUser || loggedInUser?._id !== profileData?._id)) {
        // Log or handle the case where favorites view is somehow active but not viewing own profile
        // This should be prevented by UI render logic and the initial checks in this effect.
        console.warn("[ProfilePage Effect 3] Favorites view active but not viewing own profile. Resetting view.");
        setActiveView('created'); // Auto-switch back if somehow in this state
    }
     // Dependencies: activeView, loggedInUser (to get favorites list & _id), profileData (_id check), favoritesFetched
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, loggedInUser, profileData, favoritesFetched]);


  // Follow/Unfollow Handlers (No changes needed here, they use existing state)
  const handleFollow = async () => {
    if (isSelf || !loggedInUser || isFollowingLoading || !profileData?._id) { console.warn("[ProfilePage] Follow attempted under invalid conditions."); return; }
    console.log(`[ProfilePage] Attempting to follow user ${profileData._id}`);
    setIsFollowingLoading(true); setIsFollowingError(null);
    try { await followUser(profileData._id); setIsFollowingStatus(true); setFollowerCount(prevCount => prevCount + 1); console.log(`Successfully followed user ${profileData.username}`); }
    catch (err) { const message = err.response?.data?.message || err.message || "Failed to follow user."; setIsFollowingError(message); console.error("[ProfilePage] Follow Error:", err); setIsFollowingStatus(false); setFollowerCount(prevCount => Math.max(0, prevCount - 1)); }
    finally { setIsFollowingLoading(false); }
  };

  const handleUnfollow = async () => {
    if (isSelf || !loggedInUser || !isFollowingStatus || isFollowingLoading || !profileData?._id) { console.warn("[ProfilePage] Unfollow attempted under invalid conditions."); return; }
    console.log(`[ProfilePage] Attempting to unfollow user ${profileData._id}`);
    setIsFollowingLoading(true); setIsFollowingError(null);
     try { await unfollowUser(profileData._id); setIsFollowingStatus(false); setFollowerCount(prevCount => Math.max(0, prevCount - 1)); console.log(`Successfully unfollowed user ${profileData.username}`); }
     catch (err) { const message = err.response?.data?.message || err.message || "Failed to unfollow user."; setIsFollowingError(message); console.error("[ProfilePage] Unfollow Error:", err); setIsFollowingStatus(true); setFollowerCount(prevCount => prevCount + 1); }
     finally { setIsFollowingLoading(false); }
  };

  // Helper function to render a list of connections (created or favorites)
  const renderConnectionsList = (connections, loading, error) => { // Removed isOwnProfileForCard param - now using viewingOwnProfile + activeView inside card
      console.log("[renderConnectionsList] Rendering list", {
          connectionsReceived: connections,
          connectionsCount: connections?.length, // Use ?. for safety
          loading: loading,
          error: error,
          activeView: activeView, // Check which view it's rendering for
          // Add profileData details here to see if it's available
          profileDataAvailable: !!profileData,
          viewingOwnProfileCheck: viewingOwnProfile // See the derived state value
      }); // <-- NEW LOG

      if (loading) return <div className={styles.loadingSection}><LoadingSpinner /> Loading...</div>;
      if (error) return <ErrorMessage message={error} />;

      // The length check should be inside the list renderer
      if (!Array.isArray(connections) || connections.length === 0) { // Added array check for robustness
        console.log("[renderConnectionsList] Connections list is empty or not an array, showing empty message."); // NEW LOG for empty case
        let message;
        if (viewingOwnProfile) { // Use the component-level viewingOwnProfile
          message = activeView === 'created'
            ? "You haven't added any connections yet."
            : "You haven't favorited any connections yet.";
        } else {
           // For other users, we only show 'created' list, so the message is simpler
           message = `${displayName || 'This user'} hasn't added any connections yet.`;
        }
        return <p className={styles.emptyMessage}>{message}</p>;
      }

      console.log(`[renderConnectionsList] Rendering ${connections.length} connections.`); // NEW LOG for non-empty case
      return (
          <div className={styles.connectionsGrid}>
              {connections.map((connection) => {
                   console.log("[renderConnectionsList] Mapping connection:", connection?._id); // NEW LOG inside map
                   if (!connection?._id) {
                       console.warn("[renderConnectionsList] Skipping rendering for connection object without _id:", connection); // Warn if missing ID
                       return null; // Skip if no ID
                   }
                   return (
                       <ConnectionCard
                           key={connection._id}
                           connection={connection}
                           onUpdate={updateConnectionInBothLists}
                           onDelete={deleteConnectionFromBothLists}
                           // isAuthor prop for the card's edit/delete *connection* buttons
                           // Only allow editing/deleting the connection itself if viewing own profile AND on the 'created' tab AND the logged-in user is the connection's author
                           isAuthor={viewingOwnProfile && activeView === 'created' && connection.author === loggedInUser?._id}
                           // Note: Favoriting/Unfavoriting is handled inside ConnectionCard based on loggedInUser.favorites
                       />
                   );
              })}
          </div>
      );
  };


  // Determine display name
  const displayName = profileData?.displayName || profileData?.username;

  // Render Logic for Follow Button
  const renderFollowButton = () => {
      if (isSelf || authLoading || !loggedInUser || !profileData || pageError) { return null; }
      const buttonContent = isFollowingLoading ? (<LoadingSpinner size="small" inline color="white" />) : (isFollowingStatus ? 'Following' : 'Follow');
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


  // Main Component Return (Handles initial page loading/errors before rendering profile structure)

  // --- DIAGNOSTIC LOGS ---
  // Keeping logs to help debug state transitions
  // console.log("[ProfilePage Render]", { initialLoading, pageError, profileData: profileData ? { _id: profileData._id, username: profileData.username, isPrivate: profileData.isPrivate } : null, paramsUserId, loggedInUser: loggedInUser?._id, isSelf, viewingOwnProfile, activeView, followerCount, followingCount, isFollowingStatus, isFollowingLoading, createdConnectionsCount: createdConnections.length, favoriteConnectionsCount: favoriteConnections.length, loadingFavorites, favoritesFetched, locationHash: location.hash });
  // --- END DIAGNOSTIC LOGS ---


  // Handle initial page loading state
  if (initialLoading) {
      console.log("[ProfilePage Render] Rendering Loading Spinner"); // LOG RENDER A
      return <div className={styles.pageLoading}><LoadingSpinner size="large"/></div>;
  }

  // Handle page error state (including the specific message for private/not found)
  if (pageError) {
       console.log("[ProfilePage Render] Rendering Error Message:", pageError); // LOG RENDER B
      return <div className={styles.pageError}><ErrorMessage message={pageError} /></div>;
  }

  // Fallback if profileData is unexpectedly null after loading ends without error
  if (!profileData) {
       console.error("[ProfilePage Render] unexpected state: not loading, no error, but no profileData"); // LOG RENDER C
       return <div className={styles.pageError}><ErrorMessage message="Profile data could not be loaded." /></div>;
  }

  // If we reach here, profileData is available and no page error occurred.
   console.log("[ProfilePage Render] Rendering Profile Content"); // LOG RENDER D
  // Correctly calculate profileImageUrl AFTER profileData is confirmed available
   const profileImageUrl = profileData?.profilePictureUrl
      ? getStaticFileUrl(profileData.profilePictureUrl)
      : defaultAvatar;


  return (
    <div className={styles.profilePage}>
      {/* ... (rest of the JSX remains unchanged) ... */}
       <div className={styles.profileHeader}>
          <img
              src={profileImageUrl}
              alt={`${displayName || 'User'}'s avatar`}
              className={styles.profileAvatar}
              onError={(e) => { e.target.onerror = null; e.target.src=defaultAvatar }} // Fallback on error
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
                      <Link to="/profile/edit" className={styles.editProfileButton}>
                          Edit Profile
                      </Link>
                  ) : (
                      renderFollowButton()
                  )}
              </div>
              {isFollowingError && !isFollowingLoading && <ErrorMessage message={isFollowingError} />}
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
            {/* Conditionally call the helper based on activeView and if it's the user's own profile */}
            {/* Pass initialLoading and pageError for the created list. The renderConnectionsList will handle these. */}
            {activeView === 'created' && renderConnectionsList(createdConnections, initialLoading, pageError)}
            {/* Pass favorites specific loading/error. This is only rendered for own profile. */}
            {activeView === 'favorites' && viewingOwnProfile && renderConnectionsList(favoriteConnections, loadingFavorites, errorFavorites)}
       </div>

    </div>
  );
};

export default ProfilePage;
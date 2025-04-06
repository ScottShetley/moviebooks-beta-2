// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { getConnectionsByIds } from '../services/api'; // <-- Import getConnectionsByIds
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import styles from './ProfilePage.module.css'; // <-- Import the CSS module

const ProfilePage = () => {
  const { userId: paramsUserId } = useParams();
  const { user: loggedInUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const userIdToView = paramsUserId || loggedInUser?._id;
  const isOwnProfile = loggedInUser && userIdToView === loggedInUser._id;

  // State for profile info
  const [profileUsername, setProfileUsername] = useState(null);
  const [pageLoading, setPageLoading] = useState(true); // Overall page loading (for username/initial creations)
  const [pageError, setPageError] = useState(null); // Overall page error

  // State for connection lists and their status
  const [createdConnections, setCreatedConnections] = useState([]);
  const [favoriteConnections, setFavoriteConnections] = useState([]);
  const [activeView, setActiveView] = useState('created'); // 'created' or 'favorites'
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [errorFavorites, setErrorFavorites] = useState(null);
  const [favoritesFetched, setFavoritesFetched] = useState(false); // Track if favorites have been fetched

  // --- Combined Update/Delete Callbacks ---
  // These will update *both* lists if the connection exists in them
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
    // Note: AuthContext update for user.favorites is handled within ConnectionCard's handleDelete
  }, []);

  // --- Fetch Initial Profile Data (Username and Created Connections) ---
  useEffect(() => {
    // Skip if we don't have a user ID or if auth is loading for own profile
    if (!userIdToView || (isOwnProfile && authLoading)) {
        setPageLoading(isOwnProfile && authLoading); // Keep loading if auth is pending for own profile
        if (!paramsUserId && !authLoading && !loggedInUser) {
            setPageError("Please log in to view your profile."); // Error if trying own profile but not logged in
        }
        return;
    }

    const fetchInitialData = async () => {
      console.log(`[ProfilePage Initial Fetch] Fetching data for user ID: ${userIdToView}`);
      setPageLoading(true);
      setPageError(null);
      setProfileUsername(null);
      setCreatedConnections([]);
      setActiveView('created'); // Reset view on user change
      setFavoritesFetched(false); // Reset favorites fetch status
      setFavoriteConnections([]);
      setErrorFavorites(null);

      try {
        let fetchedUsername = null;
        let fetchedConnections = [];

        // Use AuthContext for own username, fetch connections separately
        if (isOwnProfile) {
          if (!loggedInUser?.username) throw new Error("Logged in user data incomplete.");
          fetchedUsername = loggedInUser.username;
          console.log("[ProfilePage Initial Fetch] Fetching CREATED connections for own profile...");
          const connectionsRes = await api.get(`/connections/user/${userIdToView}`);
          fetchedConnections = connectionsRes.data || []; // API returns array directly now
          console.log(`[ProfilePage Initial Fetch] Found ${fetchedConnections.length} created connections.`);
        } else {
          // Fetch other user's data - expecting endpoint to provide username and connections
          console.log("[ProfilePage Initial Fetch] Fetching CREATED connections and username for other user...");
          // Let's assume a combined endpoint for simplicity now, adjust if needed
          // Example: GET /api/users/:userId/profile - returns { username, connections: [...] }
          // OR stick to the connections endpoint if it also returns username
          // Let's use /connections/user/:userId and assume it somehow gives username too,
          // or make a separate call if needed. For now, let's assume a hypothetical combined endpoint or logic.
          // A simpler approach: fetch username first, then connections.
          try {
             // Hypothetical: Fetch just the username first
             // const userRes = await api.get(`/users/${userIdToView}/basic-info`); // Needs backend route
             // fetchedUsername = userRes.data.username;
             // If no such endpoint, we might have to rely on the first connection's userRef
          } catch (userErr) {
             // Handle unable to get username specifically
          }

          const connectionsRes = await api.get(`/connections/user/${userIdToView}`);
          fetchedConnections = connectionsRes.data || [];
          // If username wasn't fetched separately, try getting it from the connections list
          if (!fetchedUsername && fetchedConnections.length > 0 && fetchedConnections[0].userRef) {
              fetchedUsername = fetchedConnections[0].userRef.username;
          } else if (!fetchedUsername) {
             // Still no username? Might be an issue or user has no connections
             fetchedUsername = `User ${userIdToView.substring(0, 8)}...`; // Fallback display name
             console.warn("Could not determine profile username.");
          }
          console.log(`[ProfilePage Initial Fetch] Found ${fetchedConnections.length} created connections for user ${fetchedUsername}.`);
        }

        setProfileUsername(fetchedUsername);
        setCreatedConnections(fetchedConnections);

      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to load profile data.";
        console.error("Fetch initial profile data error:", err);
        if (err.response?.status === 404) {
             setPageError("User not found.");
        } else {
            setPageError(message);
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchInitialData();
  }, [userIdToView, isOwnProfile, loggedInUser, authLoading]); // Re-run if user changes or auth loads

  // --- Fetch Favorite Connections When View Changes ---
  useEffect(() => {
    // Only fetch if:
    // 1. Viewing own profile
    // 2. Active view is 'favorites'
    // 3. Favorites haven't been fetched yet
    // 4. We have the loggedInUser object with favorites array
    if (isOwnProfile && activeView === 'favorites' && !favoritesFetched && loggedInUser?.favorites) {
        const fetchFavorites = async () => {
            console.log("[ProfilePage Fav Fetch] Fetching favorite connections...");
            setLoadingFavorites(true);
            setErrorFavorites(null);
            try {
                const favoriteIds = loggedInUser.favorites;
                if (favoriteIds.length === 0) {
                     console.log("[ProfilePage Fav Fetch] User has no favorite IDs. Skipping API call.");
                     setFavoriteConnections([]); // Ensure list is empty
                } else {
                    console.log(`[ProfilePage Fav Fetch] Calling API with ${favoriteIds.length} IDs.`);
                    const response = await getConnectionsByIds(favoriteIds); // Use the API service function
                    setFavoriteConnections(response.data || []);
                    console.log(`[ProfilePage Fav Fetch] Received ${response.data?.length || 0} favorite connections.`);
                }
                setFavoritesFetched(true); // Mark as fetched (even if empty)
            } catch (err) {
                const message = err.response?.data?.message || err.message || "Failed to load favorites.";
                console.error("Fetch favorite connections error:", err);
                setErrorFavorites(message);
                setFavoriteConnections([]); // Clear on error
                setFavoritesFetched(false); // Allow retry by setting fetched to false
            } finally {
                setLoadingFavorites(false);
            }
        };
        fetchFavorites();
    }
    // This effect depends on when the user switches the view or when user data (favorites list) changes
  }, [activeView, isOwnProfile, loggedInUser, favoritesFetched]);

  // --- Redirect Logic (No change needed) ---
  useEffect(() => {
      if (!paramsUserId && !authLoading && !loggedInUser) {
          navigate('/login', { replace: true, state: { from: '/profile' } });
      }
  }, [paramsUserId, authLoading, loggedInUser, navigate]);

  // --- Render Logic ---
  const renderConnections = () => {
    if (activeView === 'created') {
        if (pageLoading) return null; // Handled by main spinner
        if (pageError && createdConnections.length === 0) return null; // Handled by main error message

        return (
            <>
                <h2 className={styles.sectionTitle}>Connections Added:</h2>
                {createdConnections.length === 0 ? (
                    <p className={styles.emptyMessage}>{isOwnProfile ? "You haven't" : `${profileUsername || 'This user'} hasn't`} added any connections yet.</p>
                ) : (
                    <div>
                        {createdConnections.map((connection) => (
                            <ConnectionCard
                                key={`created-${connection._id}`} // Add prefix for key uniqueness
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
        if (!isOwnProfile) return null; // Should not happen, but safeguard

        if (loadingFavorites) {
            return <div className={styles.loadingSection}><LoadingSpinner /> Loading Favorites...</div>;
        }
        if (errorFavorites) {
            return <ErrorMessage message={errorFavorites} />;
        }
        // Only show after fetch attempt is complete (loading false, fetched true)
        if (!loadingFavorites && favoritesFetched) {
             return (
                <>
                    <h2 className={styles.sectionTitle}>My Favorites:</h2>
                    {favoriteConnections.length === 0 ? (
                        <p className={styles.emptyMessage}>You haven't favorited any connections yet.</p>
                    ) : (
                        <div>
                            {favoriteConnections.map((connection) => (
                                <ConnectionCard
                                    key={`favorite-${connection._id}`} // Add prefix for key uniqueness
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
        return null; // Return null if not loading but also not fetched yet
    }
    return null; // Default case
  };

  // --- Main Component Return ---
  return (
    <div className={styles.profilePage}>
      {/* Main Page Loading Spinner */}
      {pageLoading && <LoadingSpinner />}

      {/* Main Page Error Message */}
      {!pageLoading && pageError && <ErrorMessage message={pageError} />}

      {/* Profile Content (only render if not loading page and no page error, and username is available) */}
      {!pageLoading && !pageError && profileUsername && (
        <>
          <h1>{profileUsername}'s Profile</h1>
          {isOwnProfile && <p>(This is your public profile)</p>}

          {/* View Toggle Buttons (Only for Own Profile) */}
          {isOwnProfile && (
            <div className={styles.viewToggleContainer}>
              <button
                className={`${styles.toggleButton} ${activeView === 'created' ? styles.active : ''}`}
                onClick={() => setActiveView('created')}
                disabled={activeView === 'created'}
              >
                My Creations ({createdConnections.length})
              </button>
              <button
                className={`${styles.toggleButton} ${activeView === 'favorites' ? styles.active : ''}`}
                onClick={() => setActiveView('favorites')}
                disabled={activeView === 'favorites' || loadingFavorites} // Disable while loading favorites too
              >
                My Favorites ({loggedInUser?.favorites?.length || 0}) {/* Show count from user object */}
                {loadingFavorites && <LoadingSpinner size="small" inline marginLeft="0.5rem" />}
              </button>
            </div>
          )}

          {/* Render the selected connections list */}
          {renderConnections()}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
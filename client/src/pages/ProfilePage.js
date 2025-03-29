// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
// --- MODIFICATION START: Corrected Import Paths ---
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
// --- MODIFICATION END: Corrected Import Paths ---

// Optional: Add page-specific styles if needed later
// import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { userId: paramsUserId } = useParams(); // Get userId from URL if present
  const { user: loggedInUser, loading: authLoading } = useAuth(); // Get logged-in user info and auth loading status
  const navigate = useNavigate();

  // Determine which user's profile to view: URL param or logged-in user
  const userIdToView = paramsUserId || loggedInUser?._id;
  // Check if the profile being viewed is the logged-in user's own profile
  const isOwnProfile = loggedInUser && userIdToView === loggedInUser._id;

  // State for username and connections
  const [profileUsername, setProfileUsername] = useState(null); // State to hold the username of the profile being viewed
  const [connections, setConnections] = useState([]); // State holding the connections for this profile
  const [loading, setLoading] = useState(true); // Page-specific loading state
  const [error, setError] = useState(null); // Page-specific error state

  // Callback passed to ConnectionCard to update state locally after a like/unlike action
  const updateConnectionInState = useCallback((updatedConnection) => {
    setConnections(prevConnections =>
      prevConnections.map(conn =>
        conn._id === updatedConnection._id ? updatedConnection : conn
      )
    );
  }, []);

  // Callback passed to ConnectionCard to remove connection from state after deletion
  const handleDeleteConnection = useCallback((deletedConnectionId) => {
    setConnections(prevConnections =>
      prevConnections.filter(conn => conn._id !== deletedConnectionId)
    );
    // console.log(`Connection ${deletedConnectionId} removed from ProfilePage state.`);
  }, []);

  // Effect to fetch profile data (username and connections)
  useEffect(() => {
    // Don't fetch if we don't know who to view yet, or if auth is still loading for own profile
    if (!userIdToView || (isOwnProfile && authLoading)) {
        // If viewing own profile but auth is loading, keep page loading state true
        if (isOwnProfile && authLoading) {
             setLoading(true);
        } else if (!paramsUserId && !authLoading && !loggedInUser) {
             // If trying to view own profile but not logged in and auth check finished
             setError("Please log in to view your profile.");
             setLoading(false);
        } else {
             setLoading(false);
        }
        return; // Exit effect early
    }

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      setProfileUsername(null); // Reset username on new fetch
      setConnections([]); // Reset connections on new fetch

      try {
        // Fetch based on own profile vs other
        if (isOwnProfile) {
          // For own profile, get username directly from AuthContext
          if (loggedInUser?.username) {
            setProfileUsername(loggedInUser.username);
            // Fetch connections separately
            const connectionsRes = await api.get(`/users/${userIdToView}/connections`);
            // The response for this endpoint now contains { profileUsername, connections }
            setConnections(connectionsRes.data.connections || []); // Use connections array, default to empty if missing
          } else {
             console.warn("Logged in user data missing username.");
             setError("Could not load profile information.");
          }
        } else {
          // For other user's profile, fetch connections which includes the username
          const profileRes = await api.get(`/users/${userIdToView}/connections`);
          // API response is now { profileUsername: "...", connections: [...] }
          if (profileRes.data?.profileUsername) {
             setProfileUsername(profileRes.data.profileUsername);
             setConnections(profileRes.data.connections || []); // Use connections array
          } else {
              // Handle case where user exists but maybe has no username in DB yet? (Shouldn't happen with new logic)
              // Or API response format changed unexpectedly.
              const userCheck = await api.get(`/users/${userIdToView}/profile`); // Hypothetical endpoint to just check user existence/basic info
              if (userCheck.data) {
                   setProfileUsername(userCheck.data.username || `User ${userIdToView}`); // Fallback display
                   setError("Profile connections could not be loaded fully."); // Inform user
              } else {
                   throw new Error("Profile data is missing expected information.");
              }
              setConnections([]); // Ensure connections are empty if main data failed
          }
        }

      } catch (err) {
         const message = err.response?.data?.message || err.message || "Failed to load profile data.";
         console.error("Fetch profile data error:", err);
         if (err.response?.status === 404) {
              setError("User not found.");
         } else if (err.response?.status === 401) {
             setError("You may need to log in again.");
         }
         else {
             setError(message);
         }
         setConnections([]); // Clear connections on error
         setProfileUsername(null); // Clear username on error
      } finally {
        setLoading(false); // Done loading (success or fail)
      }
    };

    fetchProfileData();
    // Dependencies: fetch again if the user ID to view changes, or if auth state potentially updates own user info
  }, [userIdToView, isOwnProfile, loggedInUser, authLoading]);

  // Effect for redirecting if trying to view own profile but not logged in
  useEffect(() => {
      if (!paramsUserId && !authLoading && !loggedInUser) {
          console.log("Redirecting to login from ProfilePage effect.");
          navigate('/login', { replace: true, state: { from: '/profile' } }); // Redirect to login, remember where user was going
      }
  }, [paramsUserId, authLoading, loggedInUser, navigate]);


  // Render component
  return (
    <div /* Optional: className={styles.profilePage} */ >
      {(loading || (isOwnProfile && authLoading)) && <LoadingSpinner />}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && profileUsername && (
        <>
          <h1>{profileUsername}'s Profile</h1>

          {isOwnProfile && <p>(This is your public profile)</p>}

          <h2>Connections Added:</h2>
          {connections.length === 0 ? (
             <p>{isOwnProfile ? "You haven't" : `${profileUsername} hasn't`} added any connections yet.</p>
          ) : (
             <div>
               {connections.map((connection) => (
                  <ConnectionCard
                      key={connection._id}
                      connection={connection}
                      onUpdate={updateConnectionInState} // Prop for like/unlike updates
                      onDelete={handleDeleteConnection} // Prop for deleting connection
                  />
               ))}
             </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
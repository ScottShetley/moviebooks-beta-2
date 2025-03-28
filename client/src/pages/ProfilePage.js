// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react'; // Ensure useCallback is imported
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // To get logged-in user info
import api from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';

// Optional: Add page-specific styles
// import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { userId: paramsUserId } = useParams();
  const { user: loggedInUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const userIdToView = paramsUserId || loggedInUser?._id;
  const isOwnProfile = loggedInUser && userIdToView === loggedInUser._id;

  const [profileUserEmail, setProfileUserEmail] = useState(null);
  const [connections, setConnections] = useState([]); // State holding the connections for this profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Callback for ConnectionCard updates (like/favorite)
  const updateConnectionInState = useCallback((updatedConnection) => {
    setConnections(prevConnections =>
      prevConnections.map(conn =>
        conn._id === updatedConnection._id ? updatedConnection : conn
      )
    );
  }, []);

  // --- START OF ADDITION 1 ---
  /**
   * Callback function passed down to each ConnectionCard as 'onDelete'.
   * Removes a connection from the state after it has been successfully deleted.
   */
  const handleDeleteConnection = useCallback((deletedConnectionId) => {
    setConnections(prevConnections =>
      // Filter out the connection using the connections state setter
      prevConnections.filter(conn => conn._id !== deletedConnectionId)
    );
    // console.log(`Connection ${deletedConnectionId} removed from ProfilePage state.`);
  }, []); // Empty dependency array as setConnections is stable
  // --- END OF ADDITION 1 ---

  // Effect to fetch user connections and details
  useEffect(() => {
    if (authLoading || !userIdToView) {
      // ... (existing logic for handling loading/auth states)
      if (!paramsUserId && !authLoading && !loggedInUser) {
          setError("User not found or not logged in.");
          setLoading(false);
      } else if (!paramsUserId && authLoading) {
          setLoading(true);
      }
      else if (!paramsUserId) {
          setLoading(false);
      }
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      setProfileUserEmail(null);
      try {
        const connectionsRes = await api.get(`/users/${userIdToView}/connections`);
        setConnections(connectionsRes.data); // Update connections state

        // ... (existing logic to set profileUserEmail)
        if (isOwnProfile) {
          setProfileUserEmail(loggedInUser.email);
        } else if (connectionsRes.data.length > 0) {
          setProfileUserEmail(connectionsRes.data[0].userRef.email);
        } else {
           setProfileUserEmail(`User ${userIdToView}`);
        }

      } catch (err) {
         // ... (existing error handling)
         const message = err.response?.data?.message || err.message || "Failed to load profile data.";
         console.error("Fetch profile data error:", err);
         if (err.response?.status === 404) {
              setError("User not found.");
         } else {
             setError(message);
         }
         setConnections([]);
         setProfileUserEmail(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [userIdToView, authLoading, isOwnProfile, loggedInUser, paramsUserId]);

  // Effect for handling logout redirect
  useEffect(() => {
      if (!paramsUserId && !authLoading && !loggedInUser) {
          navigate('/login');
      }
  }, [paramsUserId, authLoading, loggedInUser, navigate]);


  // Render component
  return (
    <div /* Optional: className={styles.profilePage} */ >
      {(loading || (!paramsUserId && authLoading)) && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && profileUserEmail && (
        <>
          <h1>{profileUserEmail}'s Profile</h1>
          {isOwnProfile && <p>(This is your profile)</p>}

          <h2>Connections Added:</h2>
          {connections.length === 0 ? (
             <p>{isOwnProfile ? "You haven't" : "This user hasn't"} added any connections yet.</p>
          ) : (
             <div>
               {connections.map((connection) => (
                  <ConnectionCard
                      key={connection._id}
                      connection={connection}
                      onUpdate={updateConnectionInState}
                      onDelete={handleDeleteConnection} // <-- ADDITION 2: Pass delete handler prop
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
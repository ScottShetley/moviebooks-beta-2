// client/src/pages/FollowersPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFollowers, getPublicUserProfile } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import UserListItem from '../components/User/UserListItem';
import styles from './FollowListPage.module.css';
import { useAuth } from '../contexts/AuthContext'; // **CORRECTED PATH** from pages/ to contexts/AuthContext

const FollowersPage = () => {
  const { userId } = useParams(); // Get the ID of the user whose followers we want to see
  const { user: loggedInUser } = useAuth(); // Get logged-in user from AuthContext

  const [followers, setFollowers] = useState([]);
  const [profileUser, setProfileUser] = useState(null); // To display whose list it is
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFollowersAndProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch the profile user's details to display their name
        const profileRes = await getPublicUserProfile(userId);
        setProfileUser(profileRes.data);

        // Fetch the actual list of followers for the user ID from params
        const followersRes = await getFollowers(userId);
        setFollowers(followersRes.data);

      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to load followers.";
        console.error("[FollowersPage] Error fetching data:", err);
         if (err.response?.status === 404) {
             setError("User not found.");
         } else {
            setError(`Error: ${message}`);
         }
         setFollowers([]); // Ensure list is empty on error
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFollowersAndProfile();
    } else {
        setLoading(false);
        setError("No user ID provided in URL.");
    }
  }, [userId]); // Re-fetch if userId changes

  // Determine if the currently viewed profile belongs to the logged-in user
  const isOwnProfile = loggedInUser && profileUser && loggedInUser._id === profileUser._id;

  const displayName = profileUser?.displayName || profileUser?.username || 'User';

  if (loading) return <div className={styles.pageContainer}><LoadingSpinner size="large"/></div>;
  if (error) return <div className={styles.pageContainer}><ErrorMessage message={error} /></div>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>{displayName}'s Followers ({followers.length})</h1>
      {followers.length === 0 ? (
        <p className={styles.emptyMessage}>
          {isOwnProfile // Use the calculated flag
            ? "You don't have any followers yet."
            : `${displayName} doesn't have any followers yet.` // For other users
          }
        </p>
      ) : (
        <ul className={styles.userList}>
          {followers.map((follower) => (
            // Use a new UserListItem component to display each user
            <UserListItem key={follower._id} user={follower} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default FollowersPage;
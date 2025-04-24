// client/src/pages/FollowingPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFollowing, getPublicUserProfile } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import UserListItem from '../components/User/UserListItem';
import styles from './FollowListPage.module.css';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const FollowingPage = () => {
  const { userId } = useParams(); // Get the ID of the user whose 'following' list we want to see
  const { user: loggedInUser } = useAuth(); // Get logged-in user from AuthContext

  const [following, setFollowing] = useState([]);
  const [profileUser, setProfileUser] = useState(null); // To display whose list it is
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFollowingAndProfile = async () => {
      setLoading(true);
      setError(null);
      try {
         // Fetch the profile user's details to display their name
        const profileRes = await getPublicUserProfile(userId);
        setProfileUser(profileRes.data);

        // Fetch the actual list of users this user is following
        const followingRes = await getFollowing(userId);
        setFollowing(followingRes.data);

      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to load following list.";
        console.error("[FollowingPage] Error fetching data:", err);
         if (err.response?.status === 404) {
             setError("User not found.");
         } else {
            setError(`Error: ${message}`);
         }
         setFollowing([]); // Ensure list is empty on error
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFollowingAndProfile();
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
      <h1 className={styles.pageTitle}>{displayName} is Following ({following.length})</h1>
      {following.length === 0 ? (
        <p className={styles.emptyMessage}>
           {isOwnProfile // Use the calculated flag
            ? "You aren't following anyone yet."
            : `${displayName} isn't following anyone yet.` // For other users
           }
        </p>
      ) : (
        <ul className={styles.userList}>
          {following.map((followedUser) => (
            // Use a new UserListItem component to display each user
            <UserListItem key={followedUser._id} user={followedUser} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default FollowingPage;
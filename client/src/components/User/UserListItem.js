// client/src/components/User/UserListItem.js
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
// Corrected import paths from client/src/components/User/
// Import getStaticFileUrl from api.js
import { getStaticFileUrl, followUser, unfollowUser, isFollowing } from '../../services/api';
// Removed the direct import of defaultAvatar
// import defaultAvatar from '../../assets/images/default-avatar.png'; // REMOVED
import styles from './UserListItem.module.css'; // Path from User/ to UserListItem.module.css (same dir) (Correct)
// Corrected import paths for Common components
import LoadingSpinner from '../Common/LoadingSpinner/LoadingSpinner'; // **CORRECTED PATH** from User/ to Common/LoadingSpinner/
import ErrorMessage from '../Common/ErrorMessage/ErrorMessage'; // **CORRECTED PATH** from User/ to Common/ErrorMessage/
// Corrected import path for AuthContext
import { useAuth } from '../../contexts/AuthContext'; // **CORRECTED PATH** from User/ to contexts/AuthContext

// Define the path to the default avatar in the public folder
const DEFAULT_AVATAR_PUBLIC_PATH = '/images/default-avatar.png'; // <--- CONFIRM THIS PATH IS CORRECT IN PUBLIC

const UserListItem = ({ user }) => {
  const { user: loggedInUser, loading: authLoading } = useAuth();

  // --- State declarations MUST be at the top level ---
  const [isFollowingStatus, setIsFollowingStatus] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isFollowingError, setIsFollowingError] = useState(null); // State for potential errors
  // --- End State ---

  // --- Calculate derived state (like isSelf) BEFORE hooks ---
  // Determine if the currently displayed user is the logged-in user
  // Ensure user data is available before checking _id
  const isSelf = loggedInUser && user && loggedInUser._id === user._id;
  // --- End derived state calculation ---


  // --- Hooks must be called at the top level AFTER state and derived state ---
  // Fetch follow status when component mounts or user/loggedInUser changes
  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component

    // Use the isSelf variable calculated above
    // Only fetch status if NOT viewing self AND logged-in user is available AND user data is available
    if (!isSelf && loggedInUser && user?._id) { // Use user?. _id for safety
      setIsFollowingLoading(true);
      setIsFollowingError(null);
      const checkStatus = async () => {
        try {
          // Call the API to check if loggedInUser follows the 'user' displayed in the list item
          const response = await isFollowing(user._id); // Use user._id directly here
          if (isMounted) {
            setIsFollowingStatus(response.data.isFollowing);
          }
        } catch (err) {
           const message = err.response?.data?.message || err.message || "Failed to check follow status.";
           console.error(`[UserListItem] Error checking follow status for user ${user?.username}:`, err); // Use user?.username
           if (isMounted) {
               setIsFollowingError(message);
               setIsFollowingStatus(false); // Assume not following on error
           }
        } finally {
           if (isMounted) {
             setIsFollowingLoading(false);
           }
        }
      };
      checkStatus();
    } else {
        // If self or not logged in, set status/loading/error states accordingly
        if (isMounted) {
           setIsFollowingStatus(false); // Cannot follow yourself or if not logged in
           setIsFollowingLoading(false);
           setIsFollowingError(null);
        }
    }

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
        isMounted = false;
    };

    // Dependencies: user?._id changes (different list item user), loggedInUser changes (login/logout)
    // Include isSelf and user?.username as they are used in the logic within the effect
  }, [user?._id, loggedInUser, isSelf, user?.username]);


  // Follow/Unfollow Handlers using useCallback
  const handleFollow = useCallback(async (event) => {
      event.preventDefault();
      event.stopPropagation();

      // Use the isSelf variable calculated at the top level
      if (isSelf || !loggedInUser || isFollowingLoading || !user?._id) { // Use isSelf here
          console.warn("[UserListItem] Follow attempted under invalid conditions.");
          return;
      }

      setIsFollowingLoading(true);
      setIsFollowingError(null);
      try {
          await followUser(user._id); // Use user._id directly
          setIsFollowingStatus(true); // Optimistically update UI state
          console.log(`Successfully followed user ${user?.username} from list item.`); // Use user?.username
      } catch (err) {
          const message = err.response?.data?.message || err.message || "Failed to follow user.";
          setIsFollowingError(message);
          console.error(`[UserListItem] Follow Error for user ${user?.username}:`, err); // Use user?.username
          setIsFollowingStatus(false); // Revert on error
      } finally {
          setIsFollowingLoading(false);
      }
  }, [isSelf, loggedInUser, isFollowingLoading, user?._id, user?.username]); // Added isSelf and user?.username deps


  const handleUnfollow = useCallback(async (event) => {
      event.preventDefault();
      event.stopPropagation();

       // Use the isSelf variable calculated at the top level
      if (isSelf || !loggedInUser || !isFollowingStatus || isFollowingLoading || !user?._id) { // Use isSelf here
         console.warn("[UserListItem] Unfollow attempted under invalid conditions.");
         return;
      }

      setIsFollowingLoading(true);
      setIsFollowingError(null);
      try {
          await unfollowUser(user._id); // Use user._id directly
          setIsFollowingStatus(false); // Optimistically update UI state
          console.log(`Successfully unfollowed user ${user?.username} from list item.`); // Use user?.username
      } catch (err) {
          const message = err.response?.data?.message || err.message || "Failed to unfollow user.";
          setIsFollowingError(message);
          console.error(`[UserListItem] Unfollow Error for user ${user?.username}:`, err); // Use user?.username
          setIsFollowingStatus(true); // Revert on error
      } finally {
          setIsFollowingLoading(false);
      }
  }, [isSelf, loggedInUser, isFollowingStatus, isFollowingLoading, user?._id, user?.username]); // Added isSelf and user?.username deps
  // --- End Hooks ---


  // --- Early return AFTER all hooks are called ---
  // Add an early return if user prop is missing, but after state and hooks
  if (!user || !user._id) { // Check for user._id as well
    console.warn("[UserListItem] user prop missing or invalid.");
    return null;
  }
  // --- End Early return ---


  // Determine the avatar URL, using the default path if none is provided
  // Use getStaticFileUrl for both cases
  const avatarUrl = user.profilePictureUrl // Make sure this matches your user model field
    ? getStaticFileUrl(user.profilePictureUrl)
    : getStaticFileUrl(DEFAULT_AVATAR_PUBLIC_PATH); // Use the new constant

  const displayName = user.displayName || user.username;

  // Render Logic for Follow/Following Button on List Item
  const renderFollowButton = () => {
      // Don't show button if:
      // - Auth is loading or user is not logged in (cannot follow if not logged in)
      // isSelf check is handled in the main return JSX
      if (authLoading || !loggedInUser) {
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
          <button
              className={buttonClass}
              onClick={isFollowingStatus ? handleUnfollow : handleFollow}
              disabled={isFollowingLoading}
              aria-label={isFollowingStatus ? `Unfollow ${displayName}` : `Follow ${displayName}`}
          >
              {buttonContent}
          </button>
      );
  };


  return (
    <li className={styles.userListItem}>
        {/* The main link wraps the avatar and user info */}
        {/* Ensure user._id is valid for the link */}
        {user._id ? (
            <Link to={`/users/${user._id}`} className={styles.userLink}> {/* Corrected link to /users/:id */}
                <img
                  src={avatarUrl} // Use the determined avatarUrl
                  alt={`${displayName}'s avatar`}
                  className={styles.userAvatar}
                  // Fallback for broken image links - use the default avatar path
                  onError={(e) => { e.target.onerror = null; e.target.src = getStaticFileUrl(DEFAULT_AVATAR_PUBLIC_PATH); }}
                />
                <div className={styles.userInfo}>
                  <span className={styles.displayName}>{displayName}</span>
                  {user.displayName && <span className={styles.username}>@{user.username}</span>}
                </div>
            </Link>
        ) : (
            // Render plain text if user ID is missing to avoid invalid link
             <div className={styles.userLink} style={{ cursor: 'default' }}>
                 <img
                   src={avatarUrl} // Use the determined avatarUrl
                   alt={`${displayName}'s avatar`}
                   className={styles.userAvatar}
                   // Fallback for broken image links - use the default avatar path
                   onError={(e) => { e.target.onerror = null; e.target.src = getStaticFileUrl(DEFAULT_AVATAR_PUBLIC_PATH); }}
                 />
                 <div className={styles.userInfo}>
                   <span className={styles.displayName}>{displayName}</span>
                   {user.displayName && <span className={styles.username}>@{user.username}</span>}
                 </div>
             </div>
        )}


        {/* Render the follow button next to the user info, only if not viewing self */}
        {!isSelf && renderFollowButton()} {/* Use the isSelf derived state here */}

        {/* Display error message below the list item if needed */}
        {isFollowingError && !isFollowingLoading && (
           <div className={styles.followError}>
               <ErrorMessage message={isFollowingError} small /> {/* Added small prop for smaller size */}
           </div>
        )}
    </li>
  );
};

UserListItem.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    profilePictureUrl: PropTypes.string, // Make sure this matches your user model field
  }).isRequired,
};

export default UserListItem;
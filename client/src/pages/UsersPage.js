// client/src/pages/UsersPage.js
import React, { useState, useEffect } from 'react';
// No need for useParams as we're not fetching a specific user's list
// No need for useAuth unless we want to hide the page/certain elements for logged out users (optional for now)
import { getPublicUsers } from '../services/api'; // We will add this API function next
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import UserListItem from '../components/User/UserListItem';
import styles from './FollowListPage.module.css'; // Can reuse styles from FollowListPage if they are suitable

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        // Call the new API function to get the list of public users
        const response = await getPublicUsers(); // This function needs to be added to api.js
        setUsers(response.data); // Assuming the response data is the array of users
        console.log(`[UsersPage] Fetched ${response.data.length} public users.`);
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to load users.";
        console.error("[UsersPage] Error fetching users:", err);
        setError(`Error: ${message}`);
        setUsers([]); // Ensure list is empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchPublicUsers(); // Fetch users when the component mounts

  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) return <div className={styles.pageContainer}><LoadingSpinner size="large"/></div>;
  if (error) return <div className={styles.pageContainer}><ErrorMessage message={error} /></div>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>All Public Users ({users.length})</h1> {/* Title for the page */}
      {users.length === 0 ? (
        <p className={styles.emptyMessage}>No public users found at this time.</p>
      ) : (
        <ul className={styles.userList}>
          {users.map((user) => (
            // Use the existing UserListItem component to display each user
            <UserListItem key={user._id} user={user} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default UsersPage;
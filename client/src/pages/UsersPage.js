// client/src/pages/UsersPage.js
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async'; // Step 1: Import Helmet
import { getPublicUsers } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import UserListItem from '../components/User/UserListItem';
import styles from './FollowListPage.module.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getPublicUsers();
        setUsers(response.data);
        console.log(`[UsersPage] Fetched ${response.data.length} public users.`);
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to load users.";
        console.error("[UsersPage] Error fetching users:", err);
        setError(`Error: ${message}`);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicUsers();
  }, []);

  // Step 2: Add Helmet for loading and error states as well
  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Users... | Movie-Books</title>
        </Helmet>
        <div className={styles.pageContainer}><LoadingSpinner size="large"/></div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Error Loading Users | Movie-Books</title>
        </Helmet>
        <div className={styles.pageContainer}><ErrorMessage message={error} /></div>
      </>
    );
  }

  return (
    <>
      {/* Step 3: Add Helmet for the main content */}
      <Helmet>
        <title>Discover Users | Movie-Books Community</title>
        <meta name="description" content="Browse the list of public users on Movie-Books. Find and connect with others who share your passion for movie and book connections." />
        {/* Optional: Add canonical URL if this page will have a fixed path */}
        {/* <link rel="canonical" href={`${window.location.origin}/all-users`} /> */}
      </Helmet>
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>All Public Users ({users.length})</h1>
        {users.length === 0 ? (
          <p className={styles.emptyMessage}>No public users found at this time.</p>
        ) : (
          <ul className={styles.userList}>
            {users.map((user) => (
              <UserListItem key={user._id} user={user} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default UsersPage;
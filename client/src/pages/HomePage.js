// client/src/pages/HomePage.js
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import api from '../services/api'; // Axios instance for API calls
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard'; // Import the ConnectionCard component
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner'; // Import LoadingSpinner
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage'; // Import ErrorMessage component

// Optional: Import page-specific styles if you create HomePage.module.css for layout
// import styles from './HomePage.module.css';

const HomePage = () => {
  // State to hold the array of connection objects fetched from the API
  const [connections, setConnections] = useState([]);
  // State to track whether data is currently being fetched
  const [loading, setLoading] = useState(true);
  // State to hold any error messages that occur during fetching
  const [error, setError] = useState(null);

  /**
   * Callback function passed down to each ConnectionCard as 'onUpdate'.
   * Updates a single connection in the state after a like/favorite action.
   */
  const updateConnectionInState = useCallback((updatedConnection) => {
    setConnections(prevConnections =>
      prevConnections.map(conn =>
        conn._id === updatedConnection._id ? updatedConnection : conn
      )
    );
  }, []); // useCallback ensures this function reference remains stable

  // --- START OF ADDITION 1 ---
  /**
   * Callback function passed down to each ConnectionCard as 'onDelete'.
   * Removes a connection from the state after it has been successfully deleted.
   */
  const handleDeleteConnection = useCallback((deletedConnectionId) => {
    setConnections(prevConnections =>
      // Filter out the connection whose ID matches the deleted one
      prevConnections.filter(conn => conn._id !== deletedConnectionId)
    );
    // Optional: Add a user notification/toast here confirming deletion
    // console.log(`Connection ${deletedConnectionId} removed from HomePage state.`);
  }, []); // useCallback ensures this function reference remains stable
  // --- END OF ADDITION 1 ---


  // useEffect hook to fetch connections when the component first mounts
  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/connections');
        setConnections(data);
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to fetch connections.";
        console.error("Fetch connections error:", err);
        setError(message);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);


  // Render the component's UI
  return (
    <div>
      <h1>MovieBooks Feed</h1>
      {/* <p>Discover books spotted in movies!</p> */}

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div>
          {connections.length === 0 ? (
            <p>No connections found yet. Be the first to add one!</p>
          ) : (
            <div>
              {connections.map((connection) => (
                <ConnectionCard
                  key={connection._id}
                  connection={connection}
                  onUpdate={updateConnectionInState} // Existing prop
                  onDelete={handleDeleteConnection} // <-- NEW: Pass delete handler as prop
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
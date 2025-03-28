// client/src/pages/MovieDetailPage.js
import React, { useState, useEffect, useCallback } from 'react'; // Ensure useCallback is imported
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';

// Optional: Add page-specific styles
// import styles from './DetailPage.module.css';

const MovieDetailPage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [connections, setConnections] = useState([]); // State holding the connections for this movie
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
    // console.log(`Connection ${deletedConnectionId} removed from MovieDetailPage state.`);
  }, []); // Empty dependency array as setConnections is stable
  // --- END OF ADDITION 1 ---

  // Effect to fetch movie details and related connections
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const connectionsRes = await api.get(`/movies/${movieId}/connections`);
        setConnections(connectionsRes.data); // Update connections state

        // ... (existing logic to set movie details)
        if (!movie && connectionsRes.data.length > 0) {
             setMovie(connectionsRes.data[0].movieRef);
        } else if (!movie) {
            try {
                 const movieRes = await api.get(`/movies/${movieId}`);
                 setMovie(movieRes.data);
            } catch (movieErr) {
                 console.error("Could not find movie details either.", movieErr)
                 setMovie({ _id: movieId, title: "Movie Details" });
            }
        }

      } catch (err) {
        // ... (existing error handling)
        const message = err.response?.data?.message || err.message || "Failed to load movie data.";
        console.error("Fetch movie data error:", err);
        setError(message);
        setMovie(null);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchData();
    } else {
        setError("No Movie ID provided.");
        setLoading(false);
    }
  }, [movieId, movie]);

  // Render component
  return (
    <div /* Optional: className={styles.detailPage} */ >
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && movie && (
        <>
          <h1>{movie.title}</h1>
          <p>Appearances in the MovieBooks feed:</p>

          {connections.length === 0 ? (
             <p>No book connections found for this movie yet.</p>
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
       {!loading && !error && !movie && <ErrorMessage message="Movie details could not be loaded." /> }
    </div>
  );
};

export default MovieDetailPage;
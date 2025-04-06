// client/src/pages/MovieDetailPage.js (Fallback to Connection Poster)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    getMovieById,
    getConnectionsByMovieId,
    getStaticFileUrl // Assuming this function is updated to handle full URLs correctly
} from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import styles from './MovieDetailPage.module.css';

const MovieDetailPage = () => {
    const { movieId } = useParams();
    const { user } = useAuth();

    const [movieDetails, setMovieDetails] = useState(null);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Interaction Handlers (Keep as is) ---
    const updateConnectionInState = useCallback((updatedConnection) => {
        setConnections(prevConnections =>
            prevConnections.map(conn =>
                conn._id === updatedConnection._id ? updatedConnection : conn
            )
        );
    }, []);

    const handleDeleteConnection = useCallback((deletedConnectionId) => {
        setConnections(prevConnections =>
            prevConnections.filter(conn => conn._id !== deletedConnectionId)
        );
    }, []);
    // --- End Handlers ---

    // Effect to fetch movie details and related connections concurrently
    useEffect(() => {
        const fetchData = async () => {
             if (!movieId) {
                setError("No Movie ID provided in URL.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            setMovieDetails(null);
            setConnections([]);
            // console.log(`Fetching data for movie ID: ${movieId}`); // Less noisy logs
            try {
                const [movieRes, connectionsRes] = await Promise.all([
                    getMovieById(movieId),
                    getConnectionsByMovieId(movieId)
                ]);
                // console.log("Movie Details Response Data:", movieRes.data);
                // console.log("Connections Response Data:", connectionsRes.data);
                setMovieDetails(movieRes.data);
                setConnections(connectionsRes.data || []);
            } catch (err) {
                console.error("Error fetching movie details or connections:", err);
                const errorMessage = err.response?.data?.message || err.message || 'Failed to load movie data.';
                if (err.response?.status === 404 && err.config?.url?.includes(`/movies/${movieId}`)) {
                    setError(`Movie with ID ${movieId} not found.`);
                } else {
                    setError(errorMessage);
                }
                setMovieDetails(null);
                setConnections([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [movieId]);

    // --- Render Logic ---
    if (loading) {
        return <div className={styles.pageContainer}><LoadingSpinner /></div>;
    }
    if (error) {
        return (
            <div className={`${styles.pageContainer} ${styles.errorContainer}`}>
                <h2>Error Loading Movie</h2>
                <p>{error}</p>
                {error.toLowerCase().includes('not found') && <p>The movie you are looking for might not exist.</p>}
                <Link to="/" className="button button-secondary">Back to Home</Link>
            </div>
        );
    }
    if (!movieDetails) {
        return <div className={styles.pageContainer}><ErrorMessage message="Movie details could not be loaded or found." /></div>;
    }

    // --- *** Determine Poster URL Strategy *** ---
    let finalPosterUrl = '/placeholder-poster.png'; // Default fallback

    // 1. Prioritize posterPath directly from the Movie document
    if (movieDetails.posterPath) {
        finalPosterUrl = getStaticFileUrl(movieDetails.posterPath);
        // console.log("Using posterPath from Movie Details:", finalPosterUrl);
    }
    // 2. If movie poster is missing, AND we have connections, try the first connection's poster
    else if (connections && connections.length > 0 && connections[0].moviePosterUrl) {
        // Find the moviePosterUrl field on the *Connection* object
        // NOTE: This assumes your 'getConnectionsByMovieId' populates or returns this field
        //       Let's double-check the controller if needed. But the Connection model HAS it.
        finalPosterUrl = getStaticFileUrl(connections[0].moviePosterUrl);
        // console.log("Falling back to posterPath from first Connection:", finalPosterUrl);
    }
    // console.log("Final Poster URL decided:", finalPosterUrl);
    // --- *** End Poster URL Strategy *** ---


    return (
        <div className={styles.pageContainer}>
            {/* Movie Details Section */}
            <div className={styles.detailsSection}>
                <div className={styles.imageContainer}>
                     <img
                        src={finalPosterUrl} // <-- Use the determined URL
                        alt={`${movieDetails.title} Poster`}
                        className={styles.posterImage}
                        onError={(e) => { // Optional: Handle broken image links
                          console.warn(`Image failed to load: ${finalPosterUrl}`);
                          e.target.onerror = null; // prevent looping
                          e.target.src = '/placeholder-poster.png'; // Set to fallback on error
                        }}
                    />
                </div>
                <div className={styles.infoContainer}>
                    {/* ... rest of the info container (title, meta, etc.) ... */}
                    <h1 className={styles.title}>{movieDetails.title}</h1>
                     <p className={styles.meta}>
                        {movieDetails.year && <span>{movieDetails.year}</span>}
                         {movieDetails.year && movieDetails.genres && movieDetails.genres.length > 0 && (
                            <span className={styles.metaSeparator}> | </span>
                         )}
                        {movieDetails.genres && movieDetails.genres.length > 0 && (
                            <span>{movieDetails.genres.join(', ')}</span>
                        )}
                    </p>
                    {movieDetails.director && <p><strong>Director:</strong> {movieDetails.director}</p>}
                    {movieDetails.actors && movieDetails.actors.length > 0 && (
                        <p><strong>Actors:</strong> {movieDetails.actors.join(', ')}</p>
                    )}
                    {movieDetails.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {movieDetails.synopsis}</p>}
                </div>
            </div>

            <hr className={styles.divider} />

            {/* Connections Section */}
            <div className={styles.connectionsSection}>
              {/* ... connections list mapping ... */}
              <h2 className={styles.connectionsTitle}>Connections Featuring This Movie</h2>
                {connections.length > 0 ? (
                    <div className={styles.connectionsGrid}>
                        {connections.map((connection) => (
                            <ConnectionCard
                                key={connection._id}
                                connection={connection}
                                onUpdate={updateConnectionInState}
                                onDelete={handleDeleteConnection}
                            />
                        ))}
                    </div>
                ) : (
                    <p className={styles.noItemsMessage}>
                        No connections have been made for this movie yet.
                        {user && <Link to="/add-connection"> Be the first to add one!</Link>}
                         {!user && <span> Log in to add a connection.</span>}
                    </p>
                )}
            </div>
        </div>
    );
};

export default MovieDetailPage;
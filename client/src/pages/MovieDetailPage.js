// client/src/pages/MovieDetailPage.js (Fallback to Connection Poster)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import hooks and components from React Router

// Import API functions and helper for static file URLs
import {
    getMovieById,
    getConnectionsByMovieId,
    getStaticFileUrl // Assuming this function handles base URLs correctly
} from '../services/api';

// Import reusable UI components
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';

// Import custom hook for authentication context
import { useAuth } from '../contexts/AuthContext';

// Import page-specific styles
import styles from './MovieDetailPage.module.css';

/**
 * Renders the detail page for a specific movie.
 * Displays movie information (title, director, poster, etc.) and a list of
 * connections where this movie is featured.
 */
const MovieDetailPage = () => {
    // --- Hooks ---
    // Get the 'movieId' from the URL parameters (e.g., /movies/:movieId)
    const { movieId } = useParams();
    // Get the current logged-in user from the AuthContext
    const { user } = useAuth();

    // --- State Variables ---
    // Holds the detailed information about the movie fetched from the API
    const [movieDetails, setMovieDetails] = useState(null);
    // Holds the array of connection objects related to this movie
    const [connections, setConnections] = useState([]);
    // Tracks the loading state while fetching data
    const [loading, setLoading] = useState(true);
    // Holds any error messages that occur during data fetching
    const [error, setError] = useState(null);

    // --- Interaction Handlers (Callbacks for ConnectionCard) ---
    /**
     * Callback function passed to ConnectionCard to update a connection's state locally
     * after an action like liking or commenting.
     * @param {object} updatedConnection - The updated connection object from the API.
     */
    const updateConnectionInState = useCallback((updatedConnection) => {
        setConnections(prevConnections =>
            prevConnections.map(conn =>
                conn._id === updatedConnection._id ? updatedConnection : conn
            )
        );
    }, []); // Empty dependency array: function doesn't depend on component state/props

    /**
     * Callback function passed to ConnectionCard to remove a connection from the local state
     * after it has been successfully deleted.
     * @param {string} deletedConnectionId - The ID of the connection that was deleted.
     */
    const handleDeleteConnection = useCallback((deletedConnectionId) => {
        setConnections(prevConnections =>
            prevConnections.filter(conn => conn._id !== deletedConnectionId)
        );
    }, []); // Empty dependency array
    // --- End Handlers ---

    // --- Data Fetching Effect ---
    /**
     * useEffect hook to fetch the movie details and its associated connections
     * when the component mounts or when the 'movieId' URL parameter changes.
     */
    useEffect(() => {
        const fetchData = async () => {
             // Validate movieId presence
             if (!movieId) {
                setError("No Movie ID provided in URL.");
                setLoading(false);
                return;
            }
            // Reset state before fetching
            setLoading(true);
            setError(null);
            setMovieDetails(null);
            setConnections([]);

            try {
                // Fetch movie details and connections concurrently using Promise.all
                const [movieRes, connectionsRes] = await Promise.all([
                    getMovieById(movieId),
                    getConnectionsByMovieId(movieId)
                ]);

                // Update state with fetched data
                setMovieDetails(movieRes.data);
                // Ensure connections is always an array, even if API returns null/undefined
                setConnections(connectionsRes.data || []);
            } catch (err) {
                // Handle errors during fetching
                console.error("Error fetching movie details or connections:", err); // Keep error log
                const errorMessage = err.response?.data?.message || err.message || 'Failed to load movie data.';
                // Provide a specific message for 404 errors related to the movie itself
                if (err.response?.status === 404 && err.config?.url?.includes(`/movies/${movieId}`)) {
                    setError(`Movie with ID ${movieId} not found.`);
                } else {
                    setError(errorMessage);
                }
                // Clear potentially stale data on error
                setMovieDetails(null);
                setConnections([]);
            } finally {
                // Ensure loading state is turned off after the fetch attempt
                setLoading(false);
            }
        };
        fetchData();
    }, [movieId]); // Dependency array: Re-run the effect only if movieId changes

    // --- Render Logic ---

    // 1. Loading State
    if (loading) {
        return <div className={styles.pageContainer}><LoadingSpinner /></div>;
    }

    // 2. Error State
    if (error) {
        return (
            <div className={`${styles.pageContainer} ${styles.errorContainer}`}>
                <h2>Error Loading Movie</h2>
                <p>{error}</p>
                {/* Add helpful text if it's a 'not found' error */}
                {error.toLowerCase().includes('not found') && <p>The movie you are looking for might not exist.</p>}
                {/* Provide a link back home */}
                {/* Using reusable Button component might be better here if available */}
                <Link to="/" className="button button-secondary">Back to Home</Link>
            </div>
        );
    }

    // 3. No Data State (after loading and no error)
    if (!movieDetails) {
        // This case might occur if the API returns success but with empty data
        return <div className={styles.pageContainer}><ErrorMessage message="Movie details could not be loaded or found." /></div>;
    }

    // 4. Success State - Prepare Data for Rendering

    // --- Determine Poster URL Strategy ---
    // Define a default fallback image path
    let finalPosterUrl = '/placeholder-poster.png';

    // Priority 1: Use the 'posterPath' directly from the fetched movie details if available.
    if (movieDetails.posterPath) {
        finalPosterUrl = getStaticFileUrl(movieDetails.posterPath);
    }
    // Priority 2: If movie poster is missing AND connections exist, try the 'moviePosterUrl'
    // from the first connection in the list. (Assumes connections are sorted or order doesn't matter).
    // Note: This relies on the backend API endpoint for connections including 'moviePosterUrl'.
    else if (connections && connections.length > 0 && connections[0].moviePosterUrl) {
        finalPosterUrl = getStaticFileUrl(connections[0].moviePosterUrl);
    }
    // --- End Poster URL Strategy ---

    // --- Render Success UI ---
    return (
        <div className={styles.pageContainer}>
            {/* Movie Details Section (Top part of the page) */}
            <div className={styles.detailsSection}>
                {/* Container for the movie poster image */}
                <div className={styles.imageContainer}>
                     <img
                        src={finalPosterUrl} // Use the determined URL
                        alt={`${movieDetails.title} Poster`}
                        className={styles.posterImage} // Apply specific styling for the poster
                         onError={(e) => { // Handle cases where the image fails to load
                          console.warn(`Image failed to load: ${finalPosterUrl}`); // Keep warning log
                          e.target.onerror = null; // Prevent infinite loop if fallback also fails
                          e.target.src = '/placeholder-poster.png'; // Set to the default fallback image
                        }}
                    />
                </div>
                {/* Container for the movie's textual information */}
                <div className={styles.infoContainer}>
                    <h1 className={styles.title}>{movieDetails.title}</h1>
                     {/* Meta information line (Year | Genres) */}
                     <p className={styles.meta}>
                        {movieDetails.year && <span>{movieDetails.year}</span>}
                         {/* Separator only shown if both year and genres exist */}
                         {movieDetails.year && movieDetails.genres?.length > 0 && (
                            <span className={styles.metaSeparator}> | </span>
                         )}
                        {movieDetails.genres?.length > 0 && (
                            <span>{movieDetails.genres.join(', ')}</span>
                        )}
                    </p>
                    {/* Other movie details */}
                    {movieDetails.director && <p><strong>Director:</strong> {movieDetails.director}</p>}
                    {movieDetails.actors?.length > 0 && (
                        <p><strong>Actors:</strong> {movieDetails.actors.join(', ')}</p>
                    )}
                    {movieDetails.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {movieDetails.synopsis}</p>}
                </div>
            </div>

            {/* Divider line between movie details and connections */}
            <hr className={styles.divider} />

            {/* Connections Section (Bottom part of the page) */}
            <div className={styles.connectionsSection}>
              <h2 className={styles.connectionsTitle}>Connections Featuring This Movie</h2>
                {/* Check if there are any connections to display */}
                {connections.length > 0 ? (
                    // Render a grid of ConnectionCard components if connections exist
                    <div className={styles.connectionsGrid}>
                        {connections.map((connection) => (
                            <ConnectionCard
                                key={connection._id} // Unique key for React list rendering
                                connection={connection} // Pass connection data to the card
                                onUpdate={updateConnectionInState} // Pass update callback
                                onDelete={handleDeleteConnection} // Pass delete callback
                            />
                        ))}
                    </div>
                ) : (
                    // Render a message if no connections are found
                    <p className={styles.noItemsMessage}>
                        No connections have been made for this movie yet.
                        {/* Show different prompts based on login status */}
                        {user && <Link to="/add-connection"> Be the first to add one!</Link>}
                         {!user && <span> Log in to add a connection.</span>}
                    </p>
                )}
            </div>
        </div>
    );
};

export default MovieDetailPage;

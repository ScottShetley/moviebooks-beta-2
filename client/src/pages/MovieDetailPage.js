// client/src/pages/MovieDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import {
    getMovieById,
    getConnectionsByMovieId,
    getStaticFileUrl
} from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import styles from './MovieDetailPage.module.css';

const siteBaseUrl = window.location.origin; // For canonical and OG URLs

const MovieDetailPage = () => {
    const { movieId } = useParams();
    const { user } = useAuth();

    const [movieDetails, setMovieDetails] = useState(null);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            try {
                const [movieRes, connectionsRes] = await Promise.all([
                    getMovieById(movieId),
                    getConnectionsByMovieId(movieId)
                ]);
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

    if (loading) {
        return (
            <>
                <Helmet>
                    <title>Loading Movie... | Movie-Books</title>
                </Helmet>
                <div className={styles.pageContainer}><LoadingSpinner /></div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Helmet>
                    <title>Movie Not Found or Error | Movie-Books</title>
                    <meta name="description" content="Details for this movie could not be loaded. It might not exist or there was an error." />
                </Helmet>
                <div className={`${styles.pageContainer} ${styles.errorContainer}`}>
                    <h2>Error Loading Movie</h2>
                    <p>{error}</p>
                    {error.toLowerCase().includes('not found') && <p>The movie you are looking for might not exist.</p>}
                    <Link to="/" className="button button-secondary">Back to Home</Link>
                </div>
            </>
        );
    }

    if (!movieDetails) {
        return (
            <>
                <Helmet>
                    <title>Movie Details Unavailable | Movie-Books</title>
                    <meta name="description" content="Movie details could not be loaded or found at this time." />
                </Helmet>
                <div className={styles.pageContainer}><ErrorMessage message="Movie details could not be loaded or found." /></div>
            </>
        );
    }

    // --- Determine Poster URL Strategy ---
    let finalPosterUrl = '/placeholder-poster.png'; // Default fallback
    if (movieDetails.posterPath) {
        finalPosterUrl = getStaticFileUrl(movieDetails.posterPath);
    } else if (connections && connections.length > 0 && connections[0].moviePosterUrl) {
        finalPosterUrl = getStaticFileUrl(connections[0].moviePosterUrl);
    }
    // For OG image, ensure it's a full URL
    const ogImageUrl = finalPosterUrl.startsWith('http') ? finalPosterUrl : `${siteBaseUrl}${finalPosterUrl.startsWith('/') ? '' : '/'}${finalPosterUrl}`;


    // --- Prepare dynamic meta content ---
    const pageTitle = `${movieDetails.title}${movieDetails.year ? ` (${movieDetails.year})` : ''} - Movie Details | Movie-Books`;
    const metaDescription = `Details and connections for the movie ${movieDetails.title}. ${movieDetails.synopsis ? movieDetails.synopsis.substring(0, 120) + '...' : `Discover book connections, cast, director, and more on Movie-Books.`}`;
    const canonicalUrl = `${siteBaseUrl}/movies/${movieId}`;

    return (
        <>
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={metaDescription} />
                <link rel="canonical" href={canonicalUrl} />
                {/* Open Graph */}
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content={ogImageUrl} />
                <meta property="og:type" content="video.movie" />
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={metaDescription} />
                <meta name="twitter:image" content={ogImageUrl} />
            </Helmet>
            <div className={styles.pageContainer}>
                <div className={styles.detailsSection}>
                    <div className={styles.imageContainer}>
                        <img
                            src={finalPosterUrl}
                            alt={`${movieDetails.title} Poster`}
                            className={styles.posterImage}
                            onError={(e) => {
                                console.warn(`Image failed to load: ${finalPosterUrl}`);
                                e.target.onerror = null;
                                e.target.src = '/placeholder-poster.png';
                            }}
                        />
                    </div>
                    <div className={styles.infoContainer}>
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

                <div className={styles.connectionsSection}>
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
        </>
    );
};

export default MovieDetailPage;
// client/src/pages/ConnectionDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // <-- Import Helmet
import { getConnectionById, getStaticFileUrl } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import Tag from '../components/Common/Tag/Tag';
import styles from './ConnectionDetailPage.module.css';

function ConnectionDetailPage() {
    const { connectionId } = useParams();
    const navigate = useNavigate();
    const [connection, setConnection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Base URL for constructing canonical URLs (replace if needed)
    const siteBaseUrl = window.location.origin;

    useEffect(() => {
        const fetchConnection = async () => {
            // console.log("ConnectionDetailPage: Fetching connection with ID:", connectionId);
            try {
                setLoading(true);
                setError(null);
                const response = await getConnectionById(connectionId);
                setConnection(response.data);
                // console.log("ConnectionDetailPage: Fetched connection data:", response.data);
            } catch (err) {
                console.error("ConnectionDetailPage: Error fetching connection:", err);
                const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch connection details.';
                setError(errorMsg);
                if (err.response?.status === 404) {
                    setError(`Connection with ID ${connectionId} not found.`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchConnection();
    }, [connectionId]);

    // --- Loading State ---
    if (loading) {
        return (
            <>
                <Helmet>
                    <title>Loading Connection... | MovieBooks</title>
                </Helmet>
                <div className={styles.pageContainer}><LoadingSpinner /></div>
            </>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <>
                <Helmet>
                    <title>Error | MovieBooks</title>
                </Helmet>
                <div className={styles.pageContainer}>
                    <ErrorMessage message={error} />
                    <button onClick={() => navigate('/')} className={styles.backButton}>Go Home</button>
                </div>
            </>
        );
    }

    // --- No Connection Data State ---
    if (!connection) {
        return (
            <>
                 <Helmet>
                    <title>Connection Not Found | MovieBooks</title>
                </Helmet>
                <div className={styles.pageContainer}>
                    <ErrorMessage message="Connection data could not be loaded." />
                    <button onClick={() => navigate('/')} className={styles.backButton}>Go Home</button>
                </div>
            </>
        );
    }

    // --- Success State - Prepare Meta Data ---
    // Destructure needed refs and fields for meta tags FIRST
    const { movieRef, bookRef, context: connectionContext, screenshotUrl } = connection; // Use different name for context to avoid scope clash below

    const pageTitle = `Connection: ${movieRef?.title || 'Unknown Movie'} & ${bookRef?.title || 'Unknown Book'} | MovieBooks`;
    const metaDescription = connectionContext // Use the destructured variable
        ? `${connectionContext.substring(0, 155)}${connectionContext.length > 155 ? '...' : ''}`
        : `Explore the connection between ${movieRef?.title || 'a movie'} and ${bookRef?.title || 'a book'} on MovieBooks.`;
    const metaImageUrl = getStaticFileUrl(movieRef?.posterPath) || getStaticFileUrl(bookRef?.coverPath) || getStaticFileUrl(screenshotUrl) || `${siteBaseUrl}/logo512.png`;
    const canonicalUrl = `${siteBaseUrl}/connections/${connectionId}`;


    // --- Success State - Render Connection Details ---
    // Destructure again for rendering (or reuse from above if preferred)
    const { tags, userRef, createdAt, context } = connection; // 'context' here is fine for rendering

    const moviePosterDisplayUrl = getStaticFileUrl(movieRef?.posterPath);
    const bookCoverDisplayUrl = getStaticFileUrl(bookRef?.coverPath);
    const screenshotDisplayUrl = getStaticFileUrl(screenshotUrl); // Use screenshotUrl from initial destructuring

    return (
        <>
            {/* --- START: Helmet for Meta Tags --- */}
            <Helmet>
                <title>{pageTitle}</title>
                <link rel="canonical" href={canonicalUrl} />
                <meta name="description" content={metaDescription} />
                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:image" content={metaImageUrl} />
                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content={canonicalUrl} />
                <meta property="twitter:title" content={pageTitle} />
                <meta property="twitter:description" content={metaDescription} />
                <meta property="twitter:image" content={metaImageUrl} />
            </Helmet>
            {/* --- END: Helmet for Meta Tags --- */}

            <div className={styles.pageContainer}>
                <div className={styles.connectionHeader}>
                    <h1 className={styles.title}>Connection Details</h1>
                    <p className={styles.meta}>
                        Created by <Link to={`/users/${userRef?._id}`}>{userRef?.username || 'Unknown User'}</Link> on {new Date(createdAt).toLocaleDateString()}
                    </p>
                </div>

                <div className={styles.contentGrid}>
                    {/* Movie Section */}
                    <div className={styles.movieSection}>
                        <h2 className={styles.sectionTitle}>Movie</h2>
                        {movieRef ? (
                             <>
                                {moviePosterDisplayUrl && (
                                    <img
                                        src={moviePosterDisplayUrl}
                                        alt={`${movieRef.title} poster`}
                                        className={styles.image}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <Link to={`/movies/${movieRef._id}`} className={styles.itemTitleLink}>
                                    <h3>{movieRef.title} {movieRef.year ? `(${movieRef.year})` : ''}</h3>
                                </Link>
                                {movieRef.director && <p><strong>Director:</strong> {movieRef.director}</p>}
                                {movieRef.genres?.length > 0 && <p><strong>Genres:</strong> {movieRef.genres.join(', ')}</p>}
                                {movieRef.actors?.length > 0 && <p><strong>Actors:</strong> {movieRef.actors.join(', ')}</p>}
                                {movieRef.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {movieRef.synopsis}</p>}
                            </>
                        ) : (
                            <p>Movie details not available.</p>
                        )}
                    </div>

                    {/* Book Section */}
                    <div className={styles.bookSection}>
                        <h2 className={styles.sectionTitle}>Book</h2>
                        {bookRef ? (
                             <>
                                {bookCoverDisplayUrl && (
                                    <img
                                        src={bookCoverDisplayUrl}
                                        alt={`${bookRef.title} cover`}
                                        className={styles.image}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <Link to={`/books/${bookRef._id}`} className={styles.itemTitleLink}>
                                    <h3>{bookRef.title}</h3>
                                </Link>
                                {bookRef.author && <p><strong>Author:</strong> {bookRef.author}</p>}
                                {bookRef.publicationYear && <p><strong>Published:</strong> {bookRef.publicationYear}</p>}
                                {bookRef.genres?.length > 0 && <p><strong>Genres:</strong> {bookRef.genres.join(', ')}</p>}
                                {bookRef.isbn && <p><strong>ISBN:</strong> {bookRef.isbn}</p>}
                                {bookRef.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {bookRef.synopsis}</p>}
                            </>
                        ) : (
                            <p>Book details not available.</p>
                        )}
                    </div>

                    {/* Context & Screenshot Section */}
                    <div className={styles.contextSection}>
                        <h2 className={styles.sectionTitle}>Context</h2>
                        {/* Use 'context' here for rendering */}
                        <p className={styles.contextText}>{context || 'No context provided.'}</p>
                        {screenshotDisplayUrl && (
                            <>
                                <h3 className={styles.screenshotTitle}>Screenshot</h3>
                                <img
                                    src={screenshotDisplayUrl}
                                    alt="Connection screenshot"
                                    className={`${styles.image} ${styles.screenshotImage}`}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </>
                        )}
                    </div>

                    {/* Tags Section */}
                    {/* Use 'tags' here for rendering */}
                    {tags?.length > 0 && (
                        <div className={styles.tagsSection}>
                            <h2 className={styles.sectionTitle}>Tags</h2>
                            <div className={styles.tagsContainer}>
                                {tags.map(tag => (
                                    <Link key={tag} to={`/?tags=${encodeURIComponent(tag)}`} className={styles.tagLink}>
                                        <Tag tag={tag} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.backLinkContainer}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>Go Back</button>
                </div>
            </div>
        </>
    );
}

export default ConnectionDetailPage;
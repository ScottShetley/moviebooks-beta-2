// client/src/pages/ConnectionDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // For managing document head tags (title, meta)
import { getConnectionById, getStaticFileUrl } from '../services/api'; // API functions
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner'; // Reusable components
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import Tag from '../components/Common/Tag/Tag';
import styles from './ConnectionDetailPage.module.css'; // Page-specific styles

/**
 * Renders the detail page for a specific connection.
 * Displays details about the connection itself, the linked movie and book,
 * context, screenshot, tags, and creator information.
 * Also sets relevant meta tags for SEO and social sharing.
 */
function ConnectionDetailPage() {
    // --- Hooks ---
    // Get the 'connectionId' from the URL parameters (e.g., /connections/:connectionId)
    const { connectionId } = useParams();
    // Get the navigate function from React Router for programmatic navigation (e.g., back button)
    const navigate = useNavigate();

    // --- State Variables ---
    // Holds the detailed connection object fetched from the API
    const [connection, setConnection] = useState(null);
    // Tracks loading state while fetching data
    const [loading, setLoading] = useState(true);
    // Holds any error messages that occur during data fetching
    const [error, setError] = useState(null);

    // --- Constants ---
    // Base URL of the site, used for constructing canonical and Open Graph URLs
    const siteBaseUrl = window.location.origin;

    // --- Data Fetching Effect ---
    /**
     * useEffect hook to fetch the connection details when the component mounts
     * or when the 'connectionId' URL parameter changes.
     */
    useEffect(() => {
        const fetchConnection = async () => {
            // Validate connectionId presence
            if (!connectionId) {
                setError("No Connection ID provided in URL.");
                setLoading(false);
                return;
            }
            // Reset state before fetching
            setLoading(true);
            setError(null);
            setConnection(null); // Clear previous connection data

            try {
                // Make the API call to get connection details by ID
                const response = await getConnectionById(connectionId);
                // Update state with the fetched connection data
                setConnection(response.data);
            } catch (err) {
                // Handle errors during fetching
                console.error("ConnectionDetailPage: Error fetching connection:", err); // Keep error log
                const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch connection details.';
                // Provide a specific message for 404 errors
                if (err.response?.status === 404) {
                    setError(`Connection with ID ${connectionId} not found.`);
                } else {
                    setError(errorMsg);
                }
                setConnection(null); // Ensure connection state is null on error
            } finally {
                // Ensure loading state is turned off after the fetch attempt
                setLoading(false);
            }
        };

        fetchConnection();
    }, [connectionId]); // Dependency array: Re-run the effect only if connectionId changes

    // --- Render Logic: Loading State ---
    if (loading) {
        return (
            <>
                {/* Set a temporary title while loading */}
                <Helmet>
                    <title>Loading Connection... | MovieBooks</title>
                </Helmet>
                <div className={styles.pageContainer}><LoadingSpinner /></div>
            </>
        );
    }

    // --- Render Logic: Error State ---
    if (error) {
        return (
            <>
                {/* Set an error title */}
                <Helmet>
                    <title>Error | MovieBooks</title>
                </Helmet>
                <div className={styles.pageContainer}>
                    <ErrorMessage message={error} />
                    {/* Provide a button to navigate back to the homepage */}
                    <button onClick={() => navigate('/')} className={styles.backButton}>Go Home</button>
                </div>
            </>
        );
    }

    // --- Render Logic: No Connection Data State ---
    // This handles cases where loading finished without error, but connection is still null
    if (!connection) {
        return (
            <>
                 <Helmet>
                    <title>Connection Not Found | MovieBooks</title>
                </Helmet>
                <div className={styles.pageContainer}>
                    <ErrorMessage message="Connection data could not be loaded or found." />
                    <button onClick={() => navigate('/')} className={styles.backButton}>Go Home</button>
                </div>
            </>
        );
    }

    // --- Success State: Prepare Data for Meta Tags and Rendering ---

    // Destructure needed fields from the connection object
    // Use alias 'connectionContext' for 'context' to avoid naming conflicts in this scope
    const { movieRef, bookRef, context: connectionContext, screenshotUrl, tags, userRef, createdAt, context } = connection;

    // --- Meta Tag Content Generation ---
    const pageTitle = `Connection: ${movieRef?.title || 'Unknown Movie'} & ${bookRef?.title || 'Unknown Book'} | MovieBooks`;
    // Create a concise description, truncating the context if necessary
    const metaDescription = connectionContext
        ? `${connectionContext.substring(0, 155)}${connectionContext.length > 155 ? '...' : ''}`
        : `Explore the connection between ${movieRef?.title || 'a movie'} and ${bookRef?.title || 'a book'} on MovieBooks.`;
    // Determine the best image URL for social previews (Movie Poster > Book Cover > Screenshot > Default Logo)
    const metaImageUrl = getStaticFileUrl(movieRef?.posterPath)
                      || getStaticFileUrl(bookRef?.coverPath)
                      || getStaticFileUrl(screenshotUrl)
                      || `${siteBaseUrl}/logo512.png`; // Fallback to site logo
    // Define the canonical URL for this specific connection page
    const canonicalUrl = `${siteBaseUrl}/connections/${connectionId}`;
    // --- End Meta Tag Content Generation ---

    // --- Prepare Display URLs ---
    // Get URLs for images to be displayed on the page
    const moviePosterDisplayUrl = getStaticFileUrl(movieRef?.posterPath);
    const bookCoverDisplayUrl = getStaticFileUrl(bookRef?.coverPath);
    const screenshotDisplayUrl = getStaticFileUrl(screenshotUrl);

    // --- Render Logic: Success State ---
    return (
        <>
            {/* --- Helmet for Meta Tags --- */}
            {/* This component injects tags into the document's <head> */}
            <Helmet>
                <title>{pageTitle}</title>
                <link rel="canonical" href={canonicalUrl} />
                <meta name="description" content={metaDescription} />
                {/* Open Graph / Facebook Meta Tags */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:image" content={metaImageUrl} />
                {/* Twitter Card Meta Tags */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content={canonicalUrl} />
                <meta property="twitter:title" content={pageTitle} />
                <meta property="twitter:description" content={metaDescription} />
                <meta property="twitter:image" content={metaImageUrl} />
            </Helmet>
            {/* --- End Helmet --- */}

            {/* Main page container */}
            <div className={styles.pageContainer}>
                {/* Header section with title and creator info */}
                <div className={styles.connectionHeader}>
                    <h1 className={styles.title}>Connection Details</h1>
                    <p className={styles.meta}>
                        Created by <Link to={`/users/${userRef?._id}`}>{userRef?.username || 'Unknown User'}</Link> on {new Date(createdAt).toLocaleDateString()}
                    </p>
                </div>

                {/* Grid layout for Movie, Book, Context sections */}
                <div className={styles.contentGrid}>

                    {/* Movie Section */}
                    <div className={styles.movieSection}>
                        <h2 className={styles.sectionTitle}>Movie</h2>
                        {/* Conditionally render movie details if movieRef exists */}
                        {movieRef ? (
                             <>
                                {/* Display poster if URL exists */}
                                {moviePosterDisplayUrl && (
                                    <img
                                        src={moviePosterDisplayUrl}
                                        alt={`${movieRef.title} poster`}
                                        className={styles.image}
                                        onError={(e) => { e.target.style.display = 'none'; }} // Hide image on error
                                    />
                                )}
                                {/* Link to the movie's detail page */}
                                <Link to={`/movies/${movieRef._id}`} className={styles.itemTitleLink}>
                                    <h3>{movieRef.title} {movieRef.year ? `(${movieRef.year})` : ''}</h3>
                                </Link>
                                {/* Display other movie details */}
                                {movieRef.director && <p><strong>Director:</strong> {movieRef.director}</p>}
                                {movieRef.genres?.length > 0 && <p><strong>Genres:</strong> {movieRef.genres.join(', ')}</p>}
                                {movieRef.actors?.length > 0 && <p><strong>Actors:</strong> {movieRef.actors.join(', ')}</p>}
                                {movieRef.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {movieRef.synopsis}</p>}
                            </>
                        ) : (
                            <p>Movie details not available.</p> // Fallback message
                        )}
                    </div>

                    {/* Book Section */}
                    <div className={styles.bookSection}>
                        <h2 className={styles.sectionTitle}>Book</h2>
                        {/* Conditionally render book details if bookRef exists */}
                        {bookRef ? (
                             <>
                                {/* Display cover if URL exists */}
                                {bookCoverDisplayUrl && (
                                    <img
                                        src={bookCoverDisplayUrl}
                                        alt={`${bookRef.title} cover`}
                                        className={styles.image}
                                        onError={(e) => { e.target.style.display = 'none'; }} // Hide image on error
                                    />
                                )}
                                {/* Link to the book's detail page */}
                                <Link to={`/books/${bookRef._id}`} className={styles.itemTitleLink}>
                                    <h3>{bookRef.title}</h3>
                                </Link>
                                {/* Display other book details */}
                                {bookRef.author && <p><strong>Author:</strong> {bookRef.author}</p>}
                                {bookRef.publicationYear && <p><strong>Published:</strong> {bookRef.publicationYear}</p>}
                                {bookRef.genres?.length > 0 && <p><strong>Genres:</strong> {bookRef.genres.join(', ')}</p>}
                                {bookRef.isbn && <p><strong>ISBN:</strong> {bookRef.isbn}</p>}
                                {bookRef.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {bookRef.synopsis}</p>}
                            </>
                        ) : (
                            <p>Book details not available.</p> // Fallback message
                        )}
                    </div>

                    {/* Context & Screenshot Section */}
                    <div className={styles.contextSection}>
                        <h2 className={styles.sectionTitle}>Context</h2>
                        {/* Display the connection context text */}
                        <p className={styles.contextText}>{context || 'No context provided.'}</p>
                        {/* Display screenshot if URL exists */}
                        {screenshotDisplayUrl && (
                            <>
                                <h3 className={styles.screenshotTitle}>Screenshot</h3>
                                <img
                                    src={screenshotDisplayUrl}
                                    alt="Connection screenshot"
                                    className={`${styles.image} ${styles.screenshotImage}`}
                                    onError={(e) => { e.target.style.display = 'none'; }} // Hide image on error
                                />
                            </>
                        )}
                    </div>

                    {/* Tags Section */}
                    {/* Conditionally render tags section if tags array exists and is not empty */}
                    {tags?.length > 0 && (
                        <div className={styles.tagsSection}>
                            <h2 className={styles.sectionTitle}>Tags</h2>
                            <div className={styles.tagsContainer}>
                                {/* Map over the tags array */}
                                {tags.map(tag => (
                                    // Link each tag to the homepage with a tag filter query parameter
                                    <Link key={tag} to={`/?tags=${encodeURIComponent(tag)}`} className={styles.tagLink}>
                                        {/* Render the reusable Tag component */}
                                        <Tag tag={tag} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div> {/* End contentGrid */}

                {/* Back Button Container */}
                <div className={styles.backLinkContainer}>
                    {/* Use navigate(-1) to go back to the previous page in history */}
                    <button onClick={() => navigate(-1)} className={styles.backButton}>Go Back</button>
                </div>
            </div> {/* End pageContainer */}
        </>
    );
}

export default ConnectionDetailPage;

// client/src/pages/BookDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import {
    getBookById,
    getConnectionsByBookId,
    getStaticFileUrl
} from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import styles from './BookDetailPage.module.css';

const siteBaseUrl = window.location.origin; // For canonical and OG URLs

const BookDetailPage = () => {
    const { bookId } = useParams();
    const { user } = useAuth();

    const [bookDetails, setBookDetails] = useState(null);
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
            if (!bookId) {
                setError("No Book ID provided in URL.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            setBookDetails(null);
            setConnections([]);
            try {
                const [bookRes, connectionsRes] = await Promise.all([
                    getBookById(bookId),
                    getConnectionsByBookId(bookId)
                ]);
                setBookDetails(bookRes.data);
                setConnections(connectionsRes.data || []);
            } catch (err) {
                console.error("Error fetching book details or connections:", err);
                const errorMessage = err.response?.data?.message || err.message || 'Failed to load book data.';
                if (err.response?.status === 404 && err.config?.url?.includes(`/books/${bookId}`)) {
                    setError(`Book with ID ${bookId} not found.`);
                } else {
                    setError(errorMessage);
                }
                setBookDetails(null);
                setConnections([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [bookId]);

    if (loading) {
        return (
            <>
                <Helmet>
                    <title>Loading Book... | Movie-Books</title>
                </Helmet>
                <div className={styles.pageContainer}><LoadingSpinner /></div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Helmet>
                    <title>Book Not Found or Error | Movie-Books</title>
                    <meta name="description" content="Details for this book could not be loaded. It might not exist or there was an error." />
                </Helmet>
                <div className={`${styles.pageContainer} ${styles.errorContainer}`}>
                    <h2>Error Loading Book</h2>
                    <p>{error}</p>
                    {error.toLowerCase().includes('not found') && <p>The book you are looking for might not exist.</p>}
                    <Link to="/" className="button button-secondary">Back to Home</Link>
                </div>
            </>
        );
    }

    if (!bookDetails) {
        return (
            <>
                <Helmet>
                    <title>Book Details Unavailable | Movie-Books</title>
                    <meta name="description" content="Book details could not be loaded or found at this time." />
                </Helmet>
                <div className={styles.pageContainer}><ErrorMessage message="Book details could not be loaded or found." /></div>
            </>
        );
    }

    // --- Determine Cover URL Strategy ---
    let finalCoverUrl = '/placeholder-cover.png'; // Default book cover fallback
    if (bookDetails.coverPath) {
        finalCoverUrl = getStaticFileUrl(bookDetails.coverPath);
    } else if (connections && connections.length > 0 && connections[0].bookCoverUrl) {
        finalCoverUrl = getStaticFileUrl(connections[0].bookCoverUrl);
    }
    // For OG image, ensure it's a full URL
    const ogImageUrl = finalCoverUrl.startsWith('http') ? finalCoverUrl : `${siteBaseUrl}${finalCoverUrl.startsWith('/') ? '' : '/'}${finalCoverUrl}`;

    // --- Prepare dynamic meta content ---
    const pageTitle = `${bookDetails.title}${bookDetails.author ? ` by ${bookDetails.author}` : ''} - Book Details | Movie-Books`;
    const metaDescription = `Details and connections for the book ${bookDetails.title}${bookDetails.author ? ` by ${bookDetails.author}` : ''}. ${bookDetails.synopsis ? bookDetails.synopsis.substring(0, 110) + '...' : `Discover movie connections, publication year, genres, and more on Movie-Books.`}`;
    const canonicalUrl = `${siteBaseUrl}/books/${bookId}`;

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
                <meta property="og:type" content="book" />
                {bookDetails.author && <meta property="book:author" content={bookDetails.author} />}
                {bookDetails.isbn && <meta property="book:isbn" content={bookDetails.isbn} />}
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
                            src={finalCoverUrl}
                            alt={`${bookDetails.title} Cover`}
                            className={styles.coverImage}
                            onError={(e) => {
                                console.warn(`Image failed to load: ${finalCoverUrl}`);
                                e.target.onerror = null;
                                e.target.src = '/placeholder-cover.png';
                            }}
                        />
                    </div>
                    <div className={styles.infoContainer}>
                        <h1 className={styles.title}>{bookDetails.title}</h1>
                        {bookDetails.author && (
                            <p className={styles.author}>by {bookDetails.author}</p>
                        )}
                        <p className={styles.meta}>
                            {bookDetails.publicationYear && <span>{bookDetails.publicationYear}</span>}
                            {bookDetails.publicationYear && bookDetails.genres && bookDetails.genres.length > 0 && (
                                <span className={styles.metaSeparator}> | </span>
                            )}
                            {bookDetails.genres && bookDetails.genres.length > 0 && (
                                <span>{bookDetails.genres.join(', ')}</span>
                            )}
                        </p>
                        {bookDetails.isbn && <p><strong>ISBN:</strong> {bookDetails.isbn}</p>}
                        {bookDetails.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {bookDetails.synopsis}</p>}
                    </div>
                </div>

                <hr className={styles.divider} />

                <div className={styles.connectionsSection}>
                    <h2 className={styles.connectionsTitle}>Connections Featuring This Book</h2>
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
                            No connections have been made for this book yet.
                            {user && <Link to="/add-connection"> Be the first to add one!</Link>}
                            {!user && <span> Log in to add a connection.</span>}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default BookDetailPage;
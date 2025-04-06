// client/src/pages/BookDetailPage.js (Updated)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    getBookById,              // <-- Use named import
    getConnectionsByBookId,   // <-- Use named import
    getStaticFileUrl          // Use updated helper
} from '../services/api';      // <-- Import from api.js
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import { useAuth } from '../contexts/AuthContext'; // <-- Use useAuth hook
import styles from './BookDetailPage.module.css'; // <-- Use CSS Module (Create next)

const BookDetailPage = () => {
    const { bookId } = useParams(); // Get bookId from route params
    const { user } = useAuth(); // Get user from context

    const [bookDetails, setBookDetails] = useState(null);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Interaction Handlers (Keep your existing callbacks) ---
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

    // Effect to fetch book details and related connections concurrently
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
            // console.log(`Fetching data for book ID: ${bookId}`);
            try {
                const [bookRes, connectionsRes] = await Promise.all([
                    getBookById(bookId),             // <-- Use named function
                    getConnectionsByBookId(bookId)   // <-- Use named function
                ]);
                // console.log("Book Details Response Data:", bookRes.data);
                // console.log("Connections Response Data:", connectionsRes.data);
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
    }, [bookId]); // Dependency array only needs bookId

    // --- Render Logic ---
    if (loading) {
        return <div className={styles.pageContainer}><LoadingSpinner /></div>;
    }
    if (error) {
        return (
            <div className={`${styles.pageContainer} ${styles.errorContainer}`}>
                <h2>Error Loading Book</h2>
                <p>{error}</p>
                {error.toLowerCase().includes('not found') && <p>The book you are looking for might not exist.</p>}
                <Link to="/" className="button button-secondary">Back to Home</Link>
            </div>
        );
    }
    if (!bookDetails) {
        return <div className={styles.pageContainer}><ErrorMessage message="Book details could not be loaded or found." /></div>;
    }

    // --- Determine Cover URL Strategy (Similar to Movie Detail Page) ---
    let finalCoverUrl = '/placeholder-cover.png'; // Default book cover fallback

    // 1. Prioritize coverPath directly from the Book document
    if (bookDetails.coverPath) {
        finalCoverUrl = getStaticFileUrl(bookDetails.coverPath);
        // console.log("Using coverPath from Book Details:", finalCoverUrl);
    }
    // 2. If book cover is missing, AND we have connections, try the first connection's cover
    else if (connections && connections.length > 0 && connections[0].bookCoverUrl) {
        // Check the bookCoverUrl field on the Connection object
        // Ensure GET /api/books/:id/connections returns this field
        finalCoverUrl = getStaticFileUrl(connections[0].bookCoverUrl);
        // console.log("Falling back to coverPath from first Connection:", finalCoverUrl);
    }
    // console.log("Final Cover URL decided:", finalCoverUrl);
    // --- End Cover URL Strategy ---


    return (
        <div className={styles.pageContainer}>
            {/* Book Details Section */}
            <div className={styles.detailsSection}>
                <div className={styles.imageContainer}>
                     <img
                        src={finalCoverUrl} // <-- Use the determined URL
                        alt={`${bookDetails.title} Cover`}
                        className={styles.coverImage} // Use coverImage style
                         onError={(e) => { // Optional: Handle broken image links
                          console.warn(`Image failed to load: ${finalCoverUrl}`);
                          e.target.onerror = null; // prevent looping
                          e.target.src = '/placeholder-cover.png'; // Set to book fallback on error
                        }}
                    />
                </div>
                <div className={styles.infoContainer}>
                    <h1 className={styles.title}>{bookDetails.title}</h1>
                     {/* Display Author prominently */}
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
                    {/* Add other relevant book fields */}
                    {bookDetails.isbn && <p><strong>ISBN:</strong> {bookDetails.isbn}</p>}
                    {bookDetails.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {bookDetails.synopsis}</p>}
                </div>
            </div>

            <hr className={styles.divider} />

            {/* Connections Section */}
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
    );
};

export default BookDetailPage;
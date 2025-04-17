// client/src/pages/BookDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import hooks and components from React Router

// Import API functions and helper for static file URLs
import {
    getBookById,
    getConnectionsByBookId,
    getStaticFileUrl
} from '../services/api';

// Import reusable UI components
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';

// Import custom hook for authentication context
import { useAuth } from '../contexts/AuthContext';

// Import page-specific styles
import styles from './BookDetailPage.module.css';

/**
 * Renders the detail page for a specific book.
 * Displays book information (title, author, cover, etc.) and a list of
 * connections where this book is featured.
 */
const BookDetailPage = () => {
    // --- Hooks ---
    // Get the 'bookId' from the URL parameters (e.g., /books/:bookId)
    const { bookId } = useParams();
    // Get the current logged-in user from the AuthContext
    const { user } = useAuth();

    // --- State Variables ---
    // Holds the detailed information about the book fetched from the API
    const [bookDetails, setBookDetails] = useState(null);
    // Holds the array of connection objects related to this book
    const [connections, setConnections] = useState([]);
    // Tracks the loading state while fetching data
    const [loading, setLoading] = useState(true);
    // Holds any error messages that occur during data fetching
    const [error, setError] = useState(null);

    // --- Interaction Handlers ---
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

    // --- Data Fetching Effect ---
    /**
     * useEffect hook to fetch the book details and its associated connections
     * when the component mounts or when the 'bookId' URL parameter changes.
     */
    useEffect(() => {
        const fetchData = async () => {
             // Validate bookId presence
             if (!bookId) {
                setError("No Book ID provided in URL.");
                setLoading(false);
                return;
            }
            // Reset state before fetching
            setLoading(true);
            setError(null);
            setBookDetails(null);
            setConnections([]);
            // console.log(`Fetching data for book ID: ${bookId}`); // Debug log removed

            try {
                // Fetch book details and connections concurrently using Promise.all
                const [bookRes, connectionsRes] = await Promise.all([
                    getBookById(bookId),
                    getConnectionsByBookId(bookId)
                ]);
                // console.log("Book Details Response Data:", bookRes.data); // Debug log removed
                // console.log("Connections Response Data:", connectionsRes.data); // Debug log removed

                // Update state with fetched data
                setBookDetails(bookRes.data);
                // Ensure connections is always an array, even if API returns null/undefined
                setConnections(connectionsRes.data || []);
            } catch (err) {
                // Handle errors during fetching
                console.error("Error fetching book details or connections:", err); // Keep error log
                const errorMessage = err.response?.data?.message || err.message || 'Failed to load book data.';
                // Provide a specific message for 404 errors related to the book itself
                if (err.response?.status === 404 && err.config?.url?.includes(`/books/${bookId}`)) {
                    setError(`Book with ID ${bookId} not found.`);
                } else {
                    setError(errorMessage);
                }
                // Clear potentially stale data on error
                setBookDetails(null);
                setConnections([]);
            } finally {
                // Ensure loading state is turned off after the fetch attempt
                setLoading(false);
            }
        };
        fetchData();
    }, [bookId]); // Dependency array: Re-run the effect only if bookId changes

    // --- Render Logic ---

    // 1. Loading State
    if (loading) {
        return <div className={styles.pageContainer}><LoadingSpinner /></div>;
    }

    // 2. Error State
    if (error) {
        return (
            <div className={`${styles.pageContainer} ${styles.errorContainer}`}>
                <h2>Error Loading Book</h2>
                <p>{error}</p>
                {/* Add helpful text if it's a 'not found' error */}
                {error.toLowerCase().includes('not found') && <p>The book you are looking for might not exist.</p>}
                {/* Provide a link back home */}
                <Link to="/" className="button button-secondary">Back to Home</Link>
            </div>
        );
    }

    // 3. No Data State (after loading and no error)
    if (!bookDetails) {
        // This case might occur if the API returns success but with empty data
        return <div className={styles.pageContainer}><ErrorMessage message="Book details could not be loaded or found." /></div>;
    }

    // 4. Success State - Prepare Data for Rendering

    // --- Determine Cover URL Strategy ---
    // Define a default fallback image path
    let finalCoverUrl = '/placeholder-cover.png';

    // Priority 1: Use the 'coverPath' directly from the fetched book details if available.
    if (bookDetails.coverPath) {
        finalCoverUrl = getStaticFileUrl(bookDetails.coverPath);
        // console.log("Using coverPath from Book Details:", finalCoverUrl); // Debug log removed
    }
    // Priority 2: If book cover is missing AND connections exist, try the 'bookCoverUrl'
    // from the first connection in the list. (Assumes connections are sorted or order doesn't matter).
    // Note: This relies on the backend API endpoint for connections including 'bookCoverUrl'.
    else if (connections && connections.length > 0 && connections[0].bookCoverUrl) {
        finalCoverUrl = getStaticFileUrl(connections[0].bookCoverUrl);
        // console.log("Falling back to coverPath from first Connection:", finalCoverUrl); // Debug log removed
    }
    // console.log("Final Cover URL decided:", finalCoverUrl); // Debug log removed
    // --- End Cover URL Strategy ---

    // --- Render Success UI ---
    return (
        <div className={styles.pageContainer}>
            {/* Book Details Section (Top part of the page) */}
            <div className={styles.detailsSection}>
                {/* Container for the book cover image */}
                <div className={styles.imageContainer}>
                     <img
                        src={finalCoverUrl} // Use the determined URL
                        alt={`${bookDetails.title} Cover`}
                        className={styles.coverImage} // Apply specific styling for the cover
                         onError={(e) => { // Handle cases where the image fails to load
                          console.warn(`Image failed to load: ${finalCoverUrl}`); // Keep warning log
                          e.target.onerror = null; // Prevent infinite loop if fallback also fails
                          e.target.src = '/placeholder-cover.png'; // Set to the default fallback image
                        }}
                    />
                </div>
                {/* Container for the book's textual information */}
                <div className={styles.infoContainer}>
                    <h1 className={styles.title}>{bookDetails.title}</h1>
                     {/* Display Author prominently */}
                     {bookDetails.author && (
                        <p className={styles.author}>by {bookDetails.author}</p>
                     )}
                     {/* Meta information line (Year | Genres) */}
                     <p className={styles.meta}>
                        {bookDetails.publicationYear && <span>{bookDetails.publicationYear}</span>}
                        {/* Separator only shown if both year and genres exist */}
                        {bookDetails.publicationYear && bookDetails.genres?.length > 0 && (
                            <span className={styles.metaSeparator}> | </span>
                         )}
                        {bookDetails.genres?.length > 0 && (
                            <span>{bookDetails.genres.join(', ')}</span>
                        )}
                    </p>
                    {/* Other book details */}
                    {bookDetails.isbn && <p><strong>ISBN:</strong> {bookDetails.isbn}</p>}
                    {bookDetails.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {bookDetails.synopsis}</p>}
                </div>
            </div>

            {/* Divider line between book details and connections */}
            <hr className={styles.divider} />

            {/* Connections Section (Bottom part of the page) */}
            <div className={styles.connectionsSection}>
              <h2 className={styles.connectionsTitle}>Connections Featuring This Book</h2>
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
                        No connections have been made for this book yet.
                        {/* Show different prompts based on login status */}
                        {user && <Link to="/add-connection"> Be the first to add one!</Link>}
                         {!user && <span> Log in to add a connection.</span>}
                    </p>
                )}
            </div>
        </div>
    );
};

export default BookDetailPage;

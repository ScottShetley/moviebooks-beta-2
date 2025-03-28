// client/src/pages/BookDetailPage.js
import React, { useState, useEffect, useCallback } from 'react'; // Ensure useCallback is imported
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';

// Optional: Add page-specific styles
// import styles from './DetailPage.module.css';

const BookDetailPage = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [connections, setConnections] = useState([]); // State holding the connections for this book
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
    // console.log(`Connection ${deletedConnectionId} removed from BookDetailPage state.`);
  }, []); // Empty dependency array as setConnections is stable
  // --- END OF ADDITION 1 ---

  // Effect to fetch book details and related connections
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const connectionsRes = await api.get(`/books/${bookId}/connections`);
        setConnections(connectionsRes.data); // Update connections state

        // ... (existing logic to set book details)
        if (!book && connectionsRes.data.length > 0) {
             setBook(connectionsRes.data[0].bookRef);
        } else if (!book) {
             try {
                 const bookRes = await api.get(`/books/${bookId}`);
                 setBook(bookRes.data);
            } catch (bookErr) {
                 console.error("Could not find book details either.", bookErr)
                 setBook({ _id: bookId, title: "Book Details" });
            }
        }

      } catch (err) {
        // ... (existing error handling)
        const message = err.response?.data?.message || err.message || "Failed to load book data.";
        console.error("Fetch book data error:", err);
        setError(message);
        setBook(null);
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };

     if (bookId) {
      fetchData();
    } else {
        setError("No Book ID provided.");
        setLoading(false);
    }
  }, [bookId, book]);

  // Render component
  return (
    <div /* Optional: className={styles.detailPage} */>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && book && (
        <>
          <h1>{book.title}</h1>
          <p>Appearances in the MovieBooks feed:</p>

          {connections.length === 0 ? (
             <p>No movie connections found for this book yet.</p>
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
      {!loading && !error && !book && <ErrorMessage message="Book details could not be loaded." /> }
    </div>
  );
};

export default BookDetailPage;
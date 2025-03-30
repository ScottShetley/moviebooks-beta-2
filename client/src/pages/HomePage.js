// client/src/pages/HomePage.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
// import styles from './HomePage.module.css'; // If you create styles

const HomePage = () => {
    // Initialize state with an empty array, which is correct
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Optional: Add state for pagination if you want to implement it later
    // const [page, setPage] = useState(1);
    // const [pages, setPages] = useState(1);

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
        const fetchConnections = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch data for the current page (add page state later if needed)
                const { data } = await api.get('/connections'/*, { params: { pageNumber: page } }*/);

                // --- CORRECTED STATE UPDATE ---
                // Check if data and data.connections exist and are an array
                if (data && Array.isArray(data.connections)) {
                     // Set state with the connections array *from* the response object
                    setConnections(data.connections);
                     // Optional: Set page info if using pagination state
                     // setPage(data.page);
                     // setPages(data.pages);
                } else {
                    // Handle unexpected response structure
                    console.error("Unexpected API response structure:", data);
                    setConnections([]); // Set to empty array to avoid map error
                    setError("Received invalid data from server.");
                }
                // --- END CORRECTION ---

            } catch (err) {
                const message = err.response?.data?.message || err.message || "Failed to fetch connections.";
                console.error("Fetch connections error:", err);
                setError(message);
                setConnections([]); // Ensure connections is an array on error
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
        // Add 'page' to dependency array if implementing pagination fetch trigger
    }, []/* [page] */);


    return (
        <div> {/* Consider adding className={styles.container} if using CSS Modules */}
            <h1>MovieBooks Feed</h1>
            {/* <p>Discover books spotted in movies!</p> */}

            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}

            {/* Only attempt to map if not loading, no error, and connections is an array */}
            {!loading && !error && Array.isArray(connections) && (
                <div>
                    {connections.length === 0 ? (
                        <p>No connections found yet. Be the first to add one!</p>
                    ) : (
                        <div> {/* Consider className={styles.feedList} */}
                            {connections.map((connection) => (
                                <ConnectionCard
                                    key={connection._id}
                                    connection={connection}
                                    onUpdate={updateConnectionInState}
                                    onDelete={handleDeleteConnection}
                                />
                            ))}
                            {/* Add Pagination controls here later if needed */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HomePage;
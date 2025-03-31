// client/src/pages/HomePage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import Input from '../components/Common/Input/Input'; // Import Input for filter
import Button from '../components/Common/Button/Button'; // Import Button for filter actions
import styles from './HomePage.module.css'; // Create and import CSS module

const HomePage = () => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [totalConnections, setTotalConnections] = useState(0); // Optional: for display

    // --- NEW: State for Filtering ---
    const [tagFilterInput, setTagFilterInput] = useState(''); // User's input
    const [activeTagFilter, setActiveTagFilter] = useState(''); // The filter currently applied (comma-separated string)
    const [isFilterApplied, setIsFilterApplied] = useState(false); // Track if a filter is active
    const isInitialMount = useRef(true); // Ref to prevent initial fetch on filter state change
    // --- END Filter State ---

    // --- Fetch Connections Function ---
    const fetchConnections = useCallback(async (currentPage, currentFilter) => {
        console.log(`[HomePage] Fetching connections - Page: ${currentPage}, Filter: '${currentFilter}'`);
        setLoading(true);
        setError(null);
        try {
            const params = {
                pageNumber: currentPage,
            };
            // Only add tags parameter if the filter is active and not empty
            if (currentFilter && currentFilter.trim() !== '') {
                params.tags = currentFilter.trim();
            }

            const { data } = await api.get('/connections', { params });

            if (data && Array.isArray(data.connections)) {
                console.log(`[HomePage] Received ${data.connections.length} connections. Total matching: ${data.pages * params.pageSize || data.connections.length}. Filter applied by API: ${data.filterApplied}`); // Log API response details

                // Set state with the connections array *from* the response object
                setConnections(data.connections);
                setPage(data.page);
                setPages(data.pages);
                setIsFilterApplied(data.filterApplied || false); // Update based on API response

                // Optional: Update total count (might need backend adjustment if not filtering)
                // If filtering, 'count' in the response is filtered count.
                // If not filtering, it's the total count.
                // setTotalConnections(data.count); // Assumes backend sends 'count'
            } else {
                console.error("[HomePage] Unexpected API response structure:", data);
                setConnections([]);
                setPage(1);
                setPages(1);
                setError("Received invalid data from server.");
                setIsFilterApplied(false);
            }

        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to fetch connections.";
            console.error("[HomePage] Fetch connections error:", err.response || err);
            setError(message);
            setConnections([]); // Ensure connections is an array on error
            setPage(1);
            setPages(1);
            setIsFilterApplied(false);
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies here, parameters are passed in

    // --- Effect for Initial Load and Filter/Page Changes ---
    useEffect(() => {
        // Skip fetch on initial mount if triggered by filter state initialization
        if (isInitialMount.current) {
             isInitialMount.current = false;
             // Fetch initial data without filter
             fetchConnections(1, ''); // Initial fetch page 1, no filter
        } else {
            // Fetch when page or activeTagFilter changes
            fetchConnections(page, activeTagFilter);
        }
    }, [page, activeTagFilter, fetchConnections]);


    // --- Handlers for State Updates (Likes, Deletes) ---
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
        // Optionally refetch to get correct total count/pages after deletion
        // fetchConnections(page, activeTagFilter); // Or just adjust counts locally if possible
    }, []);
    // --- END State Update Handlers ---

    // --- Filter Action Handlers ---
    const handleApplyFilter = (e) => {
        e.preventDefault(); // Prevent form submission if inside a form
        const newFilter = tagFilterInput.trim();
        console.log(`[HomePage] Applying filter: '${newFilter}'`);
        setActiveTagFilter(newFilter); // Update the active filter
        setPage(1); // Reset to page 1 when applying a new filter
        // The useEffect will trigger the fetch
    };

    const handleClearFilter = () => {
        console.log('[HomePage] Clearing filter.');
        setTagFilterInput(''); // Clear the input field
        setActiveTagFilter(''); // Clear the active filter
        setPage(1); // Reset to page 1
        // The useEffect will trigger the fetch
    };
    // --- END Filter Action Handlers ---

     // --- Pagination Handlers ---
    const goToPreviousPage = () => {
        setPage(prevPage => Math.max(1, prevPage - 1));
    };

    const goToNextPage = () => {
        setPage(prevPage => Math.min(pages, prevPage + 1));
    };
    // --- END Pagination Handlers ---

    return (
        <div className={styles.homePageContainer}>
            <h1>MovieBooks Feed</h1>

            {/* --- Filter UI --- */}
            <div className={styles.filterContainer}>
                <Input
                    id="tagFilter"
                    label="Filter by Tags"
                    placeholder="e.g., sci-fi, time travel"
                    value={tagFilterInput}
                    onChange={(e) => setTagFilterInput(e.target.value)}
                    disabled={loading}
                    className={styles.filterInput} // Add specific class if needed
                />
                <Button
                    variant="secondary"
                    onClick={handleApplyFilter}
                    disabled={loading || tagFilterInput.trim() === activeTagFilter.trim()} // Disable if loading or filter unchanged
                    className={styles.filterButton}
                >
                    Apply Filter
                </Button>
                <Button
                    variant="outline"
                    onClick={handleClearFilter}
                    disabled={loading || !isFilterApplied} // Disable if loading or no filter applied
                    className={styles.clearFilterButton}
                >
                    Clear Filter
                </Button>
            </div>
            {isFilterApplied && activeTagFilter && (
                <p className={styles.activeFilterInfo}>
                    Showing connections tagged with: "{activeTagFilter}"
                </p>
            )}
            {/* --- END Filter UI --- */}


            {/* --- Loading & Error States --- */}
            {loading && <div className={styles.centered}><LoadingSpinner /></div>}
            {!loading && error && <ErrorMessage message={error} />}
            {/* --- END Loading & Error --- */}


            {/* --- Connection Feed --- */}
            {!loading && !error && (
                <>
                    {connections.length === 0 ? (
                        <p className={styles.noResults}>
                            {isFilterApplied ? 'No connections found matching your filter.' : 'No connections found yet. Be the first to add one!'}
                        </p>
                    ) : (
                        <div className={styles.feedList}>
                            {connections.map((connection) => (
                                <ConnectionCard
                                    key={connection._id}
                                    connection={connection}
                                    onUpdate={updateConnectionInState}
                                    onDelete={handleDeleteConnection}
                                />
                            ))}
                        </div>
                    )}

                    {/* --- Pagination Controls --- */}
                    {pages > 1 && (
                        <div className={styles.paginationControls}>
                            <Button onClick={goToPreviousPage} disabled={page <= 1 || loading}>
                                Previous
                            </Button>
                            <span className={styles.pageInfo}>
                                Page {page} of {pages}
                            </span>
                            <Button onClick={goToNextPage} disabled={page >= pages || loading}>
                                Next
                            </Button>
                        </div>
                    )}
                    {/* --- END Pagination Controls --- */}
                </>
            )}
             {/* --- END Connection Feed --- */}
        </div>
    );
};

export default HomePage;
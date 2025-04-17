// client/src/pages/HomePage.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// Import connection card components
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import TextConnectionCard from '../components/Connection/TextConnectionCard/TextConnectionCard';
// Import reusable UI components
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import Input from '../components/Common/Input/Input';
import Button from '../components/Common/Button/Button';
// Import page-specific styles
import styles from './HomePage.module.css';
// Import configured API instance
import api from '../services/api';

// --- Helper Functions ---
/**
 * Checks if any local filter values are active (not empty strings).
 * @param {object} filters - The local filter state object.
 * @returns {boolean} - True if any local filter is active, false otherwise.
 */
const hasActiveLocalFilters = (filters) => {
    if (!filters) return false;
    // Check if at least one value in the filters object is truthy after trimming
    return Object.values(filters).some(value => value && value.trim() !== '');
};

/**
 * Formats the active local filters into a human-readable string for display.
 * @param {object} filters - The local filter state object.
 * @returns {string} - A formatted string describing the active filters.
 */
const formatActiveLocalFilters = (filters) => {
    if (!filters || !hasActiveLocalFilters(filters)) return '';
    // Convert object to entries, filter out empty values, format key-value pairs, and join
    return Object.entries(filters)
        .filter(([, value]) => value && value.trim() !== '')
        .map(([key, value]) => {
            // Format the key for display (e.g., 'movieGenre' -> 'Movie Genre')
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `${displayKey}: "${value}"`;
        })
        .join('; ');
};
// --- End Helper Functions ---

/**
 * Renders the main feed page, displaying connections with filtering and pagination.
 */
const HomePage = ({ currentFilterTag, clearTagFilter }) => {
    // --- State Variables for Feed Data ---
    // Holds the array of connection objects fetched from the API
    const [connections, setConnections] = useState([]);
    // Tracks loading state while fetching connections
    const [loading, setLoading] = useState(true);
    // Holds error messages related to fetching connections
    const [error, setError] = useState(null);
    // Current page number for pagination
    const [page, setPage] = useState(1);
    // Total number of pages available based on current filters
    const [pages, setPages] = useState(1);

    // --- State Variables for Local Filters ---
    // Input field values for the advanced filter panel
    const [movieGenreInput, setMovieGenreInput] = useState('');
    const [directorInput, setDirectorInput] = useState('');
    const [actorInput, setActorInput] = useState('');
    const [bookGenreInput, setBookGenreInput] = useState('');
    const [authorInput, setAuthorInput] = useState('');
    // The currently applied local filters (used in API calls)
    const [activeFilters, setActiveFilters] = useState({});
    // Controls the visibility of the advanced filter panel
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    // Memoized boolean indicating if any local filters are currently applied
    const isLocalFilterApplied = useMemo(() => hasActiveLocalFilters(activeFilters), [activeFilters]);
    // Ref to track if it's the initial component mount to prevent double fetching
    const isInitialMount = useRef(true);
    // Function to toggle the filter panel visibility
    const toggleFilterPanel = () => setIsFilterExpanded(prev => !prev);

    // --- Function to Fetch Connections ---
    /**
     * Fetches connections from the API based on the current page, local filters, and global tag filter.
     * Updates the connections, page, pages, loading, and error states.
     * @param {number} currentPage - The page number to fetch.
     * @param {object} currentLocalFilters - The active local filters object.
     * @param {string} globalTagFilter - The currently active global tag filter (from props).
     */
    const fetchConnections = useCallback(async (currentPage, currentLocalFilters, globalTagFilter) => {
        setLoading(true); // Set loading state
        setError(null); // Clear previous errors
        try {
            // Prepare query parameters for the API request
            const params = { pageNumber: currentPage };
            // Add local filters to params if they have values
            for (const key in currentLocalFilters) {
                const value = currentLocalFilters[key]?.trim();
                if (value) params[key] = value;
            }
            // Add global tag filter to params if it exists
            if (globalTagFilter && globalTagFilter.trim() !== '') {
                params.tags = globalTagFilter.trim();
            }
            // Make the API call
            const { data } = await api.get('/connections', { params });

            // Validate the response structure
            if (data && Array.isArray(data.connections)) {
                // Update state with fetched data
                setConnections(data.connections);
                setPage(data.page);
                setPages(data.pages);
            } else {
                // Handle unexpected data structure from the server
                // console.warn("[HomePage] Received unexpected data structure:", data); // Warning log removed
                setConnections([]); setPage(1); setPages(1);
                setError("Received invalid data from server.");
            }
        } catch (err) {
            // Handle errors during fetching
            const message = err.response?.data?.message || err.message || "Failed to fetch connections.";
            console.error("[HomePage] Fetch Connections Error:", err); // Keep error log
            setError(message);
            // Reset state on error
            setConnections([]); setPage(1); setPages(1);
        } finally {
            // Ensure loading state is turned off after the attempt
            setLoading(false);
        }
    }, []); // Empty dependency array: Function logic doesn't depend on component state/props directly

    // --- Effect for Initial Load and Filter/Page Changes ---
    /**
     * useEffect hook to trigger fetching connections:
     * 1. On initial component mount (using the isInitialMount ref).
     * 2. Whenever the page number, active local filters, or global tag filter change.
     */
    useEffect(() => {
        // On initial mount, fetch page 1 with no local filters but with the current global tag
        if (isInitialMount.current) {
            isInitialMount.current = false; // Set ref to false after initial mount
            fetchConnections(1, {}, currentFilterTag);
        } else {
            // On subsequent renders (due to dependency changes), fetch based on current state
            fetchConnections(page, activeFilters, currentFilterTag);
        }
        // Dependencies: Re-run effect if page, activeFilters, currentFilterTag, or fetchConnections instance change
    }, [page, activeFilters, currentFilterTag, fetchConnections]);

    // --- State Update Handlers (Callbacks for Child Components) ---
    /**
     * Callback passed to connection cards to update a connection's state locally
     * after an action like liking or commenting.
     * @param {object} updatedConnection - The updated connection object from the API.
     */
    const updateConnectionInState = useCallback((updatedConnection) => {
        // console.log("[HomePage] Updating connection in state:", updatedConnection._id); // Debug log removed
        // Use functional update form to ensure we work with the latest state
        setConnections(prev =>
            prev.map(c => (c._id === updatedConnection._id ? updatedConnection : c))
        );
    }, []); // Empty dependency array

    /**
     * Callback passed to connection cards to remove a connection from the local state
     * after it has been successfully deleted.
     * @param {string} deletedConnectionId - The ID of the connection that was deleted.
     */
    const handleDeleteConnection = useCallback((deletedConnectionId) => {
        // console.log('[HomePage] handleDeleteConnection called with ID:', deletedConnectionId); // Debug log removed
        // Use functional update form
        setConnections(prev => prev.filter(c => c._id !== deletedConnectionId));
    }, []); // Empty dependency array

    // --- Filter Handlers ---
    /**
     * Applies the local filters entered in the filter panel.
     * Updates the activeFilters state and resets the page number to 1 if filters changed.
     * Closes the filter panel.
     * @param {React.FormEvent<HTMLFormElement>} [e] - Optional form event (to prevent default).
     */
    const handleApplyFilter = useCallback((e) => {
        if(e) e.preventDefault(); // Prevent default form submission if triggered by form
        // Create an object with the current trimmed input values
        const newLocalFilters = {
            movieGenre: movieGenreInput.trim(),
            director: directorInput.trim(),
            actor: actorInput.trim(),
            bookGenre: bookGenreInput.trim(),
            author: authorInput.trim()
        };
        // Filter out empty values to get the filters that should actually be applied
        const filtersToApply = Object.entries(newLocalFilters).reduce((acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
        }, {});
        // Only update state and reset page if the filters have actually changed
        if(JSON.stringify(activeFilters) !== JSON.stringify(filtersToApply)) {
            setActiveFilters(filtersToApply);
            setPage(1); // Reset to page 1 when filters change
        }
        setIsFilterExpanded(false); // Close the filter panel
    }, [movieGenreInput, directorInput, actorInput, bookGenreInput, authorInput, activeFilters]); // Dependencies

    /**
     * Clears all local filter input fields and resets the active local filters state.
     * Resets the page number to 1 if filters were active.
     */
    const handleClearLocalFilter = useCallback(() => {
        // Clear input field states
        setMovieGenreInput(''); setDirectorInput(''); setActorInput('');
        setBookGenreInput(''); setAuthorInput('');
        // Only update activeFilters and reset page if filters were actually applied
        if(Object.keys(activeFilters).length > 0) {
            setActiveFilters({});
            setPage(1); // Reset to page 1
        }
    }, [activeFilters]); // Dependency: activeFilters

    // --- Pagination Handlers ---
    /** Navigates to the previous page, ensuring page number doesn't go below 1. */
    const goToPreviousPage = () => setPage(p => Math.max(1, p - 1));
    /** Navigates to the next page, ensuring page number doesn't exceed total pages. */
    const goToNextPage = () => setPage(p => Math.min(pages, p + 1));

    // --- Memoized Value for Filter Changes ---
    /**
     * Memoized boolean indicating if the current input values differ from the applied activeFilters.
     * Used to enable/disable the "Apply Filters" button.
     */
     const localFiltersChanged = useMemo(() => {
         // Get current trimmed input values, filtering out empty ones
         const currentInputFilters = {
             movieGenre: movieGenreInput.trim(), director: directorInput.trim(),
             actor: actorInput.trim(), bookGenre: bookGenreInput.trim(),
             author: authorInput.trim()
         };
         const relevantInputFilters = Object.entries(currentInputFilters).reduce((acc, [k, v]) => {
             if(v) acc[k]=v; return acc;
         }, {});
         // Compare stringified versions of the relevant input filters and active filters
         return JSON.stringify(activeFilters) !== JSON.stringify(relevantInputFilters);
    }, [movieGenreInput, directorInput, actorInput, bookGenreInput, authorInput, activeFilters]); // Dependencies

    // --- Render Logic ---
    return (
         <div className={styles.mainContentArea}>
             <h1>MovieBooks Feed</h1>

             {/* --- Global Tag Filter Status --- */}
             {/* Display if a global tag filter is active (passed via props) */}
             {currentFilterTag && (
                 <div className={styles.filterStatus} style={{ marginBottom: '20px', backgroundColor: 'var(--color-accent-subtle)' }}>
                     <span className={styles.activeTagFilter}>
                         Filtering by tag: <strong>#{currentFilterTag}</strong>
                         {/* Button to clear the global tag filter (calls function passed via props) */}
                         <button onClick={clearTagFilter} className={styles.clearFilterButton} title="Clear tag filter" style={{ marginLeft: '10px' }} > × </button>
                     </span>
                 </div>
             )}

             {/* --- Local Advanced Filter Panel --- */}
             <div className={styles.filterTabContainer}>
                {/* Button to toggle the filter panel visibility */}
                <button
                    className={`${styles.filterTab} ${isLocalFilterApplied ? styles.filterTabActive : ''}`}
                    onClick={toggleFilterPanel}
                    aria-expanded={isFilterExpanded} // Accessibility: indicates panel state
                    aria-controls="filter-panel" // Accessibility: links button to panel
                >
                    <span>Filters</span>
                    {/* Visual indicator if local filters are active */}
                    {isLocalFilterApplied && ( <span className={styles.filterActiveIndicator}></span> )}
                </button>
                {/* Conditionally render the filter panel */}
                {isFilterExpanded && (
                    <div id="filter-panel" className={styles.filterPanel}>
                        {/* Filter form with onSubmit handler */}
                        <form onSubmit={handleApplyFilter} className={styles.filterForm}>
                            <fieldset className={styles.filterFieldset}>
                                <legend>Filter Connections (Advanced)</legend>
                                {/* Grid layout for filter input fields */}
                                <div className={styles.filterGrid}>
                                    {/* Reusable Input components for each filter field */}
                                    <Input id="movieGenreFilter" label="Movie Genre" placeholder="Thriller" value={movieGenreInput} onChange={(e) => setMovieGenreInput(e.target.value)} disabled={loading} />
                                    <Input id="directorFilter" label="Director" placeholder="Tarantino" value={directorInput} onChange={(e) => setDirectorInput(e.target.value)} disabled={loading} />
                                    <Input id="actorFilter" label="Actor" placeholder="Travolta" value={actorInput} onChange={(e) => setActorInput(e.target.value)} disabled={loading} />
                                    <Input id="bookGenreFilter" label="Book Genre" placeholder="Adventure" value={bookGenreInput} onChange={(e) => setBookGenreInput(e.target.value)} disabled={loading} />
                                    <Input id="authorFilter" label="Author" placeholder="O'Donnell" value={authorInput} onChange={(e) => setAuthorInput(e.target.value)} disabled={loading} />
                                </div>
                                {/* Action buttons within the filter panel */}
                                <div className={styles.filterActions}>
                                    {/* Apply Filters button, disabled if loading or no changes made */}
                                    <Button type="submit" variant="secondary" disabled={loading || !localFiltersChanged} className={styles.filterButton}> Apply Filters </Button>
                                    {/* Clear Filters button, disabled if loading or no filters applied */}
                                    <Button type="button" variant="outline" onClick={handleClearLocalFilter} disabled={loading || !isLocalFilterApplied} className={styles.clearFilterButton}> Clear Advanced Filters </Button>
                                </div>
                            </fieldset>
                        </form>
                    </div>
                )}
             </div>
             {/* Display formatted string of active local filters if any are applied */}
             {isLocalFilterApplied && (
                 <p className={styles.activeFilterInfo}> Advanced filters active: {formatActiveLocalFilters(activeFilters)} </p>
             )}
             {/* --- End Filters UI --- */}

             {/* --- Loading/Error/Feed Content Area --- */}
             {/* Display loading spinner while fetching */}
             {loading && <div className={styles.centered}><LoadingSpinner /></div>}
             {/* Display error message if fetch failed */}
             {!loading && error && <ErrorMessage message={error} />}
             {/* Display feed content if not loading and no error */}
             {!loading && !error && (
                 <>
                     {/* Display message if no connections found */}
                     {connections.length === 0 ? (
                        <p className={styles.noResults}>
                             {/* Show different message based on whether filters are active */}
                             {isLocalFilterApplied || currentFilterTag ? 'No connections found matching your filter(s).' : 'No connections found yet. Be the first to add one!'}
                        </p>
                     ) : (
                        // Display the list of connection cards
                        <div className={styles.feedList}>
                            {/* Map over the connections array */}
                            {connections.map((connection) => {
                                // Determine if it's a standard connection (with movie/book) or text-only
                                const isStandardConnection = connection.movieRef && connection.bookRef && connection.movieRef._id && connection.bookRef._id;
                                // Render the appropriate card component
                                if (isStandardConnection) {
                                    return (
                                        <ConnectionCard
                                            key={connection._id} // Unique key
                                            connection={connection} // Pass data
                                            onUpdate={updateConnectionInState} // Pass update callback
                                            onDelete={handleDeleteConnection} // Pass delete callback
                                        />
                                    );
                                } else {
                                    return (
                                        <TextConnectionCard
                                            key={connection._id} // Unique key
                                            connection={connection} // Pass data
                                            onUpdate={updateConnectionInState} // Pass update callback
                                            onDelete={handleDeleteConnection} // Pass delete callback
                                        />
                                    );
                                }
                            })}
                        </div>
                     )}
                     {/* --- Pagination Controls --- */}
                     {/* Display pagination only if there's more than one page */}
                     {pages > 1 && (
                         <div className={styles.paginationControls}>
                             {/* Previous Page Button */}
                             <Button onClick={goToPreviousPage} disabled={page <= 1 || loading}>Previous</Button>
                             {/* Page Info Display */}
                             <span className={styles.pageInfo}> Page {page} of {pages} </span>
                             {/* Next Page Button */}
                             <Button onClick={goToNextPage} disabled={page >= pages || loading}>Next</Button>
                         </div>
                     )}
                 </>
            )}
         </div>
    );
};

export default HomePage;

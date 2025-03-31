// client/src/pages/HomePage.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../services/api';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import Input from '../components/Common/Input/Input';
import Button from '../components/Common/Button/Button';
import styles from './HomePage.module.css';

// Helper to check if filter object has any values
const hasActiveFilters = (filters) => {
    if (!filters) return false;
    return Object.values(filters).some(value => value && value.trim() !== '');
};

// Helper to stringify filters for display
const formatActiveFilters = (filters) => {
    if (!filters || !hasActiveFilters(filters)) return '';
    return Object.entries(filters)
        .filter(([, value]) => value && value.trim() !== '')
        .map(([key, value]) => `${key}: "${value}"`)
        .join('; ');
};


const HomePage = () => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    // --- State for Filter Inputs ---
    const [tagInput, setTagInput] = useState('');
    const [movieGenreInput, setMovieGenreInput] = useState('');
    const [directorInput, setDirectorInput] = useState('');
    const [actorInput, setActorInput] = useState('');
    const [bookGenreInput, setBookGenreInput] = useState('');
    const [authorInput, setAuthorInput] = useState('');

    // --- State for Applied Filters ---
    // Use an object to hold all active filters sent to API
    const [activeFilters, setActiveFilters] = useState({});
    const isFilterApplied = useMemo(() => hasActiveFilters(activeFilters), [activeFilters]);

    // Ref to prevent initial fetch trigger from filter state init
    const isInitialMount = useRef(true);

    // --- Fetch Connections Function ---
    const fetchConnections = useCallback(async (currentPage, currentFilters) => {
        console.log(`[HomePage] Fetching connections - Page: ${currentPage}, Filters:`, currentFilters);
        setLoading(true);
        setError(null);
        try {
            // Start with pagination param
            const params = {
                pageNumber: currentPage,
            };
            // Add filter params only if they have a non-empty value
            for (const key in currentFilters) {
                const value = currentFilters[key]?.trim();
                if (value) {
                    params[key] = value;
                }
            }
            console.log('[HomePage] API Request Params:', params);

            const { data } = await api.get('/connections', { params });

            if (data && Array.isArray(data.connections)) {
                 console.log(`[HomePage] Received ${data.connections.length} connections. Total matching pages: ${data.pages}. Filter applied by API: ${data.filterApplied}`);

                setConnections(data.connections);
                setPage(data.page);
                setPages(data.pages);
                // Reflect the actual filters applied by backend (might differ if backend ignores some)
                // setActiveFilters(data.activeFilters || {}); // Optional: sync state with backend response if needed
            } else {
                console.error("[HomePage] Unexpected API response structure:", data);
                setConnections([]); setPage(1); setPages(1);
                setError("Received invalid data from server.");
            }

        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to fetch connections.";
            console.error("[HomePage] Fetch connections error:", err.response || err);
            setError(message);
            setConnections([]); setPage(1); setPages(1);
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies needed as params are passed explicitly

    // --- Effect for Initial Load and Filter/Page Changes ---
     // Use stringified activeFilters as dependency for useEffect
     const activeFiltersString = JSON.stringify(activeFilters);
    useEffect(() => {
        if (isInitialMount.current) {
             isInitialMount.current = false;
             fetchConnections(1, {}); // Initial fetch: page 1, no filters
        } else {
            // Fetch when page or the stringified activeFilters change
            fetchConnections(page, activeFilters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, activeFiltersString, fetchConnections]); // Depend on stringified filters


    // --- Handlers for State Updates (Likes, Deletes) --- Unchanged ---
    const updateConnectionInState = useCallback((updatedConnection) => {
        setConnections(prev => prev.map(c => c._id === updatedConnection._id ? updatedConnection : c));
    }, []);
    const handleDeleteConnection = useCallback((deletedConnectionId) => {
        setConnections(prev => prev.filter(c => c._id !== deletedConnectionId));
        // TODO: Maybe refetch or adjust pagination/count after delete if needed
    }, []);
    // --- END State Update Handlers ---

    // --- Filter Action Handlers ---
    const handleApplyFilter = (e) => {
        e.preventDefault();
        const newFilters = {
            tags: tagInput.trim(),
            movieGenre: movieGenreInput.trim(),
            director: directorInput.trim(),
            actor: actorInput.trim(),
            bookGenre: bookGenreInput.trim(),
            author: authorInput.trim(),
        };
        // Filter out empty values before setting active filters
        const filtersToApply = Object.entries(newFilters)
            .reduce((acc, [key, value]) => {
                if (value) acc[key] = value;
                return acc;
            }, {});

        console.log('[HomePage] Applying Filters:', filtersToApply);
        setActiveFilters(filtersToApply); // Update the active filters
        setPage(1); // Reset to page 1 when applying new filters
        // The useEffect will trigger the fetch
    };

    const handleClearFilter = () => {
        console.log('[HomePage] Clearing all filters.');
        // Clear input fields
        setTagInput('');
        setMovieGenreInput('');
        setDirectorInput('');
        setActorInput('');
        setBookGenreInput('');
        setAuthorInput('');
        // Clear active filters
        setActiveFilters({});
        setPage(1); // Reset to page 1
        // The useEffect will trigger the fetch
    };
    // --- END Filter Action Handlers ---

    // --- Pagination Handlers --- Unchanged ---
    const goToPreviousPage = () => setPage(p => Math.max(1, p - 1));
    const goToNextPage = () => setPage(p => Math.min(pages, p + 1));
    // --- END Pagination Handlers ---

    // Check if the current inputs differ from active filters (for disabling apply button)
    const filtersChanged = useMemo(() => {
         const currentInputFilters = {
            tags: tagInput.trim(), movieGenre: movieGenreInput.trim(),
            director: directorInput.trim(), actor: actorInput.trim(),
            bookGenre: bookGenreInput.trim(), author: authorInput.trim(),
        };
        // Compare stringified versions for simplicity
        return JSON.stringify(activeFilters) !== JSON.stringify(Object.entries(currentInputFilters).reduce((acc, [k, v]) => { if(v) acc[k]=v; return acc; }, {}));
    }, [tagInput, movieGenreInput, directorInput, actorInput, bookGenreInput, authorInput, activeFilters]);


    return (
        <div className={styles.homePageContainer}>
            <h1>MovieBooks Feed</h1>

            {/* --- UPDATED Filter UI --- */}
            <form onSubmit={handleApplyFilter} className={styles.filterForm}>
                <fieldset className={styles.filterFieldset}>
                    <legend>Filter Connections</legend>
                    <div className={styles.filterGrid}> {/* Use grid for layout */}
                        <Input id="tagFilter" label="Tags" placeholder="sci-fi, classic"
                               value={tagInput} onChange={(e) => setTagInput(e.target.value)} disabled={loading} />
                        <Input id="movieGenreFilter" label="Movie Genre" placeholder="Thriller"
                               value={movieGenreInput} onChange={(e) => setMovieGenreInput(e.target.value)} disabled={loading} />
                        <Input id="directorFilter" label="Director" placeholder="Tarantino"
                               value={directorInput} onChange={(e) => setDirectorInput(e.target.value)} disabled={loading} />
                        <Input id="actorFilter" label="Actor" placeholder="Travolta"
                               value={actorInput} onChange={(e) => setActorInput(e.target.value)} disabled={loading} />
                        <Input id="bookGenreFilter" label="Book Genre" placeholder="Adventure"
                               value={bookGenreInput} onChange={(e) => setBookGenreInput(e.target.value)} disabled={loading} />
                        <Input id="authorFilter" label="Author" placeholder="O'Donnell"
                               value={authorInput} onChange={(e) => setAuthorInput(e.target.value)} disabled={loading} />
                    </div>
                    <div className={styles.filterActions}>
                        <Button type="submit" variant="secondary"
                                disabled={loading || !filtersChanged} // Disable if loading or filters haven't changed
                                className={styles.filterButton}>
                            Apply Filters
                        </Button>
                        <Button type="button" variant="outline" onClick={handleClearFilter}
                                disabled={loading || !isFilterApplied} // Disable if loading or no filters applied
                                className={styles.clearFilterButton}>
                            Clear All Filters
                        </Button>
                    </div>
                </fieldset>
            </form>
            {isFilterApplied && (
                <p className={styles.activeFilterInfo}>
                    Filtering by: {formatActiveFilters(activeFilters)}
                </p>
            )}
            {/* --- END Filter UI --- */}


            {/* --- Loading & Error States --- Unchanged --- */}
            {loading && <div className={styles.centered}><LoadingSpinner /></div>}
            {!loading && error && <ErrorMessage message={error} />}
            {/* --- END Loading & Error --- */}


            {/* --- Connection Feed --- Unchanged structure, but receives filtered data --- */}
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

                    {/* --- Pagination Controls --- Unchanged --- */}
                    {pages > 1 && (
                        <div className={styles.paginationControls}>
                            <Button onClick={goToPreviousPage} disabled={page <= 1 || loading}>Previous</Button>
                            <span className={styles.pageInfo}> Page {page} of {pages} </span>
                            <Button onClick={goToNextPage} disabled={page >= pages || loading}>Next</Button>
                        </div>
                    )}
                </>
            )}
             {/* --- END Connection Feed --- */}
        </div>
    );
};

export default HomePage;
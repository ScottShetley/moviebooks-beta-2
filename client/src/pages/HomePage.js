// client/src/pages/HomePage.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import Input from '../components/Common/Input/Input';
import Button from '../components/Common/Button/Button';
import styles from './HomePage.module.css';
import api from '../services/api';

// Helper function for LOCAL filters only
const hasActiveLocalFilters = (filters) => {
    if (!filters) return false;
    // Checks if any value in the local filters object is non-empty
    return Object.values(filters).some(value => value && value.trim() !== '');
};

// Helper function to format LOCAL filters for display
const formatActiveLocalFilters = (filters) => {
    if (!filters || !hasActiveLocalFilters(filters)) return '';
    return Object.entries(filters)
        .filter(([, value]) => value && value.trim() !== '')
        .map(([key, value]) => {
             // Simple capitalization for display key
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `${displayKey}: "${value}"`;
        })
        .join('; ');
};

// *** PROPS CHANGED: Removed isSidebarOpen, toggleSidebar. Added currentFilterTag, clearTagFilter ***
const HomePage = ({ currentFilterTag, clearTagFilter }) => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    // --- Local Filter Input States ---
    const [movieGenreInput, setMovieGenreInput] = useState('');
    const [directorInput, setDirectorInput] = useState('');
    const [actorInput, setActorInput] = useState('');
    const [bookGenreInput, setBookGenreInput] = useState('');
    const [authorInput, setAuthorInput] = useState('');
    // --- Active Local Filters State (tags excluded) ---
    const [activeFilters, setActiveFilters] = useState({});

    // --- NEW: Filter Tab UI State ---
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    // Memoized boolean indicating if any LOCAL filters are currently active
    const isLocalFilterApplied = useMemo(() => hasActiveLocalFilters(activeFilters), [activeFilters]);
    const isInitialMount = useRef(true); // Tracks initial render

    // --- NEW: Toggle filter panel visibility ---
    const toggleFilterPanel = () => {
        setIsFilterExpanded(prev => !prev);
    };

    // --- Fetch Connections Function ---
    const fetchConnections = useCallback(async (currentPage, currentLocalFilters, globalTagFilter) => {
        console.log(`[HomePage] Fetching connections - Page: ${currentPage}, LocalFilters:`, currentLocalFilters, `GlobalTag: ${globalTagFilter}`);
        setLoading(true);
        setError(null);
        try {
            const params = { pageNumber: currentPage };
            // Add local filters from state
            for (const key in currentLocalFilters) {
                const value = currentLocalFilters[key]?.trim();
                if (value) params[key] = value;
            }
            // Add global tag filter from props (if present)
            if (globalTagFilter && globalTagFilter.trim() !== '') {
                params.tags = globalTagFilter.trim(); // Ensure 'tags' matches backend query param
            }

            console.log('[HomePage] API Call Params:', params); // Debug log
            const { data } = await api.get('/connections', { params });

            if (data && Array.isArray(data.connections)) {
                 setConnections(data.connections);
                 setPage(data.page);
                 setPages(data.pages);
            } else {
                console.warn("[HomePage] Received unexpected data structure:", data); // Added warning
                setConnections([]); setPage(1); setPages(1);
                setError("Received invalid data from server.");
            }
        } catch (err) {
            console.error("[HomePage] Fetch Connections Error:", err); // Enhanced log
            const message = err.response?.data?.message || err.message || "Failed to fetch connections.";
            setError(message);
            setConnections([]); setPage(1); setPages(1);
        } finally {
            setLoading(false);
        }
    }, []); // Keep dependency array empty as setters are stable


    // --- Effect for Initial Load and Filter/Page Changes ---
    useEffect(() => {
        // console.log("[HomePage] useEffect triggered. InitialMount:", isInitialMount.current, "Page:", page, "ActiveFilters:", activeFilters, "GlobalTag:", currentFilterTag); // Debug log
        if (isInitialMount.current) {
             isInitialMount.current = false;
             // Fetch initial page using current global tag filter (if any) and empty local filters
             fetchConnections(1, {}, currentFilterTag);
        } else {
             // Fetch based on current page, active local filters, and current global tag filter
             fetchConnections(page, activeFilters, currentFilterTag);
        }
    // *** DEPENDENCIES UPDATED: Added currentFilterTag ***
    }, [page, activeFilters, currentFilterTag, fetchConnections]);


    // --- State Update Handlers (No change needed) ---
    const updateConnectionInState = useCallback((updatedConnection) => {
        setConnections(prev => prev.map(c => c._id === updatedConnection._id ? updatedConnection : c));
    }, []);
    const handleDeleteConnection = useCallback((deletedConnectionId) => {
        setConnections(prev => prev.filter(c => c._id !== deletedConnectionId));
    }, []); // Removed fetchConnections from here to avoid double fetching


    // --- Filter Handlers ---
    const handleApplyFilter = useCallback((e) => {
        if(e) e.preventDefault();
        const newLocalFilters = {
            movieGenre: movieGenreInput.trim(), director: directorInput.trim(),
            actor: actorInput.trim(), bookGenre: bookGenreInput.trim(),
            author: authorInput.trim(),
        };
        const filtersToApply = Object.entries(newLocalFilters)
            .reduce((acc, [key, value]) => { if (value) acc[key] = value; return acc; }, {});

        if(JSON.stringify(activeFilters) !== JSON.stringify(filtersToApply)) {
            setActiveFilters(filtersToApply);
            setPage(1);
        }
        setIsFilterExpanded(false);
    }, [movieGenreInput, directorInput, actorInput, bookGenreInput, authorInput, activeFilters]);

    const handleClearLocalFilter = useCallback(() => {
        setMovieGenreInput(''); setDirectorInput(''); setActorInput('');
        setBookGenreInput(''); setAuthorInput('');
        if(Object.keys(activeFilters).length > 0) {
            setActiveFilters({});
            setPage(1);
        }
    }, [activeFilters]);

    // --- Pagination Handlers (No change needed) ---
    const goToPreviousPage = () => setPage(p => Math.max(1, p - 1));
    const goToNextPage = () => setPage(p => Math.min(pages, p + 1));


    // --- Memo to check if LOCAL filter inputs differ from active local filters ---
     const localFiltersChanged = useMemo(() => {
         const currentInputFilters = {
            movieGenre: movieGenreInput.trim(), director: directorInput.trim(),
            actor: actorInput.trim(), bookGenre: bookGenreInput.trim(),
            author: authorInput.trim(),
        };
        const relevantInputFilters = Object.entries(currentInputFilters)
            .reduce((acc, [k, v]) => { if(v) acc[k]=v; return acc; }, {});
        return JSON.stringify(activeFilters) !== JSON.stringify(relevantInputFilters);
    }, [movieGenreInput, directorInput, actorInput, bookGenreInput, authorInput, activeFilters]);


    // --- Render Logic ---
    return (
         <div className={styles.mainContentArea}>
             <h1>MovieBooks Feed</h1>

             {/* Global Tag Filter Status */}
             {currentFilterTag && (
                 <div className={styles.filterStatus} style={{ marginBottom: '20px', backgroundColor: 'var(--color-accent-subtle)' }}>
                     <span className={styles.activeTagFilter}>
                         Filtering by tag: <strong>#{currentFilterTag}</strong>
                         <button onClick={clearTagFilter} className={styles.clearFilterButton} title="Clear tag filter" style={{ marginLeft: '10px' }} > × </button>
                     </span>
                 </div>
             )}

             {/* Filter Tab UI */}
             <div className={styles.filterTabContainer}>
                <button className={`${styles.filterTab} ${isLocalFilterApplied ? styles.filterTabActive : ''}`} onClick={toggleFilterPanel} aria-expanded={isFilterExpanded} aria-controls="filter-panel" >
                    <span>Filters</span>
                    {isLocalFilterApplied && ( <span className={styles.filterActiveIndicator}></span> )}
                </button>
                {isFilterExpanded && (
                    <div id="filter-panel" className={styles.filterPanel}>
                        <form onSubmit={handleApplyFilter} className={styles.filterForm}>
                            <fieldset className={styles.filterFieldset}>
                                <legend>Filter Connections (Advanced)</legend>
                                <div className={styles.filterGrid}>
                                    <Input id="movieGenreFilter" label="Movie Genre" placeholder="Thriller" value={movieGenreInput} onChange={(e) => setMovieGenreInput(e.target.value)} disabled={loading} />
                                    <Input id="directorFilter" label="Director" placeholder="Tarantino" value={directorInput} onChange={(e) => setDirectorInput(e.target.value)} disabled={loading} />
                                    <Input id="actorFilter" label="Actor" placeholder="Travolta" value={actorInput} onChange={(e) => setActorInput(e.target.value)} disabled={loading} />
                                    <Input id="bookGenreFilter" label="Book Genre" placeholder="Adventure" value={bookGenreInput} onChange={(e) => setBookGenreInput(e.target.value)} disabled={loading} />
                                    <Input id="authorFilter" label="Author" placeholder="O'Donnell" value={authorInput} onChange={(e) => setAuthorInput(e.target.value)} disabled={loading} />
                                </div>
                                <div className={styles.filterActions}>
                                    <Button type="submit" variant="secondary" disabled={loading || !localFiltersChanged} className={styles.filterButton}> Apply Filters </Button>
                                    <Button type="button" variant="outline" onClick={handleClearLocalFilter} disabled={loading || !isLocalFilterApplied} className={styles.clearFilterButton}> Clear Advanced Filters </Button>
                                </div>
                            </fieldset>
                        </form>
                    </div>
                )}
             </div>

             {/* Display active LOCAL filters */}
             {isLocalFilterApplied && ( <p className={styles.activeFilterInfo}> Advanced filters active: {formatActiveLocalFilters(activeFilters)} </p> )}

             {/* Loading/Error/Feed Content Area */}
             {loading && <div className={styles.centered}><LoadingSpinner /></div>}
             {!loading && error && <ErrorMessage message={error} />}

             {!loading && !error && (
                 <>
                     {connections.length === 0 ? (
                        <p className={styles.noResults}> {isLocalFilterApplied || currentFilterTag ? 'No connections found matching your filter(s).' : 'No connections found yet. Be the first to add one!'} </p>
                     ) : (
                        <div className={styles.feedList}>
                            {/* --- ADDED CONSOLE LOG HERE --- */}
                            {console.log("HomePage connections data:", connections)}
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

                     {/* Pagination */}
                     {pages > 1 && (
                         <div className={styles.paginationControls}>
                             <Button onClick={goToPreviousPage} disabled={page <= 1 || loading}>Previous</Button>
                             <span className={styles.pageInfo}> Page {page} of {pages} </span>
                             <Button onClick={goToNextPage} disabled={page >= pages || loading}>Next</Button>
                         </div>
                     )}
                 </>
            )}
         </div>
    );
};

export default HomePage;
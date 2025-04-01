// client/src/pages/HomePage.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import Input from '../components/Common/Input/Input';
import Button from '../components/Common/Button/Button';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './HomePage.module.css';
// Import the api instance HERE if needed by fetchConnections via closure
import api from '../services/api';

const hasActiveFilters = (filters) => {
    if (!filters) return false;
    return Object.values(filters).some(value => value && value.trim() !== '');
};
const formatActiveFilters = (filters) => {
    if (!filters || !hasActiveFilters(filters)) return '';
    return Object.entries(filters)
        .filter(([, value]) => value && value.trim() !== '')
        .map(([key, value]) => `${key}: "${value}"`)
        .join('; ');
};

const HomePage = ({ isSidebarOpen, toggleSidebar }) => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [tagInput, setTagInput] = useState('');
    const [movieGenreInput, setMovieGenreInput] = useState('');
    const [directorInput, setDirectorInput] = useState('');
    const [actorInput, setActorInput] = useState('');
    const [bookGenreInput, setBookGenreInput] = useState('');
    const [authorInput, setAuthorInput] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const isFilterApplied = useMemo(() => hasActiveFilters(activeFilters), [activeFilters]);
    const isInitialMount = useRef(true);
    const location = useLocation();

    useEffect(() => {
        if (isSidebarOpen) {
            toggleSidebar(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]); // Only depends on pathname, toggleSidebar is stable via useCallback([]) in App

     useEffect(() => {
        const body = document.body;
        if (isSidebarOpen) {
            const originalOverflow = body.style.overflow;
            body.style.overflow = 'hidden';
            return () => { body.style.overflow = originalOverflow || ''; };
        }
         return undefined;
    }, [isSidebarOpen]);


    // --- Fetch Connections Function ---
    // Assuming 'api' is stable (imported instance)
    const fetchConnections = useCallback(async (currentPage, currentFilters) => {
        console.log(`[HomePage] Fetching connections - Page: ${currentPage}, Filters:`, currentFilters);
        setLoading(true);
        setError(null);
        try {
            const params = { pageNumber: currentPage };
            for (const key in currentFilters) {
                const value = currentFilters[key]?.trim();
                if (value) params[key] = value;
            }
            const { data } = await api.get('/connections', { params });

            if (data && Array.isArray(data.connections)) {
                 setConnections(data.connections);
                 setPage(data.page);
                 setPages(data.pages);
            } else {
                setConnections([]); setPage(1); setPages(1);
                setError("Received invalid data from server.");
            }
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to fetch connections.";
            setError(message);
            setConnections([]); setPage(1); setPages(1);
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Keep setters out unless rule enforces and causes issues


    // --- Effect for Initial Load and Filter/Page Changes ---
    // const activeFiltersString = JSON.stringify(activeFilters); // Keep if needed elsewhere
    useEffect(() => {
        if (isInitialMount.current) {
             isInitialMount.current = false;
             fetchConnections(1, {}); // Fetch initial page
        } else {
             // Fetch based on current page and filters
             fetchConnections(page, activeFilters);
        }
    // Add activeFilters to dependencies to satisfy eslint rule
    }, [page, activeFilters, fetchConnections]);


    // --- State Update Handlers ---
    const updateConnectionInState = useCallback((updatedConnection) => {
        setConnections(prev => prev.map(c => c._id === updatedConnection._id ? updatedConnection : c));
    }, []);
    const handleDeleteConnection = useCallback((deletedConnectionId) => {
        setConnections(prev => prev.filter(c => c._id !== deletedConnectionId));
        // Optionally refetch current page after delete
        // fetchConnections(page, activeFilters);
    }, []); // Add page, activeFilters, fetchConnections if refetching


    // --- Filter Handlers ---
    const handleApplyFilter = useCallback((e) => {
        if(e) e.preventDefault();
        const newFilters = {
            tags: tagInput.trim(), movieGenre: movieGenreInput.trim(),
            director: directorInput.trim(), actor: actorInput.trim(),
            bookGenre: bookGenreInput.trim(), author: authorInput.trim(),
        };
        const filtersToApply = Object.entries(newFilters)
            .reduce((acc, [key, value]) => { if (value) acc[key] = value; return acc; }, {});

        // Only update if filters actually changed (string compare is safe)
        if(JSON.stringify(activeFilters) !== JSON.stringify(filtersToApply)) {
            setActiveFilters(filtersToApply);
            setPage(1);
        }
    }, [tagInput, movieGenreInput, directorInput, actorInput, bookGenreInput, authorInput, activeFilters]); // Setters not usually needed

    const handleClearFilter = useCallback(() => {
        setTagInput(''); setMovieGenreInput(''); setDirectorInput('');
        setActorInput(''); setBookGenreInput(''); setAuthorInput('');
        if(Object.keys(activeFilters).length > 0) {
            setActiveFilters({});
            setPage(1);
        }
    }, [activeFilters]); // Setters not usually needed

    const handleTagFilterClick = useCallback((tag) => {
        setMovieGenreInput(''); setDirectorInput(''); setActorInput('');
        setBookGenreInput(''); setAuthorInput('');
        setTagInput(tag);
        const newFilters = { tags: tag };
        if (JSON.stringify(activeFilters) !== JSON.stringify(newFilters)) {
             setActiveFilters(newFilters);
             setPage(1);
        }
        toggleSidebar(false);
    }, [activeFilters, toggleSidebar]); // Setters not usually needed


    // --- Pagination Handlers ---
    const goToPreviousPage = () => setPage(p => Math.max(1, p - 1));
    const goToNextPage = () => setPage(p => Math.min(pages, p + 1));


    // --- Filters Changed Memo ---
     const filtersChanged = useMemo(() => {
         const currentInputFilters = {
            tags: tagInput.trim(), movieGenre: movieGenreInput.trim(),
            director: directorInput.trim(), actor: actorInput.trim(),
            bookGenre: bookGenreInput.trim(), author: authorInput.trim(),
        };
        const relevantInputFilters = Object.entries(currentInputFilters)
            .reduce((acc, [k, v]) => { if(v) acc[k]=v; return acc; }, {});
        return JSON.stringify(activeFilters) !== JSON.stringify(relevantInputFilters);
    }, [tagInput, movieGenreInput, directorInput, actorInput, bookGenreInput, authorInput, activeFilters]);


    return (
         <>
             {isSidebarOpen && <div className={styles.sidebarOverlay} onClick={() => toggleSidebar(false)}></div>}
             <div className={styles.homePageLayoutContainer}>
                 <Sidebar
                    onTagClick={handleTagFilterClick}
                    currentFilterTag={activeFilters.tags || ''}
                    isOpen={isSidebarOpen}
                    closeSidebar={() => toggleSidebar(false)}
                 />
                 <div className={styles.mainContentArea}>
                     <h1>MovieBooks Feed</h1>
                     {/* Filters */}
                     <form onSubmit={handleApplyFilter} className={styles.filterForm}>
                         <fieldset className={styles.filterFieldset}>
                             <legend>Filter Connections</legend>
                             <div className={styles.filterGrid}>
                                 <Input id="tagFilter" label="Tags (comma-sep)" placeholder="sci-fi, classic" value={tagInput} onChange={(e) => setTagInput(e.target.value)} disabled={loading} />
                                 <Input id="movieGenreFilter" label="Movie Genre" placeholder="Thriller" value={movieGenreInput} onChange={(e) => setMovieGenreInput(e.target.value)} disabled={loading} />
                                 <Input id="directorFilter" label="Director" placeholder="Tarantino" value={directorInput} onChange={(e) => setDirectorInput(e.target.value)} disabled={loading} />
                                 <Input id="actorFilter" label="Actor" placeholder="Travolta" value={actorInput} onChange={(e) => setActorInput(e.target.value)} disabled={loading} />
                                 <Input id="bookGenreFilter" label="Book Genre" placeholder="Adventure" value={bookGenreInput} onChange={(e) => setBookGenreInput(e.target.value)} disabled={loading} />
                                 <Input id="authorFilter" label="Author" placeholder="O'Donnell" value={authorInput} onChange={(e) => setAuthorInput(e.target.value)} disabled={loading} />
                             </div>
                             <div className={styles.filterActions}>
                                 <Button type="submit" variant="secondary" disabled={loading || !filtersChanged} className={styles.filterButton}> Apply Filters </Button>
                                 <Button type="button" variant="outline" onClick={handleClearFilter} disabled={loading || !isFilterApplied} className={styles.clearFilterButton}> Clear All Filters </Button>
                             </div>
                         </fieldset>
                     </form>
                     {isFilterApplied && ( <p className={styles.activeFilterInfo}> Filtering by: {formatActiveFilters(activeFilters)} </p> )}
                     {/* Loading/Error */}
                     {loading && <div className={styles.centered}><LoadingSpinner /></div>}
                     {!loading && error && <ErrorMessage message={error} />}
                     {/* Feed/Pagination */}
                     {!loading && !error && (
                         <>
                             {connections.length === 0 ? ( <p className={styles.noResults}> {isFilterApplied ? 'No connections found matching your filter.' : 'No connections found yet. Be the first to add one!'} </p> ) : ( <div className={styles.feedList}> {connections.map((connection) => ( <ConnectionCard key={connection._id} connection={connection} onUpdate={updateConnectionInState} onDelete={handleDeleteConnection} /> ))} </div> )}
                             {pages > 1 && ( <div className={styles.paginationControls}> <Button onClick={goToPreviousPage} disabled={page <= 1 || loading}>Previous</Button> <span className={styles.pageInfo}> Page {page} of {pages} </span> <Button onClick={goToNextPage} disabled={page >= pages || loading}>Next</Button> </div> )}
                         </>
                    )}
                 </div>
             </div>
         </>
    );
};

export default HomePage;
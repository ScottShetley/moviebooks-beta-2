// client/src/pages/SearchPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchConnections } from '../services/api'; // Import the new API function
import ConnectionCard from '../components/Connection/ConnectionCard/ConnectionCard'; // Reuse the card component
import styles from './SearchPage.module.css'; // Import the CSS module

const SearchPage = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0); // To show total results count

    const location = useLocation();
    const navigate = useNavigate();

    // Get the search query and page number from the URL
    const queryParams = new URLSearchParams(location.search);
    const searchTerm = queryParams.get('q') || '';
    const pageNumberFromUrl = parseInt(queryParams.get('page'), 10) || 1;

    // Fetch results whenever the search term or page number changes in the URL
    useEffect(() => {
        // Only fetch if there's a search term
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            setCurrentPage(1);
            setTotalPages(1);
            setTotalCount(0);
            setLoading(false);
            setError(null);
            return;
        }

        // Reset state and set loading
        setLoading(true);
        setError(null);
        // Ensure currentPage state matches URL pageNumberFromUrl
        // This is important if the user navigates directly via URL or uses browser back/forward
        if (currentPage !== pageNumberFromUrl) {
           setCurrentPage(pageNumberFromUrl);
        }

        const fetchResults = async () => {
            try {
                // Use the searchConnections API function
                const response = await searchConnections(searchTerm, pageNumberFromUrl); // Use page from URL
                const { connections, page, pages, totalCount } = response.data;

                setSearchResults(connections);
                setCurrentPage(page);
                setTotalPages(pages);
                setTotalCount(totalCount);

            } catch (err) {
                console.error("Error fetching search results:", err);
                setError("Failed to fetch search results. Please try again.");
                setSearchResults([]); // Clear previous results on error
                setTotalPages(1);
                setTotalCount(0);

            } finally {
                setLoading(false);
            }
        };

        fetchResults();

    }, [searchTerm, pageNumberFromUrl, currentPage]); // Depend on searchTerm and pageNumberFromUrl

    // Handler for changing page
    const handlePageChange = useCallback((newPage) => {
         // Ensure newPage is within bounds
         if (newPage >= 1 && newPage <= totalPages) {
             // Update URL with the new page number
             navigate({
                 pathname: '/search',
                 search: `?q=${searchTerm}&page=${newPage}`
             });
             // The useEffect hook will detect the URL change and refetch
         }
    }, [navigate, searchTerm, totalPages]);


    return (
        <div className={styles.searchPageContainer}>
            <h1 className={styles.searchTitle}>Search Results</h1>

            {searchTerm && (
                <p className={styles.searchTermDisplay}>
                    Results for "<strong>{searchTerm}</strong>" ({totalCount} {totalCount === 1 ? 'result' : 'results'})
                </p>
            )}

            {/* Display messages */}
            {loading && <p>Loading search results...</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}

            {/* Render results or no results message */}
            {!loading && !error && searchTerm && searchResults.length === 0 && totalCount === 0 && (
                <p>No connections found matching your search.</p>
            )}
             {!loading && !error && !searchTerm && (
                <p>Enter a search term in the header to find connections.</p>
            )}

            {!loading && !error && searchResults.length > 0 && (
                 <div className={styles.resultsList}>
                    {searchResults.map(connection => (
                        // Reuse ConnectionCard - it expects a 'connection' object
                        <ConnectionCard key={connection._id} connection={connection} />
                    ))}
                </div>
            )}


            {/* Pagination Controls */}
            {!loading && !error && totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={styles.paginationButton}
                    >
                        Previous
                    </button>
                    <span>
                         Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                         className={styles.paginationButton}
                    >
                        Next
                    </button>
                </div>
            )}

        </div>
    );
};

export default SearchPage;
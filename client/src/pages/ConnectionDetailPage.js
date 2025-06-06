// client/src/pages/ConnectionDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getConnectionById, getCommentsForConnection, createComment, getStaticFileUrl } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import Tag from '../components/Common/Tag/Tag';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import CommentItem from '../components/comments/CommentItem/CommentItem';
import styles from './ConnectionDetailPage.module.css';

function ConnectionDetailPage() {
    const { connectionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAuth(); // Get 'user' from useAuth

    // State for connection details
    const [connection, setConnection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for comments
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState(null);
    const [newCommentText, setNewCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [commentSubmissionError, setCommentSubmissionError] = useState(null);

    const siteBaseUrl = window.location.origin;

    // Effect to fetch connection details
    const fetchConnection = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getConnectionById(connectionId);
            setConnection(response.data);
        } catch (err) {
            console.error("ConnectionDetailPage: Error fetching connection:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch connection details.';
            setError(errorMsg);
            if (err.response?.status === 404) {
                setError(`Connection with ID ${connectionId} not found.`);
            }
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    useEffect(() => {
         fetchConnection();
    }, [fetchConnection]);

    // Effect to fetch comments after connection data is loaded
    useEffect(() => {
        if (connectionId) {
            const fetchComments = async () => {
                try {
                    setCommentsLoading(true);
                    setCommentsError(null);
                    const response = await getCommentsForConnection(connectionId);
                    setComments(response.data);
                    console.log('ConnectionDetailPage: Fetched and set comments:', response.data);
                } catch (err) {
                    console.error("ConnectionDetailPage: Error fetching comments:", err);
                    const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch comments.';
                    setCommentsError(errorMsg);
                } finally {
                    setCommentsLoading(false);
                }
            };
            fetchComments();
        }
    }, [connectionId]);

    // Effect: Scroll to comments if URL hash is #comments
    useEffect(() => {
        if (connection && !loading && location.hash === '#comments') {
            const commentsSection = document.getElementById('comments');
            if (commentsSection) {
                setTimeout(() => {
                     commentsSection.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [connection, loading, location.hash]);

    // Handler for new comment input change
    const handleNewCommentChange = (e) => {
        setNewCommentText(e.target.value);
    };

    // Handler for submitting a new comment
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) {
            setCommentSubmissionError('Comment cannot be empty.');
            return;
        }
        if (!isAuthenticated) {
             setCommentSubmissionError('You must be logged in to post a comment.');
             return;
        }
        setIsSubmittingComment(true);
        setCommentSubmissionError(null);
        try {
            await createComment(connectionId, newCommentText);
            setNewCommentText('');
            const updatedCommentsResponse = await getCommentsForConnection(connectionId);
            console.log('ConnectionDetailPage: Re-fetched and set comments after submission:', updatedCommentsResponse.data);
            setComments(updatedCommentsResponse.data);
        } catch (err) {
            console.error("Error submitting comment:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to submit comment.';
            setCommentSubmissionError(errorMsg);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // Handler for when a comment is updated by CommentItem
    const handleCommentUpdated = useCallback((updatedComment) => {
        console.log('[ConnectionDetailPage] Handling comment update:', updatedComment);
        setComments(prevComments =>
            prevComments.map(comment =>
                comment._id === updatedComment._id ? updatedComment : comment
            )
        );
    }, []);

    // Handler for when a comment is deleted by CommentItem
    const handleCommentDeleted = useCallback((deletedCommentId) => {
        console.log('[ConnectionDetailPage] Handling comment deletion for ID:', deletedCommentId);
        setComments(prevComments =>
            prevComments.filter(comment => comment._id !== deletedCommentId)
        );
    }, []);

    // --- Loading State ---
    if (loading) {
        return (
            <>
                <Helmet>
                    {/* Updated to Movie-Books */}
                    <title>Loading Connection... | Movie-Books</title>
                </Helmet>
                <div className={styles.pageContainer}><LoadingSpinner /></div>
            </>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <>
                <Helmet>
                     {/* Updated to Movie-Books */}
                    <title>Error | Movie-Books</title>
                </Helmet>
                <div className={styles.pageContainer}>
                    <ErrorMessage message={error} />
                    <button onClick={() => navigate('/')} className={styles.backButton}>Go Home</button>
                </div>
            </>
        );
    }

    // --- No Connection Data State ---
    if (!connection) {
        return (
            <>
                 <Helmet>
                     {/* Updated to Movie-Books */}
                    <title>Connection Not Found | Movie-Books</title>
                </Helmet>
                <div className={styles.pageContainer}>
                    <ErrorMessage message="Connection data could not be loaded." />
                    <button onClick={() => navigate('/')} className={styles.backButton}>Go Home</button>
                </div>
            </>
        );
    }

    // --- Success State - Prepare Meta Data ---
    const { movieRef, bookRef, context: connectionContext, screenshotUrl } = connection;

    // Updated to Movie-Books in title and description
    const pageTitle = `Connection: ${movieRef?.title || 'Unknown Movie'} & ${bookRef?.title || 'Unknown Book'} | Movie-Books`;
    const metaDescription = connectionContext
        ? `${connectionContext.substring(0, 155)}${connectionContext.length > 155 ? '...' : ''}`
        : `Explore the connection between ${movieRef?.title || 'a movie'} and ${bookRef?.title || 'a book'} on Movie-Books.`;
    const metaImageUrl = getStaticFileUrl(movieRef?.posterPath) || getStaticFileUrl(bookRef?.coverPath) || getStaticFileUrl(screenshotUrl) || `${siteBaseUrl}/logo512.png`; // Assuming logo512.png is your preferred fallback
    const canonicalUrl = `${siteBaseUrl}/connections/${connectionId}`;


    // --- Success State - Render Connection Details ---
    const { tags, userRef, createdAt, context } = connection;

    const moviePosterDisplayUrl = getStaticFileUrl(movieRef?.posterPath);
    const bookCoverDisplayUrl = getStaticFileUrl(bookRef?.coverPath);
    const screenshotDisplayUrl = getStaticFileUrl(screenshotUrl);

    const isAuthor = isAuthenticated && user && connection?.userRef?._id === user._id;

    return (
        <>
            {/* --- START: Helmet for Meta Tags --- */}
            <Helmet>
                <title>{pageTitle}</title>
                <link rel="canonical" href={canonicalUrl} />
                <meta name="description" content={metaDescription} />
                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:image" content={metaImageUrl} />
                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content={canonicalUrl} />
                <meta property="twitter:title" content={pageTitle} />
                <meta property="twitter:description" content={metaDescription} />
                <meta property="twitter:image" content={metaImageUrl} />
            </Helmet>
            {/* --- END: Helmet for Meta Tags --- */}

            <div className={styles.pageContainer}>
                <div className={styles.connectionHeader}>
                    <h1 className={styles.title}>Connection Details</h1>
                    {isAuthor && (
                         <Link to={`/connections/${connectionId}/edit`} className={styles.editButton}>
                            Edit Connection
                         </Link>
                    )}
                    <p className={styles.meta}>
                        Created by <Link to={`/users/${userRef?._id}`}>{userRef?.username || 'Unknown User'}</Link> on {new Date(createdAt).toLocaleDateString()}
                    </p>
                </div>

                <div className={styles.contentGrid}>
                    {/* Movie Section */}
                    <div className={styles.movieSection}>
                        <h2 className={styles.sectionTitle}>Movie</h2>
                        {movieRef ? (
                             <>
                                {moviePosterDisplayUrl && (
                                    <img
                                        src={moviePosterDisplayUrl}
                                        alt={`${movieRef.title} poster`}
                                        className={styles.image}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <Link to={`/movies/${movieRef._id}`} className={styles.itemTitleLink}>
                                    <h3>{movieRef.title} {movieRef.year ? `(${movieRef.year})` : ''}</h3>
                                </Link>
                                {movieRef.director && <p><strong>Director:</strong> {movieRef.director}</p>}
                                {movieRef.genres?.length > 0 && <p><strong>Genres:</strong> {movieRef.genres.join(', ')}</p>}
                                {movieRef.actors?.length > 0 && <p><strong>Actors:</strong> {movieRef.actors.join(', ')}</p>}
                                {movieRef.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {movieRef.synopsis}</p>}
                            </>
                        ) : (
                            <p>Movie details not available.</p>
                        )}
                    </div>

                    {/* Book Section */}
                    <div className={styles.bookSection}>
                        <h2 className={styles.sectionTitle}>Book</h2>
                        {bookRef ? (
                             <>
                                {bookCoverDisplayUrl && (
                                    <img
                                        src={bookCoverDisplayUrl}
                                        alt={`${bookRef.title} cover`}
                                        className={styles.image}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <Link to={`/books/${bookRef._id}`} className={styles.itemTitleLink}>
                                    <h3>{bookRef.title}</h3>
                                </Link>
                                {bookRef.author && <p><strong>Author:</strong> {bookRef.author}</p>}
                                {bookRef.publicationYear && <p><strong>Published:</strong> {bookRef.publicationYear}</p>}
                                {bookRef.genres?.length > 0 && <p><strong>Genres:</strong> {bookRef.genres.join(', ')}</p>}
                                {bookRef.isbn && <p><strong>ISBN:</strong> {bookRef.isbn}</p>}
                                {bookRef.synopsis && <p className={styles.synopsis}><strong>Synopsis:</strong> {bookRef.synopsis}</p>}
                            </>
                        ) : (
                            <p>Book details not available.</p>
                        )}
                    </div>

                    {/* Context & Screenshot Section */}
                    <div className={styles.contextSection}>
                        <h2 className={styles.sectionTitle}>Context</h2>
                        <p className={styles.contextText}>{context || 'No context provided.'}</p>
                        {screenshotDisplayUrl && (
                            <>
                                <h3 className={styles.screenshotTitle}>Screenshot</h3>
                                <img
                                    src={screenshotDisplayUrl}
                                    alt="Connection screenshot"
                                    className={`${styles.image} ${styles.screenshotImage}`}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </>
                        )}
                    </div>

                    {/* Tags Section */}
                    {tags?.length > 0 && (
                        <div className={styles.tagsSection}>
                            <h2 className={styles.sectionTitle}>Tags</h2>
                            <div className={styles.tagsContainer}>
                                {tags.map(tag => (
                                    <Link key={tag} to={`/?tags=${encodeURIComponent(tag)}`} className={styles.tagLink}>
                                        <Tag tag={tag} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- START: Comments Section --- */}
                <div className={styles.commentsSection} id="comments">
                    <h2 className={styles.sectionTitle}>Discussion ({comments.length})</h2>
                    {isAuthenticated ? (
                        <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
                            <textarea
                                value={newCommentText}
                                onChange={handleNewCommentChange}
                                placeholder="Add your comment..."
                                rows="4"
                                disabled={isSubmittingComment}
                            />
                            {commentSubmissionError && <ErrorMessage message={commentSubmissionError} />}
                            <button type="submit" disabled={!newCommentText.trim() || isSubmittingComment}>
                                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                            </button>
                        </form>
                    ) : (
                        <p>Please <Link to="/login" state={{ from: window.location.pathname }}>log in</Link> to post a comment.</p>
                    )}
                    <div className={styles.commentList}>
                        {commentsLoading && <LoadingSpinner />}
                        {commentsError && <ErrorMessage message={commentsError} />}
                        {!commentsLoading && !commentsError && comments.length === 0 && (
                            <p>No comments yet. Be the first to share your thoughts!</p>
                        )}
                        {!commentsLoading && !commentsError && comments.length > 0 && (
                            comments.map(comment => (
                                <CommentItem
                                    key={comment._id}
                                    comment={comment}
                                    onCommentUpdated={handleCommentUpdated}
                                    onCommentDeleted={handleCommentDeleted}
                                />
                            ))
                        )}
                    </div>
                </div>
                {/* --- END: Comments Section --- */}

                <div className={styles.backLinkContainer}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>Go Back</button>
                </div>
            </div>
        </>
    );
}

export default ConnectionDetailPage;
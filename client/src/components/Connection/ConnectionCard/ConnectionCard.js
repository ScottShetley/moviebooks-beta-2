// client/src/components/Connection/ConnectionCard/ConnectionCard.js
// Removed useCallback from the import below
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Removed useNavigate
import { useAuth } from '../../../contexts/AuthContext';
// Removed getCommentsForConnection as it's not used in this component anymore
import api, { getStaticFileUrl } from '../../../services/api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
// Removed CommentList and AddCommentForm as they are not used inline here anymore
import LikeButton from '../../Common/LikeButton/LikeButton';
import styles from './ConnectionCard.module.css';
import {
    FaStar, FaRegStar, FaTrashAlt, FaShareAlt, // Removed FaRegCommentDots
    FaTwitter, FaFacebook, FaLink, FaTimes,
    FaLinkedin, FaRedditAlien, FaPinterest, FaWhatsapp,
    FaChevronDown, FaChevronUp
} from 'react-icons/fa';
// --- Import official Font Awesome React component and the specific icon ---
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons'; // Import the book-open icon object
// --- END Font Awesome Imports ---


const ConnectionCard = ({ connection, onUpdate, onDelete }) => {
    // Removed const navigate = useNavigate();
    const { user, updateUserFavorites } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    // Removed states related to inline comments: comments, isLoadingComments, commentError, showComments, commentsFetched
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy Link');
    const shareButtonRef = useRef(null);
    const shareOptionsRef = useRef(null);

    // Destructure commentCount from connection prop (assuming backend provides it)
    const { commentCount } = connection;


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showShareOptions && shareButtonRef.current && !shareButtonRef.current.contains(event.target) && shareOptionsRef.current && shareOptionsRef.current.contains(event.target)) {
                 // Adjusted logic to correctly check if click is outside both button and popup
                 // It should check if the click IS NOT inside the button AND IS NOT inside the options
                 if (!shareButtonRef.current.contains(event.target) && !shareOptionsRef.current.contains(event.target)) {
                    setShowShareOptions(false);
                 }
            }
        };
        if (showShareOptions) { document.addEventListener('mousedown', handleClickOutside); }
        else { document.removeEventListener('mousedown', handleClickOutside); }
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, [showShareOptions]);

    const handleToggleExpand = () => setIsExpanded(prev => !prev);

    // Removed the handleToggleComments function entirely as it's not used


    // Removed handleCommentAdded function as it's not used with inline comments removed


    const handleFavoriteToggle = async () => {
        const currentConnectionId = connection?._id; if (!user || isFavoriting || !currentConnectionId) return;
        setIsFavoriting(true); setLocalError(null);
        try { const { data: updatedConnection } = await api.post(`/connections/${currentConnectionId}/favorite`); if (typeof updateUserFavorites === 'function') { updateUserFavorites(currentConnectionId); } else { console.warn("updateUserFavorites function not available from AuthContext"); } if (onUpdate) { onUpdate(updatedConnection); } }
        catch (err) { console.error(`[%s - %s] Favorite toggle error:`, 'ConnectionCard', currentConnectionId, err); setLocalError("Failed to update favorite status."); }
        finally { setIsFavoriting(false); }
    };

    const handleDelete = async () => {
        const currentConnectionId = connection?._id; console.log('[handleDelete] Clicked. isOwner:', isOwner, 'isDeleting:', isDeleting, 'ID:', currentConnectionId); if (!isOwner || isDeleting || !currentConnectionId) { console.log('[handleDelete] Aborting - Pre-condition failed.'); return; } if (!window.confirm('Are you sure you want to delete this connection?')) { console.log('[handleDelete] Aborting - User cancelled confirm dialog.'); return; }
        setIsDeleting(true); setLocalError(null);
        try { console.log('[handleDelete] Sending DELETE request for ID:', currentConnectionId); await api.delete(`/connections/${currentConnectionId}`); console.log('[handleDelete] API call successful.'); if (user?.favorites?.includes(currentConnectionId)) { if (typeof updateUserFavorites === 'function') { updateUserFavorites(currentConnectionId); } else { console.warn("updateUserFavorites function not available from AuthContext for delete cleanup"); } } if (onDelete) { console.log('[handleDelete] Calling parent onDelete prop.'); onDelete(currentConnectionId); } else { console.warn('[handleDelete] onDelete prop is missing!'); } }
        catch (err) { const msg = err.response?.data?.message || err.message || "Failed to delete connection."; console.error(`[%s - %s] Error:`, 'ConnectionCard', currentConnectionId, err); setLocalError(msg); setIsDeleting(false); }
    };

    const baseUrl = window.location.origin;
    // The connectionUrl now includes the #comments fragment for sharing/copying
    const connectionUrl = `${baseUrl}/connections/${connection._id}#comments`;
    // Adjusted shareTitle to be more robust
    const shareTitle = `MovieBooks Connection: ${connection.movieRef?.title || 'A Movie'} & ${connection.bookRef?.title || 'A Book'}`;
    const shareDescription = connection.context?.trim() ?
        `Check out this MovieBooks connection: "${connection.context.substring(0, 100)}${connection.context.length > 100 ? '...' : ''}"` :
        `Check out this MovieBooks connection featuring ${connection.movieRef?.title || 'a movie'} and ${connection.bookRef?.title || 'a book'}.`;

    const handleShareToggle = () => { setShowShareOptions(prev => !prev); setCopyStatus('Copy Link'); };
    const handleCopyToClipboard = async () => { try { await navigator.clipboard.writeText(connectionUrl); setCopyStatus('Copied!'); setTimeout(() => setCopyStatus('Copy Link'), 2000); } catch (err) { console.error('Failed to copy link: ', err); setCopyStatus('Failed!'); setTimeout(() => setCopyStatus('Copy Link'), 2000); } };
    const handleShareToX = () => { const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(connectionUrl)}&text=${encodeURIComponent(shareDescription)}`; window.open(xUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToFacebook = () => { const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(connectionUrl)}`; window.open(facebookUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToLinkedIn = () => { const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(connectionUrl)}`; window.open(linkedInUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToReddit = () => { const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(connectionUrl)}&title=${encodeURIComponent(shareTitle)}`; window.open(redditUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToPinterest = () => { const mediaUrl = connection.screenshotUrl ? getStaticFileUrl(connection.screenshotUrl) : `${baseUrl}/MovieBooks-logo.jpg`; const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(connectionUrl)}&media=${encodeURIComponent(mediaUrl)}&description=${encodeURIComponent(shareDescription)}`; window.open(pinterestUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };
    const handleShareToWhatsApp = () => { const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareDescription + ' ' + connectionUrl)}`; window.open(whatsappUrl, '_blank', 'noopener,noreferrer'); setShowShareOptions(false); };


    // Early return for incomplete data
    // Added check for movieRef/bookRef existence before accessing properties
    if (!connection || !connection.userRef || (!connection.userRef.username && !connection.userRef.displayName)) {
         console.error("[ConnectionCard Render] Incomplete base connection data, rendering error.", { connection });
        return <div className={styles.card}>Error: Incomplete connection data for ID {connection?._id}. Check console.</div>;
    }

    const isFavoritedByCurrentUser = !!user && !!user.favorites && !!connection._id && user.favorites.includes(connection._id);
    const isOwner = !!user && user._id === connection.userRef._id;
    const movieTitle = connection.movieRef?.title;
    const bookTitle = connection.bookRef?.title;
    const displayUsername = connection.userRef?.displayName || connection.userRef?.username || 'Unknown User'; // Use displayName if available


    return (
        <article className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}>
            <header className={styles.header}>
                 <h3>
                     {/* Link Title to Detail Page (This link does NOT get the #comments fragment) */}
                     <Link to={`/connections/${connection._id}`} className={styles.titleLink}>
                         {movieTitle && bookTitle ? `${movieTitle} & ${bookTitle}` : (movieTitle || bookTitle || 'Connection')}
                     </Link>
                 </h3>
            </header>

            {/* --- NEW: Container for Avatar and Meta Text --- */}
            <div className={styles.authorInfoContainer}>
                 {/* Avatar */}
                 {/* Add Link around avatar */}
                 {connection.userRef.profileImageUrl && (
                     <Link to={`/users/${connection.userRef._id}`} title={`${displayUsername}'s Profile`} className={styles.avatarLink}>
                         <img
                             src={getStaticFileUrl(connection.userRef.profileImageUrl)}
                             alt={`${displayUsername}'s avatar`}
                             className={styles.avatar}
                             loading="lazy"
                         />
                     </Link>
                 )}
                 {/* Meta text */}
                 <p className={styles.meta}>
                     Added by{' '}
                     <Link to={`/users/${connection.userRef._id}`} className={styles.userLink}>
                         {displayUsername}
                     </Link>
                     {' on '} {new Date(connection.createdAt).toLocaleDateString()}
                 </p>
            </div>
            {/* --- END NEW CONTAINER --- */}


            <div className={styles.contentWrapper}>
                {/* Added onClick to wrapper div for expand toggle */}
                <div onClick={handleToggleExpand} style={{ cursor: 'pointer' }} title={isExpanded ? "Click to collapse" : "Click to expand"}>
                    {connection.screenshotUrl ? (
                        // Link Image to Detail Page (This link does NOT get the #comments fragment)
                        <Link to={`/connections/${connection._id}`} className={styles.imageLink} onClick={(e) => e.stopPropagation()} >
                            <div className={styles.screenshotWrapper}>
                                <img src={getStaticFileUrl(connection.screenshotUrl)} alt={`Scene from ${movieTitle || 'Movie'} featuring ${bookTitle || 'Book'}`} className={styles.screenshot} loading="lazy" />
                            </div>
                        </Link>
                    ) : ( null )}
                </div>
                 {connection.context && (
                     <div onClick={handleToggleExpand} style={{ cursor: 'pointer' }} title={isExpanded ? "Click to collapse" : "Click to expand"}>
                        <p className={styles.context}>{connection.context}</p>
                     </div>
                 )}
                 {(connection.movieRef?.posterPath || connection.bookRef?.coverPath) && (
                     <div className={styles.additionalImagesContainer} onClick={handleToggleExpand} style={{ cursor: 'pointer' }} title={isExpanded ? "Click to collapse" : "Click to expand"}>
                         {connection.movieRef?.posterPath && (
                             // Link Movie Poster to Movie Detail Page
                             <Link to={`/movies/${connection.movieRef._id}`} title={movieTitle} className={styles.additionalImageWrapper} onClick={(e) => e.stopPropagation()}>
                                 <img src={getStaticFileUrl(connection.movieRef.posterPath)} alt={`${movieTitle} Poster`} className={styles.additionalImage} loading="lazy" />
                             </Link>
                         )}
                         {connection.bookRef?.coverPath && (
                             // Link Book Cover to Book Detail Page
                             <Link to={`/books/${connection.bookRef._id}`} title={bookTitle} className={styles.additionalImageWrapper} onClick={(e) => e.stopPropagation()}>
                                 <img src={getStaticFileUrl(connection.bookRef.coverPath)} alt={`${bookTitle} Cover`} className={styles.additionalImage} loading="lazy" />
                             </Link>
                         )}
                     </div>
                 )}
            </div>

            <footer className={styles.actions}>
                {/* Like Button */}
                <LikeButton connectionId={connection._id} initialLikes={connection.likes || []} onLikeUpdate={onUpdate} />

                {/* Favorite Button */}
                <button className={`${styles.actionButton} ${isFavoritedByCurrentUser ? styles.favorited : ''}`} onClick={handleFavoriteToggle} disabled={!user || isFavoriting} title={isFavoritedByCurrentUser ? "Remove from Favorites" : "Add to Favorites"} > {isFavoriting ? <LoadingSpinner size="small" inline /> : (isFavoritedByCurrentUser ? <FaStar /> : <FaRegStar />) } </button>

                 {/* Share Action with Popup */}
                <div className={styles.shareActionWrapper}>
                    <button ref={shareButtonRef} className={`${styles.actionButton} ${styles.shareButton}`} onClick={handleShareToggle} title="Share Connection" > <FaShareAlt /> </button>
                    {showShareOptions && ( <div ref={shareOptionsRef} id={`share-options-${connection._id}`} className={styles.shareOptionsPopup} role="menu" >
                        <button role="menuitem" onClick={handleCopyToClipboard} className={styles.shareOptionButton}> <FaLink className={styles.shareIcon} /> {copyStatus} </button>
                        <button role="menuitem" onClick={handleShareToX} className={styles.shareOptionButton}> <FaTwitter className={styles.shareIcon} /> X </button>
                        <button role="menuitem" onClick={handleShareToFacebook} className={styles.shareOptionButton}> <FaFacebook className={styles.shareIcon} /> Facebook </button>
                        <button role="menuitem" onClick={handleShareToLinkedIn} className={styles.shareOptionButton}> <FaLinkedin className={styles.shareIcon} /> LinkedIn </button>
                        <button role="menuitem" onClick={handleShareToReddit} className={styles.shareOptionButton}> <FaRedditAlien className={styles.shareIcon} /> Reddit </button>
                        <button role="menuitem" onClick={handleShareToPinterest} className={styles.shareOptionButton}> <FaPinterest className={styles.shareIcon} /> Pinterest </button>
                        <button role="menuitem" onClick={handleShareToWhatsApp} className={styles.shareOptionButton}> <FaWhatsapp className={styles.shareIcon} /> WhatsApp </button>
                        <button onClick={() => setShowShareOptions(false)} className={`${styles.shareOptionButton} ${styles.closeShareButton}`} title="Close share options" > <FaTimes /> </button>
                     </div> )}
                </div>

                {/* View Discussion Link */}
                {/* Show if there are comments or if user is logged in (to encourage starting discussion) */}
                {(commentCount > 0 || user) && connection?._id && (
                    <Link
                        to={`/connections/${connection._id}#comments`} // Added #comments fragment here
                        className={`${styles.actionButton} ${styles.viewDiscussionLink}`}
                        title="View full discussion"
                    >
                         {/* Use the official Font Awesome Component with faBookOpen */}
                         <FontAwesomeIcon icon={faBookOpen} />
                         {/* Show count if > 0 */}
                         <span>Discussion{commentCount > 0 ? ` (${commentCount})` : ''}</span>
                    </Link>
                )}


                <div className={styles.endButtonsWrapper}>
                     {/* Expand/Collapse Button */}
                     <button className={`${styles.actionButton} ${styles.expandButton}`} onClick={handleToggleExpand} title={isExpanded ? "Show less" : "Show more"} aria-expanded={isExpanded} > {isExpanded ? <FaChevronUp /> : <FaChevronDown />} <span className={styles.expandText}>{isExpanded ? "Less" : "More"}</span> </button>
                     {/* Delete Button (Owner only) */}
                     {isOwner && ( <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete} disabled={isDeleting} title="Delete Connection" > {isDeleting ? <LoadingSpinner size="small" inline /> : <FaTrashAlt />} </button> )}
                </div>

                 {localError && <span className={styles.actionError}>{localError}</span>}
            </footer>

            {}
        </article>
    );
};

export default ConnectionCard;
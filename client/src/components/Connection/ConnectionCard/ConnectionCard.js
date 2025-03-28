// client/src/components/Connection/ConnectionCard/ConnectionCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getStaticFileUrl, deleteConnection } from '../../../services/api';
import api from '../../../services/api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import styles from './ConnectionCard.module.css';

const ConnectionCard = ({ connection, onUpdate, onDelete }) => {
  const { user } = useAuth();

  const [isLiking, setIsLiking] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!connection || !connection.movieRef || !connection.bookRef || !connection.userRef) {
     console.error("ConnectionCard received incomplete data:", connection);
     return <div className={styles.card}>Error: Incomplete connection data.</div>;
  }

  const isLikedByCurrentUser = user && connection.likes?.includes(user._id);
  const isFavoritedByCurrentUser = user && connection.favorites?.includes(user._id);
  const isOwner = user && user._id === connection.userRef._id;

  // --- MODIFIED: Get URLs for all three images ---
  const screenshotImageUrl = connection.screenshotUrl ? getStaticFileUrl(connection.screenshotUrl) : null;
  const moviePosterImageUrl = connection.moviePosterUrl ? getStaticFileUrl(connection.moviePosterUrl) : null;
  const bookCoverImageUrl = connection.bookCoverUrl ? getStaticFileUrl(connection.bookCoverUrl) : null;
  // --- END MODIFICATION ---

  // --- Handlers (like, favorite, delete - remain unchanged) ---
  const handleLikeToggle = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    setLocalError(null);
    try {
      const { data: updatedConnection } = await api.post(`/connections/${connection._id}/like`);
      if (onUpdate) {
        onUpdate(updatedConnection);
      }
    } catch (err) {
      console.error("Like toggle error:", err);
      setLocalError("Failed to update like status.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user || isFavoriting) return;
    setIsFavoriting(true);
    setLocalError(null);
    try {
      const { data: updatedConnection } = await api.post(`/connections/${connection._id}/favorite`);
      if (onUpdate) {
        onUpdate(updatedConnection);
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
      setLocalError("Failed to update favorite status.");
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner || isDeleting) return;
    if (!window.confirm('Are you sure you want to delete this connection? This cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    setLocalError(null);
    try {
      await deleteConnection(connection._id);
      if (onDelete) {
        onDelete(connection._id);
      }
    } catch (err) {
      console.error("Delete connection error:", err);
      setLocalError("Failed to delete connection.");
      setIsDeleting(false);
    }
  };
  // --- End Handlers ---

  return (
    <article className={styles.card}>
      {/* Header (Movie & Book Titles) */}
      <header className={styles.header}>
        <h3>
          <Link to={`/movies/${connection.movieRef._id}`}>{connection.movieRef.title}</Link>
          {' & '}
          <Link to={`/books/${connection.bookRef._id}`}>{connection.bookRef.title}</Link>
        </h3>
      </header>

      {/* Meta Information (Author, Date) */}
      <p className={styles.meta}>
        Added by{' '}
        <Link to={`/users/${connection.userRef._id}`}>{connection.userRef.email}</Link>
        {' on '}
        {new Date(connection.createdAt).toLocaleDateString()}
      </p>

      {/* Screenshot Image (Main Image) */}
      {screenshotImageUrl ? (
          <img
              src={screenshotImageUrl}
              alt={`Scene from ${connection.movieRef.title} featuring book ${connection.bookRef.title}`}
              className={styles.screenshot}
              loading="lazy"
          />
      ) : (
           <div className={styles.noScreenshotPlaceholder}></div>
      )}

      {/* Context Text */}
      {connection.context && (
        <p className={styles.context}>{connection.context}</p>
      )}

      {/* --- NEW: Section for Movie Poster and Book Cover --- */}
      {(moviePosterImageUrl || bookCoverImageUrl) && ( // Only render container if at least one exists
        <div className={styles.additionalImagesContainer}>
          {moviePosterImageUrl && (
            <img
              src={moviePosterImageUrl}
              alt={`Movie Poster for ${connection.movieRef.title}`}
              className={styles.additionalImage}
              loading="lazy"
            />
          )}
          {bookCoverImageUrl && (
            <img
              src={bookCoverImageUrl}
              alt={`Book Cover for ${connection.bookRef.title}`}
              className={styles.additionalImage}
              loading="lazy"
            />
          )}
        </div>
      )}
      {/* --- END NEW SECTION --- */}


      {/* Action Buttons Footer */}
      <footer className={styles.actions}>
          {/* Like Button */}
          <button
            className={`${styles.actionButton} ${isLikedByCurrentUser ? styles.liked : ''}`}
            onClick={handleLikeToggle}
            disabled={!user || isLiking}
            title={isLikedByCurrentUser ? "Unlike" : "Like"}
          >
            {isLiking ? <LoadingSpinner size="small" inline /> : '👍'}
            <span className={styles.count}>{connection.likes?.length || 0}</span>
          </button>

          {/* Favorite Button */}
          <button
              className={`${styles.actionButton} ${isFavoritedByCurrentUser ? styles.favorited : ''}`}
              onClick={handleFavoriteToggle}
              disabled={!user || isFavoriting}
              title={isFavoritedByCurrentUser ? "Remove from Favorites" : "Add to Favorites"}
          >
            {isFavoriting ? <LoadingSpinner size="small" inline /> : '⭐'}
            <span className={styles.count}>{connection.favorites?.length || 0}</span>
          </button>

          {/* Delete Button (Conditionally Rendered) */}
          {isOwner && (
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete Connection"
            >
              {isDeleting ? <LoadingSpinner size="small" inline /> : '🗑️'}
            </button>
          )}

          {/* Local Error Display */}
          {localError && <span className={styles.actionError}>{localError}</span>}
      </footer>
    </article>
  );
};

export default ConnectionCard;
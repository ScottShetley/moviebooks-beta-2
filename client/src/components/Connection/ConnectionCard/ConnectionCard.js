// client/src/components/Connection/ConnectionCard/ConnectionCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
// No need for getStaticFileUrl, keep deleteConnection if used elsewhere or remove if only used here via api instance
import { deleteConnection } from '../../../services/api';
import api from '../../../services/api';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import styles from './ConnectionCard.module.css';

const ConnectionCard = ({ connection, onUpdate, onDelete }) => {
  const { user } = useAuth();

  const [isLiking, setIsLiking] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- MODIFICATION START: Check for username in userRef ---
  if (!connection || !connection.movieRef || !connection.bookRef || !connection.userRef || !connection.userRef.username) {
     // Added check for username property existence
     console.error("ConnectionCard received incomplete data (missing refs or username):", connection);
     return <div className={styles.card}>Error: Incomplete connection data.</div>;
  }
  // --- MODIFICATION END ---

  const isLikedByCurrentUser = user && connection.likes?.includes(user._id);
  const isFavoritedByCurrentUser = user && connection.favorites?.includes(user._id);
  const isOwner = user && user._id === connection.userRef._id;


  // --- Handlers (like, favorite, delete - remain unchanged) ---
  const handleLikeToggle = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    setLocalError(null);
    try {
      const { data: updatedConnection } = await api.post(`/connections/${connection._id}/like`);
      if (onUpdate) {
        onUpdate(updatedConnection); // Backend now sends back userRef with username
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
        onUpdate(updatedConnection); // Backend now sends back userRef with username
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
      // Using the imported service function directly (assuming it uses the api instance)
      // OR call api.delete directly: await api.delete(`/connections/${connection._id}`);
      await api.delete(`/connections/${connection._id}`); // Switched to api instance call for consistency
      if (onDelete) {
        onDelete(connection._id);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to delete connection.";
      console.error("Delete connection error:", err);
      setLocalError(message);
      setIsDeleting(false);
    }
  };
  // --- End Handlers ---

  return (
    <article className={styles.card}>
      {/* Header (Movie & Book Titles) */}
      <header className={styles.header}>
        <h3>
          {/* Ensure movie/book refs also have _id for links */}
          <Link to={`/movies/${connection.movieRef._id}`}>{connection.movieRef.title}</Link>
          {' & '}
          <Link to={`/books/${connection.bookRef._id}`}>{connection.bookRef.title}</Link>
        </h3>
      </header>

      {/* Meta Information (Author, Date) */}
      {/* --- MODIFICATION START: Display username --- */}
      <p className={styles.meta}>
        Added by{' '}
        <Link to={`/profile/${connection.userRef._id}`}>{connection.userRef.username}</Link> {/* <-- USE USERNAME & link to /profile */}
        {' on '}
        {new Date(connection.createdAt).toLocaleDateString()}
      </p>
      {/* --- MODIFICATION END --- */}


      {/* Screenshot (Uses direct Cloudinary URL) */}
      {connection.screenshotUrl ? (
          <img
              src={connection.screenshotUrl}
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

      {/* Additional Images (Poster/Cover - Uses direct Cloudinary URL) */}
      {(connection.moviePosterUrl || connection.bookCoverUrl) && (
        <div className={styles.additionalImagesContainer}>
          {connection.moviePosterUrl && (
            <img src={connection.moviePosterUrl} alt={`Movie Poster`} className={styles.additionalImage} loading="lazy" />
          )}
          {connection.bookCoverUrl && (
            <img src={connection.bookCoverUrl} alt={`Book Cover`} className={styles.additionalImage} loading="lazy" />
          )}
        </div>
      )}


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

          {/* Delete Button */}
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
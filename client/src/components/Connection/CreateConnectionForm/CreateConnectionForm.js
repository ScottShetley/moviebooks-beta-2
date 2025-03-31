// client/src/components/Connection/CreateConnectionForm/CreateConnectionForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api'; // Axios instance
import Input from '../../Common/Input/Input';
import Button from '../../Common/Button/Button';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../Common/ErrorMessage/ErrorMessage';
import styles from './CreateConnectionForm.module.css'; // Import CSS module

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif'];
const ACCEPTED_IMAGE_TYPES_STRING = ACCEPTED_IMAGE_TYPES.join(', ');

const CreateConnectionForm = () => {
  const [movieTitle, setMovieTitle] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [context, setContext] = useState('');
  const [tags, setTags] = useState(''); // <-- NEW: State for tags input

  // --- State for three files and previews ---
  const [moviePoster, setMoviePoster] = useState(null);
  const [moviePosterPreview, setMoviePosterPreview] = useState(null);
  const [bookCover, setBookCover] = useState(null);
  const [bookCoverPreview, setBookCoverPreview] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  // --- END ---

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Generic file handler (Unchanged) ---
  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    const inputElement = e.target; // Keep reference to reset if needed

    // Reset specific file state first
    switch (fileType) {
        case 'moviePoster':
            setMoviePoster(null);
            setMoviePosterPreview(null);
            break;
        case 'bookCover':
            setBookCover(null);
            setBookCoverPreview(null);
            break;
        case 'screenshot':
            setScreenshot(null);
            setScreenshotPreview(null);
            break;
        default:
            console.error("Invalid fileType in handleFileChange");
            return;
    }
    setError(null); // Clear general error on new selection attempt

    if (file) {
      // Validation
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError(`Invalid file type for ${fileType}. Please upload: ${ACCEPTED_IMAGE_TYPES_STRING}.`);
        inputElement.value = null; // Reset file input
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File for ${fileType} is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        inputElement.value = null; // Reset file input
        return;
      }

      // Store file object and create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        switch (fileType) {
            case 'moviePoster':
                setMoviePoster(file);
                setMoviePosterPreview(reader.result);
                break;
            case 'bookCover':
                setBookCover(file);
                setBookCoverPreview(reader.result);
                break;
            case 'screenshot':
                setScreenshot(file);
                setScreenshotPreview(reader.result);
                break;
            default: break; // Should not happen
        }
      };
      reader.readAsDataURL(file);
    }
  };
  // --- END file handler ---

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('movieTitle', movieTitle);
    formData.append('bookTitle', bookTitle);
    formData.append('context', context);
    formData.append('tags', tags); // <-- NEW: Append tags string

    // --- Append all three files if they exist (Unchanged) ---
    if (moviePoster) {
      formData.append('moviePoster', moviePoster);
    }
    if (bookCover) {
      formData.append('bookCover', bookCover);
    }
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }
    // --- END file appending ---

    try {
      // Log the FormData content for debugging (won't show files directly, but text fields)
      console.log('Submitting FormData:');
      for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value); // Value might be [object File] for files
      }

      const { data: newConnection } = await api.post('/connections', formData);
      console.log('Connection created:', newConnection);
      navigate('/'); // Navigate to home/feed on success
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to create connection.";
      console.error("Create connection error:", err.response || err);
      setError(message);
      setLoading(false);
    }
    // setLoading(false); // Typically don't set loading false here if navigating away
  };

  // Helper to render file input section (Unchanged)
  const renderFileInput = (id, label, fileState, previewState, fileType) => (
    <div className={styles.fileInputGroup}>
        <label htmlFor={id} className={styles.fileInputLabel}>
          {label} (Optional, Max {MAX_FILE_SIZE_MB}MB)
        </label>
        <input
          type="file"
          id={id}
          name={id}
          className={styles.fileInput}
          accept={ACCEPTED_IMAGE_TYPES_STRING}
          onChange={(e) => handleFileChange(e, fileType)}
          disabled={loading}
        />
        {previewState && (
          <div className={styles.preview}>
            <img src={previewState} alt={`${label} preview`} />
          </div>
        )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Add New MovieBook</h2>

      <ErrorMessage message={error} />

      <Input
        label="Movie Title"
        id="movieTitle"
        value={movieTitle}
        onChange={(e) => setMovieTitle(e.target.value)}
        required
        disabled={loading}
        placeholder="e.g., Pulp Fiction"
      />

      <Input
        label="Book Title"
        id="bookTitle"
        value={bookTitle}
        onChange={(e) => setBookTitle(e.target.value)}
        required
        disabled={loading}
        placeholder="e.g., Modesty Blaise"
      />

      <Input
        label="Context (Optional)"
        id="context"
        type="textarea"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        disabled={loading}
        placeholder="Describe when/where the book appears in the movie..."
        rows={4}
      />

      {/* --- NEW: Tags Input Field --- */}
      <Input
        label="Tags (Optional)"
        id="tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        disabled={loading}
        placeholder="e.g., sci-fi, dystopian, philosophical"
        helperText="Separate tags with commas" // Add helper text if Input supports it, or use a <p> tag below
      />
      {/* --- END: Tags Input Field --- */}


      {/* --- Render three file input sections (Unchanged) --- */}
      {renderFileInput('moviePoster', 'Movie Poster', moviePoster, moviePosterPreview, 'moviePoster')}
      {renderFileInput('bookCover', 'Book Cover', bookCover, bookCoverPreview, 'bookCover')}
      {renderFileInput('screenshot', 'Screenshot', screenshot, screenshotPreview, 'screenshot')}
      {/* --- END file inputs --- */}

      <div className={styles.submitButtonContainer}>
        <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? <LoadingSpinner size="small" inline /> : 'Add Connection'}
        </Button>
      </div>
    </form>
  );
};

export default CreateConnectionForm;
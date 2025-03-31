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
  // --- Core Connection State ---
  const [movieTitle, setMovieTitle] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [context, setContext] = useState('');
  const [tags, setTags] = useState(''); // Comma-separated

  // --- NEW: Movie Details State ---
  const [movieGenres, setMovieGenres] = useState(''); // Comma-separated
  const [movieDirector, setMovieDirector] = useState('');
  const [movieActors, setMovieActors] = useState(''); // Comma-separated

  // --- NEW: Book Details State ---
  const [bookGenres, setBookGenres] = useState(''); // Comma-separated
  const [bookAuthor, setBookAuthor] = useState('');

  // --- File State ---
  const [moviePoster, setMoviePoster] = useState(null);
  const [moviePosterPreview, setMoviePosterPreview] = useState(null);
  const [bookCover, setBookCover] = useState(null);
  const [bookCoverPreview, setBookCoverPreview] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Generic file handler ---
  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    const inputElement = e.target;

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
    setError(null);

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

    // Use FormData as we have file uploads
    const formData = new FormData();

    // Append core connection fields
    formData.append('movieTitle', movieTitle);
    formData.append('bookTitle', bookTitle);
    formData.append('context', context);
    formData.append('tags', tags); // Send as comma-separated string

    // --- NEW: Append movie details ---
    formData.append('movieGenres', movieGenres); // Send as comma-separated string
    formData.append('movieDirector', movieDirector);
    formData.append('movieActors', movieActors); // Send as comma-separated string

    // --- NEW: Append book details ---
    formData.append('bookGenres', bookGenres); // Send as comma-separated string
    formData.append('bookAuthor', bookAuthor);

    // Append files if they exist
    if (moviePoster) formData.append('moviePoster', moviePoster);
    if (bookCover) formData.append('bookCover', bookCover);
    if (screenshot) formData.append('screenshot', screenshot);

    try {
      console.log('Submitting FormData:');
      for (let [key, value] of formData.entries()) { console.log(`${key}:`, value); }

      const { data: newConnection } = await api.post('/connections', formData);
      console.log('Connection created:', newConnection);
      navigate('/'); // Navigate to home/feed on success
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to create connection.";
      console.error("Create connection error:", err.response || err);
      setError(message);
      setLoading(false);
    }
  };

  // Helper to render file input section
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

      {/* --- Core Connection Fields --- */}
      <Input
        label="Movie Title" id="movieTitle" value={movieTitle}
        onChange={(e) => setMovieTitle(e.target.value)} required disabled={loading}
        placeholder="e.g., Pulp Fiction"
      />
      <Input
        label="Book Title" id="bookTitle" value={bookTitle}
        onChange={(e) => setBookTitle(e.target.value)} required disabled={loading}
        placeholder="e.g., Modesty Blaise"
      />
       <Input
        label="Context (Optional)" id="context" type="textarea" value={context}
        onChange={(e) => setContext(e.target.value)} disabled={loading}
        placeholder="Describe when/where the book appears in the movie..." rows={4}
      />
      <Input
        label="Tags (Optional)" id="tags" value={tags}
        onChange={(e) => setTags(e.target.value)} disabled={loading}
        placeholder="e.g., sci-fi, dystopian, philosophical"
        helperText="Separate tags with commas"
      />

      {/* --- Optional Movie Details --- */}
      <fieldset className={styles.fieldGroup}>
          <legend>Optional Movie Details</legend>
          <Input
            label="Movie Genre(s)" id="movieGenres" value={movieGenres}
            onChange={(e) => setMovieGenres(e.target.value)} disabled={loading}
            placeholder="e.g., Sci-Fi, Thriller"
            helperText="Separate multiple genres with commas"
          />
          <Input
            label="Director" id="movieDirector" value={movieDirector}
            onChange={(e) => setMovieDirector(e.target.value)} disabled={loading}
            placeholder="e.g., Quentin Tarantino"
          />
           <Input
            label="Actor(s)" id="movieActors" value={movieActors}
            onChange={(e) => setMovieActors(e.target.value)} disabled={loading}
            placeholder="e.g., John Travolta, Samuel L. Jackson"
            helperText="Separate multiple actors with commas"
          />
      </fieldset>


      {/* --- Optional Book Details --- */}
        <fieldset className={styles.fieldGroup}>
          <legend>Optional Book Details</legend>
           <Input
            label="Book Genre(s)" id="bookGenres" value={bookGenres}
            onChange={(e) => setBookGenres(e.target.value)} disabled={loading}
            placeholder="e.g., Spy fiction, Adventure"
            helperText="Separate multiple genres with commas"
          />
          <Input
            label="Author" id="bookAuthor" value={bookAuthor}
            onChange={(e) => setBookAuthor(e.target.value)} disabled={loading}
            placeholder="e.g., Peter O'Donnell"
          />
      </fieldset>

      {/* --- File Uploads --- */}
      <fieldset className={styles.fieldGroup}>
        <legend>Optional Images</legend>
        {renderFileInput('moviePoster', 'Movie Poster', moviePoster, moviePosterPreview, 'moviePoster')}
        {renderFileInput('bookCover', 'Book Cover', bookCover, bookCoverPreview, 'bookCover')}
        {renderFileInput('screenshot', 'Screenshot', screenshot, screenshotPreview, 'screenshot')}
      </fieldset>

      {/* --- Submit Button --- */}
      <div className={styles.submitButtonContainer}>
        <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? <LoadingSpinner size="small" inline /> : 'Add Connection'}
        </Button>
      </div>
    </form>
  );
};

export default CreateConnectionForm;
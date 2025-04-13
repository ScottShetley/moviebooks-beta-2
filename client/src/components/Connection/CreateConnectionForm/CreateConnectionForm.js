// client/src/components/Connection/CreateConnectionForm/CreateConnectionForm.js
import React, { useState, useCallback } from 'react'; // Added useCallback
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

  // --- Movie Details State ---
  const [movieGenres, setMovieGenres] = useState(''); // Comma-separated
  const [movieDirector, setMovieDirector] = useState('');
  const [movieActors, setMovieActors] = useState(''); // Comma-separated

  // --- Book Details State ---
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

  // --- Helper to clear error when relevant inputs change ---
  const handleInputChange = useCallback((setter) => (e) => {
    setter(e.target.value);
    if (error) { // Clear previous submission error on new input
      setError(null);
    }
  }, [error]); // Dependency: re-create if error state changes


  // --- Generic file handler ---
  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    const inputElement = e.target;

    // Reset specific file state first & clear general errors potentially related to file types
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
    setError(null); // Clear any previous errors (incl. file errors)

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
          default: break;
        }
      };
      reader.readAsDataURL(file);
    }
  };
  // --- END file handler ---

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors before new submission attempt

    // --- *** NEW: Client-side Validation *** ---
    const hasMediaTitles = movieTitle.trim() && bookTitle.trim();
    const hasContext = context.trim();

    if (!hasMediaTitles && !hasContext) {
      setError('Please provide either BOTH Movie Title and Book Title (for a full connection), OR enter some text in the Context field (for a text-only post).');
      return; // Stop submission
    }
    // --- *** END Validation *** ---

    setLoading(true);

    // Use FormData as we have file uploads
    const formData = new FormData();

    // Append core connection fields
    // Send titles even if empty, backend handles logic
    formData.append('movieTitle', movieTitle.trim());
    formData.append('bookTitle', bookTitle.trim());
    formData.append('context', context.trim());
    formData.append('tags', tags); // Send as comma-separated string

    // Append movie details (only truly relevant if movieTitle provided, but send anyway)
    formData.append('movieGenres', movieGenres);
    formData.append('movieDirector', movieDirector);
    formData.append('movieActors', movieActors);

    // Append book details (only truly relevant if bookTitle provided, but send anyway)
    formData.append('bookGenres', bookGenres);
    formData.append('bookAuthor', bookAuthor);

    // Append files if they exist
    if (moviePoster) formData.append('moviePoster', moviePoster);
    if (bookCover) formData.append('bookCover', bookCover);
    if (screenshot) formData.append('screenshot', screenshot);

    try {
      // Optional: Keep console log for debugging during development
      // console.log('Submitting FormData:');
      // for (let [key, value] of formData.entries()) { console.log(`${key}:`, value); }

      const { data: newConnection } = await api.post('/connections', formData);
      console.log('Connection created:', newConnection);
      // Navigate to the new connection's detail page or feed
      // Let's navigate to the feed for now
      navigate('/'); // Navigate to home/feed on success
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to create connection.";
      console.error("Create connection error:", err.response || err);
      setError(message);
    } finally {
      setLoading(false); // Ensure loading is set to false in both success and error cases
    }
  };

  // Helper to render file input section (no changes needed here)
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

      {/* --- Helper Text --- */}
      <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-light)', marginTop: '-10px', marginBottom: '15px' }}>
        Create a standard connection by providing both a movie and a book title.
        <br/>Alternatively, just share your thoughts or a quote in the 'Context' field below.
      </p>

      <ErrorMessage message={error} />

      {/* --- Movie/Book Title Fields (Now Optional based on Context) --- */}
      <Input
        label="Movie Title"
        id="movieTitle"
        value={movieTitle}
        onChange={handleInputChange(setMovieTitle)} // Use wrapper to clear error
        // removed required prop
        disabled={loading}
        placeholder="e.g., Pulp Fiction (Needed for standard connection)"
      />
      <Input
        label="Book Title"
        id="bookTitle"
        value={bookTitle}
        onChange={handleInputChange(setBookTitle)} // Use wrapper to clear error
        // removed required prop
        disabled={loading}
        placeholder="e.g., Modesty Blaise (Needed for standard connection)"
      />

       {/* --- Context Field (Required if no Movie/Book Titles) --- */}
       <Input
        label="Context / Your Thoughts" // Updated Label
        id="context"
        type="textarea"
        value={context}
        onChange={handleInputChange(setContext)} // Use wrapper to clear error
        disabled={loading}
        placeholder="Describe when/where the book appears, share a quote, or post your thoughts..."
        rows={4}
        // Add aria-describedby if linking to error message needed
      />

      {/* --- Optional Fields --- */}
      <Input
        label="Tags (Optional)"
        id="tags"
        value={tags}
        onChange={handleInputChange(setTags)} // Use wrapper
        disabled={loading}
        placeholder="e.g., sci-fi, dystopian, philosophical"
        helperText="Separate tags with commas"
      />

      {/* --- Optional Movie Details (Relevant if Movie Title provided) --- */}
      <fieldset className={styles.fieldGroup}>
          <legend>Optional Movie Details</legend>
          <Input
            label="Movie Genre(s)" id="movieGenres" value={movieGenres}
            onChange={handleInputChange(setMovieGenres)} // Use wrapper
            disabled={loading}
            placeholder="e.g., Sci-Fi, Thriller"
            helperText="Separate multiple genres with commas"
          />
          <Input
            label="Director" id="movieDirector" value={movieDirector}
            onChange={handleInputChange(setMovieDirector)} // Use wrapper
            disabled={loading}
            placeholder="e.g., Quentin Tarantino"
          />
           <Input
            label="Actor(s)" id="movieActors" value={movieActors}
            onChange={handleInputChange(setMovieActors)} // Use wrapper
            disabled={loading}
            placeholder="e.g., John Travolta, Samuel L. Jackson"
            helperText="Separate multiple actors with commas"
          />
      </fieldset>

      {/* --- Optional Book Details (Relevant if Book Title provided) --- */}
      <fieldset className={styles.fieldGroup}>
          <legend>Optional Book Details</legend>
           <Input
            label="Book Genre(s)" id="bookGenres" value={bookGenres}
            onChange={handleInputChange(setBookGenres)} // Use wrapper
            disabled={loading}
            placeholder="e.g., Spy fiction, Adventure"
            helperText="Separate multiple genres with commas"
          />
          <Input
            label="Author" id="bookAuthor" value={bookAuthor}
            onChange={handleInputChange(setBookAuthor)} // Use wrapper
            disabled={loading}
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
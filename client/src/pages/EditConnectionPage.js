// client/src/pages/EditConnectionPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// Import necessary API functions: getConnectionById, getStaticFileUrl, and updateConnection
import { getConnectionById, getStaticFileUrl, updateConnection } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import { useAuth } from '../contexts/AuthContext'; // Import AuthContext

import styles from './EditConnectionPage.module.css';

function EditConnectionPage() {
    const { connectionId } = useParams(); // Get the connection ID from the URL
    const navigate = useNavigate();
    const location = useLocation(); // Get the location object from the hook
    const { isAuthenticated, user, loading: authLoading } = useAuth(); // Get user info and auth state

    // State for fetched connection data
    const [connection, setConnection] = useState(null);
    // Initialize loading to TRUE. It will be set to false in fetchConnection's finally block or redirect paths.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- State for form fields ---
    const [formData, setFormData] = useState({
        movieTitle: '', // Display only
        bookTitle: '', // Display only
        bookAuthor: '', // Editable
        context: '', // Editable
        tags: '', // Editable
        screenshotFile: null, // New file to upload
        existingScreenshotUrl: null, // URL of current screenshot
        // removeExistingScreenshot: false, // Optional: State to track if user wants to remove screenshot
    });

    // --- State for submission ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState(null);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);


    // Effect to fetch the connection details
    const fetchConnection = useCallback(async () => {
        console.log("EditConnectionPage: >>> Inside fetchConnection for ID:", connectionId);
        try {
            console.log("EditConnectionPage: fetchConnection: Setting loading(true)...");
            setLoading(true); // Start loading here before the API call
            console.log("EditConnectionPage: fetchConnection: Clearing error...");
            setError(null); // Clear previous errors before fetching

            console.log("EditConnectionPage: fetchConnection: Attempting to fetch connection via API...");
            const response = await getConnectionById(connectionId);
            const fetchedConnection = response.data;
            console.log("EditConnectionPage: fetchConnection: API call successful. Fetched connection data received.");

            console.log("EditConnectionPage: fetchConnection: Setting connection state...");
            setConnection(fetchedConnection); // This triggers a re-render

            // --- Populate form state with fetched data ---
             console.log("EditConnectionPage: fetchConnection: Populating form data with:", fetchedConnection);
            setFormData({
                movieTitle: fetchedConnection.movieRef?.title || '',
                bookTitle: fetchedConnection.bookRef?.title || '',
                bookAuthor: fetchedConnection.bookRef?.author || '',
                context: fetchedConnection.context || '',
                tags: fetchedConnection.tags?.join(', ') || '', // Convert array to comma-separated string
                screenshotFile: null, // No new file initially
                existingScreenshotUrl: getStaticFileUrl(fetchedConnection.screenshotUrl), // Set existing image URL
            });
            console.log("EditConnectionPage: fetchConnection: Form data populated.");


        } catch (err) {
            console.error("EditConnectionPage: fetchConnection: Error fetching connection:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch connection details for editing.';
            console.log("EditConnectionPage: fetchConnection: Setting error state...");
            setError(errorMsg);
            console.log("EditConnectionPage: fetchConnection: Setting connection(null) on error...");
             setConnection(null); // Ensure connection is null on error state

        } finally {
            console.log("EditConnectionPage: fetchConnection: Finally block. Setting loading(false)...");
            setLoading(false); // Stop loading here regardless of success or failure
            console.log("EditConnectionPage: <<< Exiting fetchConnection");
        }
    }, [connectionId]); // Dependency connectionId


     // Effect for Authentication, Authorization, and Data Fetching
     useEffect(() => {
         console.log(`EditConnectionPage: >>> useEffect running. authLoading: ${authLoading}, isAuthenticated: ${isAuthenticated}, user: ${user ? user._id : 'null'}, connection: ${connection ? connection._id : 'null'}, loading: ${loading}, error: ${error ? error.message : 'null'}`);

         // --- Step 1: Wait for Auth Loading ---
         if (authLoading) {
             console.log("EditConnectionPage: useEffect (1): Auth is loading, waiting...");
             // Keep loading true while auth loads, but don't set it here repeatedly
             return;
         }

         // --- Step 2: Handle Not Authenticated ---
         if (!isAuthenticated) {
             console.warn("EditConnectionPage: useEffect (2): User not authenticated. Redirecting to login.");
             console.log("EditConnectionPage: useEffect (2): Setting loading(false) before redirect.");
             setLoading(false); // Stop loading before redirecting away
             navigate('/login', { state: { from: location.pathname }, replace: true });
             console.log("EditConnectionPage: <<< useEffect finished (redirect)");
             return;
         }

         // --- Step 3: Handle Authenticated User is Available ---
         if (user) {
             console.log("EditConnectionPage: useEffect (3): User is authenticated:", user._id);

             // --- Step 4: Fetch Connection Data if Not Already Fetched and No Error ---
             // CORRECTED CONDITION: Call fetchConnection if we don't have the connection data AND there wasn't a previous error.
             // We remove the '!loading' check from the condition here. The loading state is handled *inside* fetchConnection.
             if (!connection && !error) {
                  console.log("EditConnectionPage: useEffect (4): Connection not fetched and no error. Calling fetchConnection.");
                  fetchConnection(); // This initiates the data fetch and sets loading=true internally
                  console.log("EditConnectionPage: useEffect (4): fetchConnection called. State update will cause re-render.");
             } else if (loading) {
                  console.log("EditConnectionPage: useEffect (4a): Connection not yet fetched, but currently loading. Waiting for fetch to complete.");
             } else if (error) {
                 console.log("EditConnectionPage: useEffect (4b): Connection not fetched, but error state is active.");
             } else {
                  console.log("EditConnectionPage: useEffect (4c): Connection already fetched.");
             }


             // --- Step 5: Perform Authorization Check AFTER connection data is loaded ---
             // This block runs on subsequent effect renders after 'connection' state is updated by fetchConnection.
             if (connection) {
                 console.log("EditConnectionPage: useEffect (5): Connection data available. Performing authorization check.");
                 if (!connection.userRef || !connection.userRef._id) {
                      console.error("EditConnectionPage: useEffect (5a): Connection data is incomplete (missing userRef). Cannot check authorization.", connection);
                       setError('Connection data is incomplete. Cannot verify ownership.'); // Set a user-friendly error
                       console.log("EditConnectionPage: useEffect (5a): Setting loading(false) due to incomplete data.");
                       setLoading(false); // Stop loading spinner on this error path
                       console.log("EditConnectionPage: <<< useEffect finished (incomplete data error)");
                      return;
                 }
                 if (connection.userRef._id !== user._id) {
                     console.warn("EditConnectionPage: useEffect (5b): User is authenticated but NOT the author. Redirecting.");
                     console.log("EditConnectionPage: useEffect (5b): Setting loading(false) before redirect.");
                     setLoading(false); // Stop loading before redirecting away
                     navigate(`/connections/${connectionId}`, { replace: true });
                     console.log("EditConnectionPage: <<< useEffect finished (unauthorized redirect)");
                 } else {
                      console.log("EditConnectionPage: useEffect (5c): User IS the author. Ready to render form (loading should be false now).");
                      console.log("EditConnectionPage: <<< useEffect finished (authorized and ready)");
                 }
             } else if (error) {
                  console.log("EditConnectionPage: useEffect (5d): Connection is null but error state is active. Rendering error message.");
                   console.log("EditConnectionPage: <<< useEffect finished (error state)");
             } else if (loading) {
                 console.log("EditConnectionPage: useEffect (5): Connection is null, loading is true. Waiting for fetchConnection to finish.");
                  console.log("EditConnectionPage: <<< useEffect finished (waiting)");
             }
         } else {
              console.error("EditConnectionPage: useEffect (3b): User is null but isAuthenticated is true? This indicates an issue with AuthContext or state timing.");
              setError("Authentication state error.");
              setLoading(false);
              console.log("EditConnectionPage: <<< useEffect finished (auth state error)");
         }


         // Dependencies:
         // authLoading, isAuthenticated, user: Control when to check auth and who the user is.
         // fetchConnection: Called within the effect.
         // connection, loading, error: State variables that determine fetch condition and subsequent actions.
         // connectionId: URL param dependency for fetchConnection.
         // navigate, location: Used for redirection.
         // Note: loading is included as a dependency per ESLint, but its value is not used to trigger the *initial* fetch in this corrected logic.
     }, [authLoading, isAuthenticated, user, fetchConnection, connection, loading, error, connectionId, navigate, location]);


    // --- Handlers for form input changes ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`EditConnectionPage: handleInputChange - name: ${name}, value: ${value}`);
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
         // Clear submission error when form changes
        setSubmissionError(null);
        setSubmissionSuccess(false);
    };

     const handleFileChange = (e) => {
        console.log("EditConnectionPage: handleFileChange - file selected:", e.target.files[0]?.name);
        setFormData(prevData => ({
            ...prevData,
            screenshotFile: e.target.files[0], // Get the first file
        }));
         // Clear submission error when form changes
        setSubmissionError(null);
        setSubmissionSuccess(false);
    };


    // --- Handler for form submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("EditConnectionPage: Form submitted. Submitting data:", formData);

        if (isSubmitting) {
            console.log("EditConnectionPage: Submission already in progress. Preventing double submission.");
            return;
        }

        setIsSubmitting(true);
        setSubmissionError(null); // Clear previous errors
        setSubmissionSuccess(false); // Clear previous success state


        // --- Prepare FormData for API call ---
        const dataToSubmit = new FormData();

        // Append ONLY the fields that are editable/updatable and were potentially changed
        // Check explicitly for undefined to allow sending empty strings if a field was cleared
        if (formData.context !== undefined) {
            dataToSubmit.append('context', formData.context);
        }
        if (formData.tags !== undefined) {
             dataToSubmit.append('tags', formData.tags);
        }
        if (formData.bookAuthor !== undefined) { // bookAuthor is optional on backend, send if present in form state
            dataToSubmit.append('bookAuthor', formData.bookAuthor);
        }


        // Append the new screenshot file IF one was selected
        if (formData.screenshotFile) {
            console.log("EditConnectionPage: Appending new screenshot file to FormData.");
            dataToSubmit.append('screenshot', formData.screenshotFile);
        }
        // Optional: Append a flag to remove the existing screenshot if that feature is implemented and checked
        // else if (formData.removeExistingScreenshot) {
        //      console.log("EditConnectionPage: Appending removeScreenshot=true flag to FormData.");
        //      dataToSubmit.append('removeScreenshot', 'true');
        // }
        // Note: If no new file and no remove flag, the backend should keep the existing screenshot


        // --- Call the updateConnection API ---
        try {
            console.log(`EditConnectionPage: Calling updateConnection API for ID: ${connectionId}...`);
            const response = await updateConnection(connectionId, dataToSubmit); // Make the API call

            console.log("EditConnectionPage: Update API call successful:", response.data);
            setSubmissionSuccess(true); // Set success state (optional)


            // --- Redirect on success ---
            console.log("EditConnectionPage: Redirecting to connection detail page...");
            navigate(`/connections/${connectionId}`); // Navigate to the detail page

        } catch (err) {
            console.error("EditConnectionPage: Error submitting update:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to save changes.';
            console.log("EditConnectionPage: Setting submission error state...");
            setSubmissionError(errorMsg); // Set submission error state
        } finally {
            console.log("EditConnectionPage: Submission process finished. Setting isSubmitting to false.");
            setIsSubmitting(false); // Stop submission loading
        }
    };


    // --- Loading State ---
    // Show spinner while authentication or initial connection data is loading
    if (authLoading || loading) {
        console.log("EditConnectionPage: Rendering Loading Spinner. authLoading:", authLoading, "loading:", loading);
        return (
            <>
                <Helmet>
                    <title>Loading Connection for Edit... | MovieBooks</title>
                </Helmet>
                <div className={styles.pageContainer}><LoadingSpinner /></div>
            </>
        );
    }

     // --- Authentication/Authorization Error State ---
     if (!isAuthenticated) {
          console.log("EditConnectionPage: Rendering Not Authenticated Error (Fallback).");
          return (
             <>
                 <Helmet>
                     <title>Unauthorized | MovieBooks</title>
                 </Helmet>
                 <div className={styles.pageContainer}>
                      <ErrorMessage message="You must be logged in to edit connections." />
                      <button onClick={() => navigate('/login', { state: { from: location.pathname } })}>Login</button>
                 </div>
             </>
         );
     }

     if (connection && user && connection.userRef?._id !== user._id) {
         console.log("EditConnectionPage: Rendering Not Authorized Error (Fallback).");
         return (
             <>
                 <Helmet>
                     <title>Unauthorized | MovieBooks</title>
                 </Helmet>
                 <div className={styles.pageContainer}>
                      <ErrorMessage message="You are not authorized to edit this connection." />
                      <button onClick={() => navigate(`/connections/${connectionId}`)}>Back to Connection</button>
                 </div>
             </>
         );
     }


    // --- Error State (from initial fetch or other logic) ---
    if (error) {
        console.log("EditConnectionPage: Rendering Fetch Error:", error);
        return (
            <>
                <Helmet>
                    <title>Error | MovieBooks</title>
                </Helmet>
                <div className={styles.pageContainer}>
                    <ErrorMessage message={error} />
                    <button onClick={() => navigate(`/connections/${connectionId}`)} className={styles.backButton}>Back to Connection</button>
                </div>
            </>
        );
    }

    // --- No Connection Data State (Shouldn't happen if no error and auth is fine, but fallback) ---
     if (!connection) {
         console.log("EditConnectionPage: Rendering 'Connection Not Loaded' Error (Fallback).");
         return (
             <>
                  <Helmet>
                     <title>Connection Not Found | MovieBooks</title>
                 </Helmet>
                 <div className={styles.pageContainer}>
                     <ErrorMessage message="Connection data could not be loaded for editing." />
                     <button onClick={() => navigate('/')} className={styles.backButton}>Go Home</button>
                 </div>
             </>
         );
     }


    // --- Success State - Render Edit Form ---
    console.log("EditConnectionPage: Rendering Edit Form. Connection data:", connection);
    const { movieRef, bookRef } = connection;

    return (
        <>
            <Helmet>
                <title>Edit Connection: {movieRef?.title || 'Unknown'} & {bookRef?.title || 'Unknown'} | MovieBooks</title>
            </Helmet>
            <div className={styles.pageContainer}>
                <h1 className={styles.title}>Edit Connection</h1>

                {/* Submission Error Message */}
                {submissionError && <ErrorMessage message={submissionError} />}
                {/* Submission Success Message (Optional, or just rely on redirect) */}
                {submissionSuccess && <p className={styles.successMessage}>Changes saved successfully!</p>}


                <form onSubmit={handleSubmit} className={styles.editForm}>
                    {/* Movie Title (Display only) */}
                    <div className={styles.formGroup}>
                         <label htmlFor="movieTitle">Movie Title:</label>
                         <p className={styles.readOnlyField}>{formData.movieTitle || 'N/A'}</p>
                    </div>

                     {/* Book Title (Display only) */}
                    <div className={styles.formGroup}>
                         <label htmlFor="bookTitle">Book Title:</label>
                         <p className={styles.readOnlyField}>{formData.bookTitle || 'N/A'}</p>
                    </div>

                    {/* Book Author (Editable) */}
                    <div className={styles.formGroup}>
                        <label htmlFor="bookAuthor">Book Author:</label>
                         <input
                             type="text"
                             id="bookAuthor"
                             name="bookAuthor"
                             value={formData.bookAuthor}
                             onChange={handleInputChange}
                             className={styles.inputField}
                         />
                    </div>


                    {/* Context (Editable Textarea) */}
                    <div className={styles.formGroup}>
                        <label htmlFor="context">Connection Context:</label>
                        <textarea
                            id="context"
                            name="context"
                            value={formData.context}
                            onChange={handleInputChange}
                            className={styles.textareaField}
                            rows="6"
                        />
                    </div>

                    {/* Tags (Editable Input for comma-separated string) */}
                    <div className={styles.formGroup}>
                        <label htmlFor="tags">Tags (comma-separated):</label>
                         <input
                             type="text"
                             id="tags"
                             name="tags"
                             value={formData.tags}
                             onChange={handleInputChange}
                             className={styles.inputField}
                             placeholder="e.g., character, scene, theme"
                         />
                    </div>

                    {/* Screenshot (File Input and Preview) */}
                    <div className={styles.formGroup}>
                        <label htmlFor="screenshot">Replace Screenshot:</label>
                        <input
                            type="file"
                            id="screenshot"
                            name="screenshot"
                            accept="image/*"
                            onChange={handleFileChange}
                            className={styles.fileInput}
                            disabled={isSubmitting}
                        />
                        <div className={styles.screenshotPreviewArea}>
                            {formData.screenshotFile ? (
                                 <>
                                    <p>New Image Preview:</p>
                                    <img
                                        src={URL.createObjectURL(formData.screenshotFile)}
                                        alt="New Screenshot Preview"
                                        className={styles.screenshotPreview}
                                    />
                                 </>
                            ) : formData.existingScreenshotUrl ? (
                                 <>
                                     <p>Existing Screenshot:</p>
                                     <img
                                         src={formData.existingScreenshotUrl}
                                         alt="Existing Screenshot"
                                         className={styles.screenshotPreview}
                                          onError={(e) => {
                                            console.error("Error loading existing screenshot:", formData.existingScreenshotUrl, e);
                                            e.target.style.display = 'none';
                                         }}
                                     />
                                      {/* Optional: Add a checkbox/button to explicitly remove the existing screenshot */}
                                 </>
                            ) : (
                                 <p>No screenshot currently exists for this connection.</p>
                             )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className={styles.buttonGroup}>
                         <button
                            type="submit"
                            className={styles.saveButton}
                            disabled={isSubmitting}
                         >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                         </button>
                         <button
                             type="button"
                             onClick={() => navigate(`/connections/${connectionId}`)}
                             className={styles.cancelButton}
                             disabled={isSubmitting}
                         >
                             Cancel
                         </button>
                    </div>

                </form>

                <div className={styles.backLinkContainer}>
                    <button onClick={() => navigate(`/connections/${connectionId}`)} className={styles.backButton} disabled={isSubmitting}>Back to Connection Details</button>
                </div>

            </div>
        </>
    );
}

export default EditConnectionPage;
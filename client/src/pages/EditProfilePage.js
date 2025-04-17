// client/src/pages/EditProfilePage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Import API functions and helpers
import api, { getMyProfile, updateMyProfile, getStaticFileUrl } from '../services/api';
// Import reusable UI components
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
// Import page-specific styles
import styles from './EditProfilePage.module.css';
// Import default avatar image
import defaultAvatar from '../assets/images/default-avatar.png';

/**
 * Renders the page allowing the logged-in user to edit their profile details,
 * including display name, bio, location, and profile picture.
 */
const EditProfilePage = () => {
  // --- Hooks ---
  // Get user state, auth loading status, and setUser function from AuthContext
  const { user, loading: authLoading, setUser } = useAuth();
  // Get navigation function from React Router
  const navigate = useNavigate();
  // Create a ref to access the hidden file input element programmatically
  const fileInputRef = useRef(null);

  // --- State Variables for Form Fields ---
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  // --- State Variables for Profile Picture ---
  // Stores the URL of the currently saved profile picture (from the database)
  const [currentProfilePictureUrl, setCurrentProfilePictureUrl] = useState('');
  // Stores the File object selected by the user via the input
  const [selectedFile, setSelectedFile] = useState(null);
  // Stores the temporary local URL (base64 or blob) for previewing the selected image
  const [previewUrl, setPreviewUrl] = useState(null);

  // --- State Variables for Loading and Errors ---
  // Tracks loading state for the initial profile data fetch
  const [loading, setLoading] = useState(true);
  // Stores errors related to the initial data fetch
  const [error, setError] = useState(null);
  // Tracks loading state during the form submission process (API calls)
  const [submitting, setSubmitting] = useState(false);
  // Stores errors related to the form submission process
  const [submitError, setSubmitError] = useState(null);

  // --- Function to Fetch Current Profile Data ---
  /**
   * Fetches the current user's profile data from the API.
   * Populates the form fields and sets the initial image preview.
   */
  const fetchProfile = useCallback(async () => {
    // console.log("Fetching profile data for edit page..."); // Debug log removed
    setLoading(true);
    setError(null);
    setSelectedFile(null); // Reset file selection state
    setPreviewUrl(null);   // Reset preview URL state
    try {
      // Call the API function to get the logged-in user's profile
      const res = await getMyProfile();
      // console.log("Profile data received:", res.data); // Debug log removed
      // Populate form state with fetched data, using empty strings as fallbacks
      setDisplayName(res.data.displayName || '');
      setBio(res.data.bio || '');
      setLocation(res.data.location || '');
      // Store the URL of the currently saved profile picture
      setCurrentProfilePictureUrl(res.data.profilePictureUrl || '');
      // Set the initial preview URL to the current picture or the default avatar
      setPreviewUrl(res.data.profilePictureUrl ? getStaticFileUrl(res.data.profilePictureUrl) : defaultAvatar);
    } catch (err) {
      // Handle errors during fetching
      const message = err.response?.data?.message || err.message || "Failed to load profile data.";
      console.error("Error fetching profile data:", err); // Keep error log
      setError(message);
      // Reset form fields on error
      setDisplayName('');
      setBio('');
      setLocation('');
      setCurrentProfilePictureUrl('');
      setPreviewUrl(defaultAvatar); // Fallback preview on error
    } finally {
      // Ensure loading state is turned off after the attempt
      setLoading(false);
    }
  }, []); // No dependencies needed as it doesn't rely on component state/props

  // --- Effect to Handle Authentication and Trigger Fetch ---
  /**
   * useEffect hook to:
   * 1. Redirect to login if the user is not authenticated after the initial auth check.
   * 2. Trigger the profile data fetch once the user is confirmed to be logged in.
   */
  useEffect(() => {
    // If auth check is done and there's no user, redirect to login
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/profile/edit' } }); // Pass original destination
      return; // Stop further execution in this effect run
    }
    // If auth check is done and there IS a user, fetch their profile data
    if (!authLoading && user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate, fetchProfile]); // Dependencies: Run when auth state changes or fetchProfile instance changes

  // --- File Input Handling ---
  /**
   * Handles the change event of the file input element.
   * Validates the selected file and updates the selectedFile and previewUrl state.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0]; // Get the first selected file
    if (file) {
      // --- Basic File Validation ---
      // Check if the file type starts with 'image/'
      if (!file.type.startsWith('image/')) {
          setSubmitError("Please select an image file (jpg, png, gif).");
          setSelectedFile(null); // Clear invalid selection
          // Revert preview to the currently saved image or default
          setPreviewUrl(currentProfilePictureUrl ? getStaticFileUrl(currentProfilePictureUrl) : defaultAvatar);
          return; // Stop processing
      }
      // Check file size against a limit (e.g., 5MB, matching backend)
       if (file.size > 5 * 1024 * 1024) { // 5MB limit
           setSubmitError("File is too large. Maximum size is 5MB.");
           setSelectedFile(null); // Clear invalid selection
           // Revert preview
           setPreviewUrl(currentProfilePictureUrl ? getStaticFileUrl(currentProfilePictureUrl) : defaultAvatar);
           return; // Stop processing
       }
      // --- End Validation ---

      // console.log("File selected:", file); // Debug log removed
      setSelectedFile(file); // Store the valid File object
      setSubmitError(null); // Clear any previous file-related errors

      // --- Generate Local Preview ---
      // Use FileReader API to read the file content as a base64 Data URL
      const reader = new FileReader();
      // Define what happens when the reader finishes loading the file
      reader.onloadend = () => {
        // Set the previewUrl state to the result (the base64 string)
        setPreviewUrl(reader.result);
      };
      // Start reading the file content
      reader.readAsDataURL(file);
      // --- End Preview Generation ---

    } else {
        // Handle case where user cancels file selection
        setSelectedFile(null); // Clear selected file state
        // Revert preview to the currently saved image or default
        setPreviewUrl(currentProfilePictureUrl ? getStaticFileUrl(currentProfilePictureUrl) : defaultAvatar);
    }
  };

  /**
   * Programmatically triggers a click on the hidden file input element.
   * Called when the user clicks the avatar image or the "Change Picture" button.
   */
  const handleAvatarClick = () => {
    // Use the ref to access the file input and simulate a click
    fileInputRef.current?.click();
  };

  // --- Form Submission Handling ---
  /**
   * Handles the submission of the profile edit form.
   * Uploads a new profile picture if selected, then updates text profile data.
   * Updates the AuthContext and localStorage on success, then navigates back to the profile page.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)
    setSubmitting(true); // Set loading state for submission
    setSubmitError(null); // Clear previous submission errors

    // Start with the current user data from context as a base
    let finalUserInfo = { ...user };

    try {
      // --- Step 1: Upload Profile Picture (if a new file was selected) ---
      let uploadedPictureUrl = currentProfilePictureUrl; // Default to the existing URL

      if (selectedFile) {
        // console.log("Uploading new profile picture..."); // Debug log removed
        // Create FormData object to send the file
        const formData = new FormData();
        // Append the file with the field name expected by the backend ('profilePicture')
        formData.append('profilePicture', selectedFile);

        // Make the API call to upload the picture (using PUT method)
        const uploadRes = await api.put('/users/profile/picture', formData, {
          headers: {
            // Set Content-Type header for file uploads
            'Content-Type': 'multipart/form-data',
          },
        });
        // console.log("Profile picture upload successful:", uploadRes.data); // Debug log removed
        // Get the new URL of the uploaded picture from the API response
        uploadedPictureUrl = uploadRes.data.profilePictureUrl;
        // Immediately update the user info object with the new picture URL
        finalUserInfo = { ...finalUserInfo, ...uploadRes.data };
        // Update component state to reflect the newly saved URL
        setCurrentProfilePictureUrl(uploadedPictureUrl);
        // Clear the selected file state after successful upload
        setSelectedFile(null);
      }

      // --- Step 2: Update Text Profile Data ---
      // Prepare the data object with values from the form state
      const profileDataToUpdate = {
        displayName,
        bio,
        location,
        // NOTE: Do NOT send profilePictureUrl in this update request.
        // It was handled separately in Step 1. Sending it here might cause issues
        // if the backend expects only text fields for this specific endpoint.
      };
      // console.log("Updating text profile data:", profileDataToUpdate); // Debug log removed
      // Make the API call to update the text fields
      const updateRes = await updateMyProfile(profileDataToUpdate);
      // console.log("Text profile update successful:", updateRes.data); // Debug log removed

      // --- Step 3: Update Auth Context and localStorage ---
      // Merge the results from the text update API call into the user info object
      finalUserInfo = { ...finalUserInfo, ...updateRes.data };
      // Crucially, ensure the profilePictureUrl reflects the result from Step 1 (upload or original)
      finalUserInfo.profilePictureUrl = uploadedPictureUrl;

      // console.log("Final user info for context:", finalUserInfo); // Debug log removed
      // Update the user state in the AuthContext
      setUser(finalUserInfo);
      // Update the user info stored in localStorage for session persistence
      localStorage.setItem('userInfo', JSON.stringify(finalUserInfo));

      // --- Step 4: Navigate Back to Profile Page ---
      navigate('/profile'); // Redirect on successful update

    } catch (err) {
      // Handle errors during submission (either upload or text update)
      const message = err.response?.data?.message || err.message || "Failed to update profile.";
      console.error("Error updating profile:", err); // Keep error log
      setSubmitError(message); // Display the error message to the user
      setSubmitting(false); // Re-enable the form by setting loading state to false
    }
    // No 'finally' block needed for 'setSubmitting(false)' because:
    // - On success, navigation occurs, unmounting the component.
    // - On error, it's explicitly set to false in the catch block.
  };

  // --- Render Logic ---

  // Display loading spinner during initial auth check or profile data fetch
  if (authLoading || loading) {
    return (
        <div className={styles.pageContainer} style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <p>{authLoading ? 'Checking authentication...' : 'Loading Profile Data...'}</p>
        </div>
      );
  }

  // Display error message if initial profile fetch failed
  if (error) {
     return (
        <div className={styles.pageContainer}>
          <ErrorMessage message={`Error loading profile: ${error}`} />
          {/* Provide a button to retry fetching the profile data */}
          <button onClick={fetchProfile} className={styles.retryButton}>Retry</button>
        </div>
      );
  }

  // Render the main form if loading is complete and no initial error occurred
  return (
    <div className={styles.pageContainer}>
      <h1>Edit Your Profile</h1>
      {/* Form element with onSubmit handler */}
      <form onSubmit={handleSubmit} className={styles.profileForm}>
        {/* Display submission errors */}
        {submitError && <ErrorMessage message={submitError} />}

        {/* --- Profile Picture Section --- */}
        <div className={styles.formGroup}>
            <label>Profile Picture</label>
            <div className={styles.avatarUploadContainer}>
                {/* Display the image preview (either selected file or current/default) */}
                <img
                    src={previewUrl || defaultAvatar} // Use preview URL or default avatar
                    alt="Avatar Preview"
                    className={styles.avatarPreviewLarge} // Apply styling for large preview
                    onClick={handleAvatarClick} // Allow clicking image to trigger file input
                    title="Click to change picture" // Tooltip hint
                />
                {/* Hidden file input element, accessed via ref */}
                <input
                    type="file"
                    ref={fileInputRef} // Attach the ref
                    onChange={handleFileChange} // Attach file change handler
                    accept="image/png, image/jpeg, image/gif" // Specify accepted image types
                    style={{ display: 'none' }} // Hide the default browser file input UI
                    disabled={submitting} // Disable while form is submitting
                />
                {/* Button to explicitly trigger file input */}
                 <button
                    type="button" // Important: Prevent form submission
                    onClick={handleAvatarClick} // Trigger file input click
                    className={styles.changePictureButton} // Apply button styling
                    disabled={submitting} // Disable while submitting
                >
                    Change Picture
                </button>
            </div>
            {/* Hint text below the upload area */}
             <small className={styles.fieldHint}>Click the image or button to upload (Max 5MB: jpg, png, gif)</small>
        </div>

        {/* --- Text Input Fields --- */}
        {/* Display Name */}
        <div className={styles.formGroup}>
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength="50" // Match backend validation
            placeholder="How you want to appear"
            disabled={submitting} // Disable during submission
          />
        </div>

        {/* Bio */}
        <div className={styles.formGroup}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength="250" // Match backend validation
            rows="4" // Suggest initial height
            placeholder="Tell us a bit about yourself"
            disabled={submitting}
          ></textarea>
        </div>

        {/* Location */}
        <div className={styles.formGroup}>
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength="100" // Match backend validation
            placeholder="Where are you based?"
            disabled={submitting}
          />
        </div>

        {/* --- Form Action Buttons --- */}
        <div className={styles.formActions}>
          {/* Submit Button */}
          <button type="submit" disabled={submitting || loading} className={styles.submitButton}>
            {/* Show spinner or text based on submission state */}
            {submitting ? <LoadingSpinner size="small" inline /> : 'Save Changes'}
          </button>
          {/* Cancel Button */}
          <button
            type="button" // Prevent form submission
            onClick={() => navigate('/profile')} // Navigate back to profile page
            disabled={submitting} // Disable during submission
            className={styles.cancelButton} // Apply cancel button styling
            >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;

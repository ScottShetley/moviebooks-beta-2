// client/src/pages/EditProfilePage.js
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { getMyProfile, updateMyProfile, getStaticFileUrl } from '../services/api'; // Added api default import and getStaticFileUrl
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import styles from './EditProfilePage.module.css';
import defaultAvatar from '../assets/images/default-avatar.png'; // Keep default avatar

const EditProfilePage = () => {
  const { user, loading: authLoading, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null); // Ref for the file input

  // State for form text fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  // State for profile picture handling
  const [currentProfilePictureUrl, setCurrentProfilePictureUrl] = useState(''); // Store the URL from DB
  const [selectedFile, setSelectedFile] = useState(null); // Store the File object if selected
  const [previewUrl, setPreviewUrl] = useState(null); // Store the local preview URL

  // State for loading and errors
  const [loading, setLoading] = useState(true); // Loading initial data
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch current profile data
  const fetchProfile = useCallback(async () => {
    console.log("Fetching profile data for edit page...");
    setLoading(true);
    setError(null);
    setSelectedFile(null); // Reset file selection on fetch
    setPreviewUrl(null);   // Reset preview on fetch
    try {
      const res = await getMyProfile();
      console.log("Profile data received:", res.data);
      setDisplayName(res.data.displayName || '');
      setBio(res.data.bio || '');
      setLocation(res.data.location || '');
      setCurrentProfilePictureUrl(res.data.profilePictureUrl || ''); // Store current URL
      // Set initial preview to the current URL (or default)
      setPreviewUrl(res.data.profilePictureUrl ? getStaticFileUrl(res.data.profilePictureUrl) : defaultAvatar);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load profile data.";
      console.error("Error fetching profile data:", err);
      setError(message);
      setDisplayName('');
      setBio('');
      setLocation('');
      setCurrentProfilePictureUrl('');
      setPreviewUrl(defaultAvatar); // Fallback preview
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed here

  // Effect to handle auth state and trigger fetch
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/profile/edit' } });
      return;
    }
    if (!authLoading && user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate, fetchProfile]);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Basic validation (optional: add size/type check here if needed)
      if (!file.type.startsWith('image/')) {
          setSubmitError("Please select an image file (jpg, png, gif).");
          setSelectedFile(null);
          setPreviewUrl(currentProfilePictureUrl ? getStaticFileUrl(currentProfilePictureUrl) : defaultAvatar); // Revert preview
          return;
      }
       if (file.size > 5 * 1024 * 1024) { // 5MB limit match backend
           setSubmitError("File is too large. Maximum size is 5MB.");
           setSelectedFile(null);
           setPreviewUrl(currentProfilePictureUrl ? getStaticFileUrl(currentProfilePictureUrl) : defaultAvatar); // Revert preview
           return;
       }

      console.log("File selected:", file);
      setSelectedFile(file);
      setSubmitError(null); // Clear previous errors

      // Create a local preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
        // No file selected or selection cancelled
        setSelectedFile(null);
        setPreviewUrl(currentProfilePictureUrl ? getStaticFileUrl(currentProfilePictureUrl) : defaultAvatar); // Revert preview
    }
  };

  // Trigger file input click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    let finalUserInfo = { ...user }; // Start with current user context data

    try {
      // --- Step 1: Upload Profile Picture if selected ---
      let uploadedPictureUrl = currentProfilePictureUrl; // Assume current initially
      if (selectedFile) {
        console.log("Uploading new profile picture...");
        const formData = new FormData();
        formData.append('profilePicture', selectedFile); // Field name must match backend multer config

        // Use the default export 'api' which is the configured Axios instance
        const uploadRes = await api.put('/users/profile/picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Important for file uploads
          },
        });
        console.log("Profile picture upload successful:", uploadRes.data);
        uploadedPictureUrl = uploadRes.data.profilePictureUrl; // Get the new URL from the response
        // Update user context immediately with the new picture URL from upload response
        finalUserInfo = { ...finalUserInfo, ...uploadRes.data };
        setCurrentProfilePictureUrl(uploadedPictureUrl); // Update state to reflect saved URL
        setSelectedFile(null); // Clear selected file state after successful upload
      }

      // --- Step 2: Update Text Profile Data ---
      const profileDataToUpdate = {
        displayName,
        bio,
        location,
        // DO NOT send profilePictureUrl here - it was handled above
      };
      console.log("Updating text profile data:", profileDataToUpdate);
      const updateRes = await updateMyProfile(profileDataToUpdate);
      console.log("Text profile update successful:", updateRes.data);

      // --- Step 3: Update Auth Context and localStorage with final combined data ---
      // Merge the result from the text update into our user info object
      finalUserInfo = { ...finalUserInfo, ...updateRes.data };
      // Ensure the picture URL from upload (or original if no upload) is correctly set
      finalUserInfo.profilePictureUrl = uploadedPictureUrl;

      console.log("Final user info for context:", finalUserInfo);
      setUser(finalUserInfo);
      localStorage.setItem('userInfo', JSON.stringify(finalUserInfo));

      // --- Step 4: Navigate back ---
      navigate('/profile');

    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update profile.";
      console.error("Error updating profile:", err);
      setSubmitError(message);
      setSubmitting(false); // Re-enable form on error
    }
    // No finally block needed for submitting state here, as it's handled on success (navigation) or error
  };

  // --- Render Logic ---

  if (authLoading || loading) {
    // ... loading spinner ...
    return (
        <div className={styles.pageContainer} style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <p>{authLoading ? 'Checking authentication...' : 'Loading Profile Data...'}</p>
        </div>
      );
  }

  if (error) {
     // ... error message and retry button ...
     return (
        <div className={styles.pageContainer}>
          <ErrorMessage message={`Error loading profile: ${error}`} />
          <button onClick={fetchProfile} className={styles.retryButton}>Retry</button>
        </div>
      );
  }

  return (
    <div className={styles.pageContainer}>
      <h1>Edit Your Profile</h1>
      <form onSubmit={handleSubmit} className={styles.profileForm}>
        {submitError && <ErrorMessage message={submitError} />}

        {/* --- Profile Picture Section --- */}
        <div className={styles.formGroup}>
            <label>Profile Picture</label>
            <div className={styles.avatarUploadContainer}>
                <img
                    src={previewUrl || defaultAvatar} // Show preview or default
                    alt="Avatar Preview"
                    className={styles.avatarPreviewLarge} // Use a larger preview style
                    onClick={handleAvatarClick} // Click image to trigger upload
                    title="Click to change picture"
                />
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif" // Restrict file types
                    style={{ display: 'none' }} // Hide the default input UI
                    disabled={submitting}
                />
                 <button
                    type="button"
                    onClick={handleAvatarClick}
                    className={styles.changePictureButton}
                    disabled={submitting}
                >
                    Change Picture
                </button>
            </div>
             <small className={styles.fieldHint}>Click the image or button to upload (Max 5MB: jpg, png, gif)</small>
        </div>

        {/* --- Text Fields --- */}
        <div className={styles.formGroup}>
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength="50"
            placeholder="How you want to appear"
            disabled={submitting}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength="250"
            rows="4"
            placeholder="Tell us a bit about yourself"
            disabled={submitting}
          ></textarea>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength="100"
            placeholder="Where are you based?"
            disabled={submitting}
          />
        </div>

        {/* Removed the profilePictureUrl text input */}

        {/* --- Form Actions --- */}
        <div className={styles.formActions}>
          <button type="submit" disabled={submitting || loading} className={styles.submitButton}>
            {submitting ? <LoadingSpinner size="small" inline /> : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            disabled={submitting}
            className={styles.cancelButton}
            >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;
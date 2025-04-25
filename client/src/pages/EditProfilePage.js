// client/src/pages/EditProfilePage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// --- UPDATED useAuth import ---
// Assuming your AuthContext provides an 'updateUser' function
import { useAuth } from '../contexts/AuthContext';
// --- END UPDATED import ---
import api, { getMyProfile, updateMyProfile, getStaticFileUrl } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage/ErrorMessage';
import styles from './EditProfilePage.module.css';
import defaultAvatar from '../assets/images/default-avatar.png';

const EditProfilePage = () => {
  // --- UPDATED useAuth destructuring ---
  // Destructure 'updateUser' instead of 'setUser'
  const { user, loading: authLoading, updateUser } = useAuth();
  // --- END UPDATED destructuring ---

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State for form text fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  // State for Privacy Setting
  const [isPrivate, setIsPrivate] = useState(false);

  // State for profile picture handling
  const [currentProfilePictureUrl, setCurrentProfilePictureUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch current profile data
  const fetchProfile = useCallback(async () => {
    console.log("[EditProfilePage] Fetching profile data for edit page...");
    setLoading(true);
    setError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    try {
      const res = await getMyProfile();
      console.log("[EditProfilePage] Profile data received:", res.data);
      setDisplayName(res.data.displayName || '');
      setBio(res.data.bio || '');
      setLocation(res.data.location || '');
      setCurrentProfilePictureUrl(res.data.profilePictureUrl || '');

      // Set initial preview to the current URL (or default)
      setPreviewUrl(res.data.profilePictureUrl ? getStaticFileUrl(res.data.profilePictureUrl) : defaultAvatar);

      // Set initial privacy state
      const initialIsPrivate = !!res.data.isPrivate;
      console.log("[EditProfilePage] Initial isPrivate from fetch:", initialIsPrivate);
      setIsPrivate(initialIsPrivate);

    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load profile data.";
      console.error("[EditProfilePage] Error fetching profile data:", err);
      setError(message);
      setDisplayName('');
      setBio('');
      setLocation('');
      setCurrentProfilePictureUrl('');
      setPreviewUrl(defaultAvatar);
      setIsPrivate(false);
    } finally {
      setLoading(false);
    }
  }, []);

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
      if (!file.type.startsWith('image/')) {
          setSubmitError("Please select an image file (jpg, png, gif).");
          setSelectedFile(null);
          setPreviewUrl(currentProfilePictureUrl ? getStaticFileUrl(currentProfilePictureUrl) : defaultAvatar);
          return;
      }
       if (file.size > 5 * 1024 * 1024) { // 5MB limit match backend
           setSubmitError("File is too large. Maximum size is 5MB.");
           setSelectedFile(null);
           setPreviewUrl(currentProfilePictureUrl ? getStaticFileUrl(currentProfilePictureUrl) : defaultAvatar);
           return;
       }

      console.log("[EditProfilePage] File selected:", file);
      setSelectedFile(file);
      setSubmitError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
        setSelectedFile(null);
        setPreviewUrl(currentProfilePictureUrl ? getStaticFileUrl(currentProfilePictureUrl) : defaultAvatar);
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

    let finalUserInfo = { ...user };

    try {
      let uploadedPictureUrl = currentProfilePictureUrl;

      // --- Step 1: Upload Profile Picture if selected ---
      if (selectedFile) {
        console.log("[EditProfilePage] Uploading new profile picture...");
        const fileFormData = new FormData();
        fileFormData.append('profilePicture', selectedFile);

        const uploadRes = await api.put('/users/profile/picture', fileFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log("[EditProfilePage] Profile picture upload successful:", uploadRes.data);
        uploadedPictureUrl = uploadRes.data.profilePictureUrl;
        // No need to update finalUserInfo *just* the picture here, will merge text update next

        setCurrentProfilePictureUrl(uploadedPictureUrl);
        setSelectedFile(null);
      }


      // --- Step 2: Update Text Profile Data (including isPrivate) ---
      const profileDataToUpdate = {
        displayName,
        bio,
        location,
        isPrivate, // <-- Include the current isPrivate state value
      };
      console.log("[EditProfilePage] Updating text profile data:", profileDataToUpdate);
      const updateRes = await updateMyProfile(profileDataToUpdate);
      console.log("[EditProfilePage] Text profile update successful:", updateRes.data); // updateRes.data should contain the updated user object including isPrivate


      // --- Step 3: Update Auth Context and localStorage with final combined data ---
      // Merge the data returned from the *text* update (which includes updated isPrivate and other fields)
      // This is safer as it reflects the server's state after the update.
      finalUserInfo = { ...finalUserInfo, ...updateRes.data };
      // Ensure the profile picture URL is the one from the upload (if any), otherwise keep the original
      // updateRes.data might not include the profilePictureUrl from the separate upload step,
      // so explicitly set it from uploadedPictureUrl.
      finalUserInfo.profilePictureUrl = uploadedPictureUrl;


      console.log("[EditProfilePage] Final user info for context:", finalUserInfo);
      // --- FIX: Use the correct function from useAuth ---
      // Replace 'setUser' with 'updateUser' (or whatever your AuthContext provides)
      if (typeof updateUser === 'function') {
           console.log("[EditProfilePage] Calling updateUser from AuthContext...");
           updateUser(finalUserInfo); // Use the provided update function
      } else {
           console.error("[EditProfilePage] AuthContext 'updateUser' function is not available!");
           // Fallback: Manually update localStorage and hope AuthContext syncs or user reloads
           localStorage.setItem('userInfo', JSON.stringify(finalUserInfo));
           // Depending on AuthContext implementation, you might need to trigger a state change differently
           // or this fallback might not fully update the app state until a page reload.
      }
      // --- END FIX ---


      // --- Step 4: Navigate back ---
      navigate(`/users/${finalUserInfo._id}`);


    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update profile.";
      console.error("[EditProfilePage] Error updating profile:", err);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Logic ---

  if (authLoading || loading) {
    return (
        <div className={styles.pageContainer} style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <p>{authLoading ? 'Checking authentication...' : 'Loading Profile Data...'}</p>
        </div>
      );
  }

  if (error) {
     return (
        <div className={styles.pageContainer}>
          <ErrorMessage message={`Error loading profile: ${error}`} />
          <button onClick={fetchProfile} className={styles.retryButton}>Retry</button>
        </div>
      );
  }

  if (!user) { // Check if user is null after authLoading is false
       console.error("[EditProfilePage] render: User is null after authLoading is false.");
       // Redirect to login if auth check failed and user is null
       navigate('/login', { replace: true, state: { from: location.pathname } });
       return null; // Or return a message/spinner while redirecting
  }

  // Added a check for necessary profile data fields to render the form
  // This prevents rendering an empty form if fetchProfile somehow failed silently
  if (!displayName && !bio && !location && !currentProfilePictureUrl && !isPrivate) {
       console.warn("[EditProfilePage] render: Profile data fields are mostly empty after loading.");
       // You might want to add a specific message here or rely on the fetch error above
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
                    src={previewUrl || defaultAvatar}
                    alt="Avatar Preview"
                    className={styles.avatarPreviewLarge}
                    onClick={handleAvatarClick}
                    title="Click to change picture"
                />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" style={{ display: 'none' }} disabled={submitting} />
                 <button type="button" onClick={handleAvatarClick} className={styles.changePictureButton} disabled={submitting}> Change Picture </button>
            </div>
             <small className={styles.fieldHint}>Click the image or button to upload (Max 5MB: jpg, png, gif)</small>
        </div>

        {/* --- Text Fields --- */}
        <div className={styles.formGroup}>
          <label htmlFor="displayName">Display Name</label>
          <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength="50" placeholder="How you want to appear" disabled={submitting} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength="250" rows="4" placeholder="Tell us a bit about yourself" disabled={submitting}></textarea>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="location">Location</label>
          <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength="100" placeholder="Where are you based?" disabled={submitting} />
        </div>

         {/* --- Privacy Toggle --- */}
        <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
            <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate} // Controlled component based on state
                onChange={(e) => {
                   console.log("[EditProfilePage] Checkbox toggled. New value:", e.target.checked);
                   setIsPrivate(e.target.checked); // Update state on change
                }}
                disabled={submitting}
            />
            <label htmlFor="isPrivate" className={styles.checkboxLabel}>Make Profile Private</label>
             <small className={styles.fieldHint}>A private profile will not appear on the public users list, and only followers can see your connections and activities. Other users will still see your basic profile info (avatar, username, display name, bio, location).</small>
        </div>
        {/* --- END Privacy Toggle --- */}


        {/* --- Form Actions --- */}
        <div className={styles.formActions}>
          <button type="submit" disabled={submitting} className={styles.submitButton}>
            {submitting ? <LoadingSpinner size="small" inline /> : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(`/users/${user._id}`)} disabled={submitting} className={styles.cancelButton} > Cancel </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;
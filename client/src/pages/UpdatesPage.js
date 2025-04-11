// client/src/pages/UpdatesPage.js
import React from 'react';
import styles from './UpdatesPage.module.css'; // Optional: Create this file for styling
import { Helmet } from 'react-helmet-async';

const UpdatesPage = () => {
  // Get today's date for the latest update section
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={styles.updatesContainer || 'container'}> {/* Use styles or a default class */}
      <Helmet>
        <title>App Updates & Roadmap - MovieBooks</title>
        <meta name="description" content="Stay informed about the latest features, improvements, and future plans for the MovieBooks application." />
      </Helmet>

      <h1>MovieBooks: Updates & Roadmap</h1>
      <p style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          Tracking the evolution of MovieBooks, from initial features to the latest enhancements.
      </p>

      {/* --- LATEST UPDATE SECTION --- */}
      <section className={styles.updateSection}>
        <h2>🚀 Latest Update ({formattedDate})</h2>
        <p>We've just rolled out some exciting new features focused on user profiles and interaction:</p>
        <ul>
           <li><strong>Enhanced User Profiles:</strong> View richer profiles with Display Names, Bios, Locations, and Profile Pictures!</li>
           <li><strong>Profile Editing:</strong> Customize your own profile, including text details and uploading your own avatar via the "Edit Profile" page.</li>
           <li><strong>Clickable Notification Senders:</strong> Usernames within notification messages are now direct links to the sender's profile page.</li>
        </ul>
      </section>

      {/* --- PREVIOUS MILESTONES SECTION --- */}
      <section className={styles.updateSection}>
        <h2>✅ Previous Milestones (Before Latest Update)</h2>
        <p>Key features that were established and deployed earlier:</p>
        <ul>
            <li><strong>Sharing Enhancements:</strong> Implemented an improved share pop-up menu on connection cards and fixed default social media previews (site-wide logo and description).</li>
            <li><strong>Detail Pages:</strong> Launched dedicated pages for viewing individual Connections (`/connections/:id`), Movies (`/movies/:id`), and Books (`/books/:id`).</li>
            <li><strong>Core Interaction:</strong> Enabled users to Like and Comment on connections.</li>
            <li><strong>Notifications System (v1):</strong> Users started receiving notifications for likes/comments with basic mark-as-read functionality.</li>
            <li><strong>Filtering & Navigation:</strong> Introduced the persistent sidebar with tag-based filtering for the main feed.</li>
            <li><strong>Basic Profiles (v1):</strong> Initial profile pages showing user-created connections and a toggle for favorites.</li>
            <li><strong>Foundation:</strong> Established core user authentication (Login/Signup/Logout) and the ability to Create, Read, Update, and Delete connections.</li>
        </ul>
      </section>

      {/* --- FUTURE PLANS SECTION --- */}
      <section className={styles.updateSection}>
        <h2>💡 Future Plans & Ideas</h2>
        <p>We're always thinking ahead! Here's a glimpse of what we're considering or actively working on next:</p>
        <ul>
          <li><strong>Dynamic Social Media Previews:</strong> Making shared links for specific connections or profiles show relevant titles and images on social media.</li>
          <li><strong>Profile Enhancements (Phase 2):</strong> Adding tabs (e.g., "Created", "Favorites"), counts (connections, likes received), and potentially user activity feeds.</li>
          <li><strong>Advanced Search & Filtering:</strong> More powerful ways to search and filter connections, movies, and books.</li>
          <li><strong>Tagging System Improvements:</strong> Refining how tags are created, managed, and utilized.</li>
          <li><strong>User Roles & Permissions (Potential):</strong> Exploring different roles (e.g., moderators).</li>
          <li><strong>API Documentation (Potential):</strong> Publishing documentation for the MovieBooks API.</li>
          {/* Add more future plans here */}
        </ul>
        <p>Your feedback is valuable! Let us know if you have suggestions for future features.</p>
      </section>

    </div>
  );
};

export default UpdatesPage;
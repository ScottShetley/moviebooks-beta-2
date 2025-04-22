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

      {/* --- LATEST UPDATE SECTION (Discussion Hub) --- */}
      <section className={styles.updateSection}>
        <h2>💬 Latest Update ({formattedDate}) - Discussion Hub Enhancements!</h2>
        <p>The Connection Detail Page has been significantly enhanced to serve as a better discussion hub:</p>
        <ul>
            <li><strong>Direct Discussion Link:</strong> Added a clear "View Discussion" link with the comment count to each connection card on the main Feed, making it easy to jump straight to the conversation on the detail page.</li>
            <li><strong>Auto-Scrolling to Comments:</strong> Clicking the "View Discussion" link now automatically scrolls the page down to the comments section upon loading the detail page.</li>
            <li><strong>Improved Comment Display:</strong> Individual comments are now rendered using a dedicated component, featuring better styling, visual separation, and user avatars (if available).</li>
            <li><strong>Refined Comments Section Styling:</strong> Enhanced the layout, padding, and background of the overall comments area and the comment submission form for a cleaner look.</li>
            <li><strong>Edit Your Comments:</strong> Logged-in users can now easily edit the text of their own comments directly on the detail page.</li>
            <li><strong>Delete Your Comments:</strong> Logged-in users can now delete their own comments directly from the detail page.</li>
        </ul>
      </section>

      {/* --- PREVIOUS UPDATES SECTION --- */}
      <section className={styles.updateSection}>
        <h2>✅ Previous Updates</h2>

        {/* --- Feed Revamp & Fixes (Moved from Latest) --- */}
        <h3 className={styles.subHeading}>Feed Revamp & Fixes (Previous Major Update)</h3>
        <p>The main feed just got a significant upgrade and several usability fixes:</p>
        <ul>
            <li><strong>Text-Only Posts:</strong> You can now create connections with just context text, without needing to select a movie or book. Perfect for quick thoughts or general discussion!</li>
            <li><strong>Collapsible Cards:</strong> Standard connection cards (with movie/book) now appear collapsed by default on the feed, saving space. Click to expand and see the full details!</li>
            <li><strong>Text Post Deletion:</strong> Added the ability for users to delete their own text-only posts.</li>
            <li><strong>Consistent Card Layout:</strong> Ensured both standard and text-only cards have the same width for a cleaner look.</li>
            <li><strong>Placeholder Hiding:</strong> Removed the "No Screenshot Available" placeholder on standard cards when no context image is uploaded.</li>
            <li><strong>Share Button Fixes:</strong> The enhanced share pop-up now works correctly on text-only posts, and the visual layout is fixed on standard posts.</li>
            <li><strong>Mobile Layout Improvements:</strong> Adjusted the action button layout on standard cards for better usability on smaller screens.</li>
        </ul>


        {/* --- Profile Enhancements Update --- */}
        <h3 className={styles.subHeading}>User Profiles & Notifications (Older Update)</h3> {/* Changed heading text */}
        <p>Features rolled out before the Feed Revamp:</p> {/* Updated intro text */}
        <ul>
           <li><strong>Enhanced User Profiles:</strong> View richer profiles with Display Names, Bios, Locations, and Profile Pictures.</li>
           <li><strong>Profile Editing:</strong> Customize your own profile, including text details and uploading your own avatar via the "Edit Profile" page.</li>
           <li><strong>Clickable Notification Senders:</strong> Usernames within notification messages became direct links to the sender's profile page.</li>
        </ul>

        {/* --- Earlier Milestones --- */}
        <h3 className={styles.subHeading}>Earlier Milestones</h3>
        <p>Key features established before the Profile update:</p>
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

      {/* --- FUTURE PLANS SECTION (Unchanged) --- */}
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
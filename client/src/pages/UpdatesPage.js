// client/src/pages/UpdatesPage.js
import React from 'react';
import styles from './UpdatesPage.module.css'; // Optional: Create this file for styling
import { Helmet } from 'react-helmet-async';

const UpdatesPage = () => {
  // Removed the calculation for 'formattedDate' as it is no longer used.
  // const today = new Date();
  // const formattedDate = today.toLocaleDateString('en-US', {
  //   year: 'numeric',
  //   month: 'long',
  //   day: 'numeric'
  // });

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

      {/* --- LATEST UPDATE SECTION (Edit Connection & User Following Core) --- */}
      {/* Highlighting two major recently completed areas */}
       <section className={styles.updateSection}>
        {/* Removed formattedDate from the heading */}
        <h2>✨ Latest Progress - Edit Connection & User Following Core Implemented!</h2>
        <p>Significant milestones achieved, adding core features and interactivity:</p>
        <ul>
            {/* Edit Connection Details */}
            <li>
                <strong>Edit Your Connections:</strong> Authors can now access an "Edit" link on their connection's detail page. You can modify context, tags, book author, and replace the screenshot. Access is restricted to the original author. This completes the core CRUD for connections.
            </li>
            {/* User Following Details */}
            <li>
                <strong>User Following Core:</strong> The fundamental backend logic, database models, API routes, and initial frontend components for user following are now implemented and functional. Users can follow/unfollow others via the backend and notifications are generated for new followers.
            </li>
        </ul>
        <p>These additions bring important editing capabilities and lay the groundwork for social interactions like following!</p>
      </section>


      {/* --- PREVIOUS UPDATES SECTION --- */}
      <section className={styles.updateSection}>
        <h2>✅ Previous Updates</h2>

        {/* --- Notifications & Profiles --- */}
        <section>
          <h3 className={styles.subHeading}>🔔 Enhanced Notifications & Profiles</h3>
          <ul>
            <li><strong>Refined Notifications:</strong> The notification system now handles various types including likes, comments, favorites, and new followers. Display logic has been updated to correctly render messages for each type, including fixing a nested link warning in the notification list. Notifications are marked as read when viewed.</li>
            <li><strong>Updated Profile Viewing:</strong> Frontend navigation links (Header, Sidebar, Connection Cards, Comments) now consistently point to `/users/:userId` for viewing user profiles.</li>
             <li><strong>Enhanced User Profiles (v2):</strong> View richer profiles with Display Names, Bios, Locations, and Profile Pictures.</li>
             <li><strong>Profile Editing:</strong> Customize your own profile, including text details and uploading your own avatar via the "Edit Profile" page (`/profile/edit`).</li>
             <li><strong>Clickable Notification Senders:</strong> Usernames within notification messages are direct links to the sender's profile page.</li>
             <li><strong>Dedicated Notifications Page:</strong> A page (`/notifications`) to view all your recent notifications.</li>
          </ul>
        </section>

        {/* --- Search, Avatars, & Discussion Hub --- */}
        <section>
          <h3 className={styles.subHeading}>🔍 Search, Avatars & Discussion Hub</h3>
          <ul>
            <li><strong>Connection Search:</strong> A search bar allows finding connections by Movie Title, Book Title, Author, Director, Context, and Tags, with paginated results on a dedicated Search Page (`/search`).</li>
            <li><strong>User Avatars:</strong> Profile pictures are displayed next to the author's name on Feed Cards and next to comments on detail pages.</li>
            <li><strong>Discussion Hub Enhancements:</strong> The Connection Detail Page (`/connections/:id`) now features a "View Discussion" link on cards that scrolls to comments, improved comment display with dedicated components, and refined styling.</li>
            <li><strong>Edit/Delete Your Comments:</strong> Logged-in users can now edit and delete their own comments directly on the detail page.</li>
          </ul>
        </section>

        {/* --- Feed Revamp & Share Fixes --- */}
        <section>
           <h3 className={styles.subHeading}>📰 Feed Revamp & Share Fixes</h3>
           <ul>
               <li><strong>Text-Only Posts:</strong> Create connections with just context text, without needing a movie or book.</li>
               <li><strong>Collapsible Cards:</strong> Standard connection cards collapse by default on the feed to save space.</li>
               <li><strong>Text Post Deletion:</strong> Added the ability for users to delete their own text-only posts.</li>
               <li><strong>Consistent Card Layout:</strong> Ensured consistent width and layout for standard and text-only cards.</li>
               <li><strong>Enhanced Share Pop-up:</strong> Implemented an improved share pop-up menu on connection cards, working correctly on both standard and text-only posts.</li>
               <li><strong>Default Social Media Preview:</strong> Fixed the site-wide default logo and description displayed when sharing general site links.</li>
               <li><strong>Mobile Layout Improvements:</strong> Adjusted action button layout on standard cards for better mobile usability.</li>
           </ul>
        </section>


        {/* --- Foundation & Core Features --- */}
        <section>
          <h3 className={styles.subHeading}>🏗️ Foundation & Core Features</h3>
          <ul>
              <li><strong>Core Authentication:</strong> Implemented user Login, Signup, and Logout functionality.</li>
              <li><strong>Basic Connection Management:</strong> Users can Create, Read, and Delete their own connections.</li>
              <li><strong>Liking:</strong> Users can add and remove likes on connections.</li>
              <li><strong>Basic Comments:</strong> Users can create and read comments on connections.</li>
              <li><strong>Detail Pages (Initial):</strong> Basic pages for viewing individual Connections, Movies, and Books.</li>
              <li><strong>Filtering & Navigation:</strong> Introduced the persistent sidebar with tag-based filtering for the main feed.</li>
              <li><strong>Basic Profiles (v1):</strong> Initial profile pages showing user-created connections and a toggle for favorites.</li>
          </ul>
        </section>

      </section>

      {/* --- FUTURE PLANS SECTION --- */}
      <section className={styles.updateSection}>
        <h2>💡 Future Plans & Ideas</h2>
        <p>We're always thinking ahead! Here's a glimpse of what we're considering or actively working on next:</p>
        <ul>
          {/* Profile Enhancements (Phase 2) is now a key current task */}
          <li><strong>Profile Enhancements (Phase 2):</strong> Implementing section switching on user profiles to easily view 'Created Connections' vs. 'Favorited Connections', adding connection/like counts, and potentially more profile customization.</li>
          <li><strong>Refined User Following UI:</strong> Improving the user interface and experience for following/unfollowing, and potentially adding a dedicated 'Following Feed'.</li> {/* Moved from previous section, now a refinement task */}
          <li><strong>Dynamic Social Media Previews:</strong> Making shared links for specific connections or profiles show relevant titles and images on social media.</li>
          <li><strong>Refine Edit Connection:</strong> Add ability to explicitly remove existing screenshots, improve tag input, add more frontend validation.</li>
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
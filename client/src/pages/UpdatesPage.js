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

      {/* --- LATEST UPDATE SECTION (Edit Connection) --- */}
      {/* Making this the latest update as it's the most recently completed significant feature */}
       <section className={styles.updateSection}>
        <h2>✍️ Latest Update ({formattedDate}) - Edit Connection Feature Completed!</h2>
        <p>You can now edit your own connections directly from the site!</p>
        <ul>
            <li><strong>Edit Your Connections:</strong> Authors can now access an "Edit" link on their connection's detail page.</li>
            <li><strong>Editable Fields:</strong> Modify the Connection Context, update or add Tags, and even correct or add the Book Author associated with the connection.</li>
            <li><strong>Replace Screenshot:</strong> Easily upload a new image to replace the existing screenshot for your connection.</li>
            <li><strong>Authorization Guard:</strong> The edit page is protected, ensuring only the original author can access and modify their connection.</li>
        </ul>
        <p>This adds the final piece to the core CRUD functionality for connections!</p>
      </section>


      {/* --- PREVIOUS UPDATES SECTION --- */}
      <section className={styles.updateSection}>
        <h2>✅ Previous Updates</h2>

        {/* --- Discussion Hub Enhancements (Moved to Previous) --- */}
        <h3 className={styles.subHeading}>💬 Discussion Hub Enhancements</h3>
        <p>The Connection Detail Page has been significantly enhanced to serve as a better discussion hub:</p>
        <ul>
            <li><strong>Direct Discussion Link:</strong> Added a clear "View Discussion" link with the comment count to each connection card on the main Feed, making it easy to jump straight to the conversation on the detail page.</li>
            <li><strong>Auto-Scrolling to Comments:</strong> Clicking the "View Discussion" link now automatically scrolls the page down to the comments section upon loading the detail page.</li>
            <li><strong>Improved Comment Display:</strong> Individual comments are now rendered using a dedicated component, featuring better styling, visual separation, and user avatars (if available).</li>
            <li><strong>Refined Comments Section Styling:</strong> Enhanced the layout, padding, and background of the overall comments area and the comment submission form for a cleaner look.</li>
            <li><strong>Edit Your Comments:</strong> Logged-in users can now easily edit the text of their own comments directly on the detail page.</li>
            <li><strong>Delete Your Comments:</strong> Logged-in users can now delete their own comments directly from the detail page.</li>
        </ul>

        {/* --- Search & Avatar Features (Moved to Previous) --- */}
         <h3 className={styles.subHeading}>🔍 Search & Avatar Features</h3>
         <p>Exciting new features to help you find connections and personalize the experience:</p>
         <ul>
             <li><strong>Connection Search:</strong> A powerful new search bar in the header allows you to find connections based on Movie Title, Book Title, Author, Director, Context, and Tags, with paginated results on a dedicated Search Page.</li>
             <li><strong>User Avatars:</strong> Profile pictures are now displayed next to the author's name on Connection Feed Cards and next to comments on the detail pages, making the community feel more vibrant.</li>
         </ul>


        {/* --- Feed Revamp & Fixes (Moved from Latest) --- */}
        <h3 className={styles.subHeading}>Feed Revamp & Fixes</h3>
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
        <h3 className={styles.subHeading}>User Profiles & Notifications</h3> {/* Changed heading text */}
        <p>Features rolled out before the Feed Revamp:</p> {/* Updated intro text */}
        <ul>
           <li><strong>Enhanced User Profiles:</strong> View richer profiles with Display Names, Bios, Locations, and Profile Pictures.</li>
           <li><strong>Profile Editing:</strong> Customize your own profile, including text details and uploading your own avatar via the "Edit Profile" page.</li>
           <li><strong>Clickable Notification Senders:</strong> Usernames within notification messages became direct links to the sender's profile page.</li>
           <li><strong>Notification List:</strong> A dedicated page to view all your recent notifications.</li>
           <li><strong>Mark Notifications as Read:</strong> Notifications are now marked as read when viewed.</li>
        </ul>

        {/* --- Earlier Milestones --- */}
        <h3 className={styles.subHeading}>Earlier Milestones</h3>
        <p>Key features established before the Profile & Notification updates:</p>
        <ul>
            <li><strong>Sharing Enhancements:</strong> Implemented an improved share pop-up menu on connection cards and fixed default social media previews (site-wide logo and description).</li>
            <li><strong>Detail Pages:</strong> Launched dedicated pages for viewing individual Connections (`/connections/:id`), Movies (`/movies/:id`), and Books (`/books/:id`).</li>
            <li><strong>Core Interaction:</strong> Enabled users to Like and Comment on connections.</li>
            {/* Removed the old v1 Notifications entry as it's covered by the new Notifications section */}
            <li><strong>Filtering & Navigation:</strong> Introduced the persistent sidebar with tag-based filtering for the main feed.</li>
            <li><strong>Basic Profiles (v1):</strong> Initial profile pages showing user-created connections and a toggle for favorites.</li>
            <li><strong>Foundation:</strong> Established core user authentication (Login/Signup/Logout) and the ability to Create, Read, and Delete connections.</li> {/* Updated to reflect Update/Edit wasn't in v1 */}
        </ul>
      </section>

      {/* --- FUTURE PLANS SECTION (Unchanged) --- */}
      <section className={styles.updateSection}>
        <h2>💡 Future Plans & Ideas</h2>
        <p>We're always thinking ahead! Here's a glimpse of what we're considering or actively working on next:</p>
        <ul>
          <li><strong>Dynamic Social Media Previews:</strong> Making shared links for specific connections or profiles show relevant titles and images on social media.</li>
          <li><strong>Profile Enhancements (Phase 2):</strong> Adding tabs (e.g., "Created", "Favorites"), counts (connections, likes received), and potentially user activity feeds.</li>
          {/* Added a placeholder for refined Edit Connection features if you want to pursue them */}
          <li><strong>Refine Edit Connection:</strong> Add ability to explicitly remove existing screenshots, improve tag input, add more frontend validation.</li>
          <li><strong>Advanced Search & Filtering:</strong> More powerful ways to search and filter connections, movies, and books.</li>
          <li><strong>Tagging System Improvements:</strong> Refining how tags are created, managed, and utilized.</li>
          <li><strong>User Following:</strong> Allow users to follow other users and see their connections in a dedicated feed.</li> {/* Example of a new feature */}
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
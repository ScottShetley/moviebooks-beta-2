// client/src/pages/UpdatesPage.js
import React from 'react';
import styles from './UpdatesPage.module.css'; // Optional: Create this file for styling
import { Helmet } from 'react-helmet-async';

const UpdatesPage = () => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={styles.updatesContainer || 'container'}> {/* Use styles or a default class */}
      <Helmet>
        <title>App Updates & Roadmap - Movie-Books</title>
        <meta name="description" content="Stay informed about the latest features, improvements, and future plans for the Movie-Books application." />
        <link rel="canonical" href="https://movie-books.com/updates" />
        {/* OG/Twitter tags for UpdatesPage if desired - consistent with other pages */}
        <meta property="og:title" content="App Updates & Roadmap - Movie-Books" />
        <meta property="og:description" content="Stay informed about the latest features, improvements, and future plans for the Movie-Books application." />
        <meta property="og:url" content="https://movie-books.com/updates" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="App Updates & Roadmap - Movie-Books" />
        <meta name="twitter:description" content="Stay informed about the latest features, improvements, and future plans for the Movie-Books application." />
      </Helmet>

      <h1>Movie-Books: Updates & Roadmap</h1>
      <p style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          Tracking the evolution of Movie-Books, from initial features to the latest enhancements.
      </p>

      {/* --- LATEST UPDATE SECTION --- */}
      <section className={styles.updateSection}>
        <h2>✨ Latest Progress Highlights - {formattedDate} ✨</h2>

        {/* --- NEW: SEO Enhancements (Phase 2 - Technical SEO) --- */}
        <section>
          <h3 className={styles.subHeading}>🔍 SEO Enhancements (Phase 2 - Technical SEO)</h3>
          <ul>
            <li>
                <strong><code>robots.txt</code> Implemented:</strong> Added a <code>robots.txt</code> file to guide search engine crawlers, initially allowing full access to the site.
            </li>
            <li>
                <strong>Dynamic <code>sitemap.xml</code> Generation:</strong> Implemented a backend endpoint (<code>/sitemap.xml</code>) that dynamically generates an XML sitemap. This sitemap includes:
                <ul>
                    <li>Static pages (Home, About, Updates, All Users, Login, Signup).</li>
                    <li>All individual Connection pages.</li>
                    <li>All public User Profile pages.</li>
                    <li>All distinct Movie Detail pages.</li>
                    <li>All distinct Book Detail pages.</li>
                </ul>
            </li>
            <li>
                <strong>Sitemap Linked in <code>robots.txt</code>:</strong> Updated <code>robots.txt</code> to include the path to the newly generated <code>sitemap.xml</code>, improving discoverability for search engines.
            </li>
            <li>
                <strong>SEO for Static Pages:</strong> Ensured key static pages like the 'About Page' have appropriate dynamic page titles, meta descriptions, and canonical URLs using <code>react-helmet-async</code>.
            </li>
            <li>
                <strong>Initial SEO (Phase 1) Review:</strong> Confirmed existing SEO meta tags (titles, descriptions, Open Graph, Twitter Cards) on core dynamic pages (Homepage, Connection Detail, User Profiles, All Users, Movie/Book Detail) are functioning as expected.
            </li>
          </ul>
          <p>These technical SEO improvements help search engines better understand, crawl, and index Movie-Books content.</p>
        </section>
        {/* --- END NEW --- */}

        {/* --- Production Launch & Stability (Previous Latest) --- */}
        <section>
          <h3 className={styles.subHeading}>🚀 Production Launch on movie-books.com & Stability</h3>
          <ul>
            <li>
                <strong>Launched on movie-books.com:</strong> The application is now live and accessible at its official custom domain: <a href="https://movie-books.com" target="_blank" rel="noopener noreferrer">https://movie-books.com</a>.
            </li>
            <li>
                <strong>HTTPS/SSL Enabled:</strong> The site is secured with HTTPS, ensuring a safe and encrypted connection for all users.
            </li>
             <li>
                <strong>Seamless Single Service Deployment:</strong> Successfully configured the Render service to efficiently handle both the backend API and serve the built frontend files from a single Node.js service in production.
            </li>
            <li>
                <strong>Improved Build & Runtime Stability:</strong> Resolved various deployment errors, ensuring the build process completes correctly and the application runs reliably on Render.
            </li>
            <li>
                <strong>API Connectivity Resolved:</strong> Addressed issues preventing the frontend from communicating with the backend API after the domain change.
            </li>
             <li>
                <strong>Uptime Monitoring Configured:</strong> Updated UptimeRobot to monitor the correct production URL.
            </li>
          </ul>
        </section>
        {/* --- END Production Launch --- */}

        {/* --- Profile Privacy & Public User List (Previous Latest) --- */}
        <section>
          <h3 className={styles.subHeading}>🔒 Profile Privacy & Public Users List</h3>
          <ul>
            <li>
                <strong>Profile Privacy Toggle & Reliable Saving.</strong>
            </li>
            <li>
                <strong>Privacy Enforcement for profiles and connections.</strong>
            </li>
             <li>
                <strong>Public Users List (<code>/all-users</code>) implemented.</strong>
            </li>
          </ul>
        </section>
        {/* --- END Profile Privacy --- */}

        {/* --- Edit Connection & User Following Core (Previous Latest) --- */}
        <section>
          <h3 className={styles.subHeading}>✍️ Edit Connection & 👥 User Following Core</h3>
          <ul>
            <li>
                <strong>Edit Your Connections:</strong> Authors can now modify context, tags, book author, and replace screenshots.
            </li>
            <li>
                <strong>User Following Core:</strong> Backend logic, database models, API routes, and initial frontend components implemented.
            </li>
        </ul>
        </section>
        {/* --- END Edit Connection --- */}
      </section>

      {/* --- PREVIOUS UPDATES SECTION --- */}
      <section className={styles.updateSection}>
        <h2>✅ Previous Updates</h2>
        <section>
          <h3 className={styles.subHeading}>🔔 Enhanced Notifications & Profiles</h3>
          {/* ... (keep existing content, truncated for brevity) ... */}
        </section>
        <section>
          <h3 className={styles.subHeading}>🔍 Search, Avatars & Discussion Hub</h3>
          {/* ... (keep existing content, truncated for brevity) ... */}
        </section>
        <section>
           <h3 className={styles.subHeading}>📰 Feed Revamp & Share Fixes</h3>
           {/* ... (keep existing content, truncated for brevity) ... */}
        </section>
        <section>
          <h3 className={styles.subHeading}>🏗️ Foundation & Core Features</h3>
          {/* ... (keep existing content, truncated for brevity) ... */}
        </section>
      </section>

      {/* --- FUTURE PLANS SECTION --- */}
      <section className={styles.updateSection}>
        <h2>💡 Future Plans & Ideas</h2>
        <p>We're always thinking ahead! Here's a glimpse of what we're considering or actively working on next:</p>
        <ul>
          <li><strong>Profile Enhancements (Phase 2):</strong> Further profile customization options.</li>
          <li><strong>Refined User Following UI:</strong> Improving the user interface and experience.</li>
          <li><strong>Profile Section Switching/Counts:</strong> Enhancing profile page with different sections and counts.</li>
          {/* Dynamic Social Media Previews is now largely covered by OG tags, but specific image generation per connection could be a future thing */}
          <li><strong>Advanced Social Media Previews:</strong> Potentially generating unique preview images for shared connections.</li>
          <li><strong>Refine Edit Connection:</strong> Add ability to explicitly remove existing screenshots, improve tag input, add more frontend validation.</li>
          <li><strong>Advanced Search & Filtering:</strong> More powerful ways to search and filter.</li>
          <li><strong>Tagging System Improvements:</strong> Refining tag creation, management, and utilization.</li>
          <li><strong>User Roles & Permissions (Potential):</strong> Exploring different roles.</li>
          <li><strong>API Documentation (Potential):</strong> Publishing documentation for the API.</li>
          <li><strong>Long-Term SEO:</strong> Explore options like pre-rendering or SSR if client-side rendering proves insufficient for certain crawlers or social media previews.</li>
        </ul>
        <p>Your feedback is valuable! Let us know if you have suggestions for future features.</p>
      </section>
    </div>
  );
};

export default UpdatesPage;
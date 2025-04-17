// client/src/pages/AboutPage/AboutPage.js
import React from 'react';
import styles from './AboutPage.module.css'; // Import styles for this page

/**
 * Renders the static "About" page content.
 * Provides information about the purpose and features of the MovieBooks application.
 */
const AboutPage = () => {
    return (
        // Main container div for the about page content, styled using CSS Modules
        <div className={styles.aboutContainer}>
            {/* Page Heading */}
            <h1>About MovieBooks</h1>

            {/* Introductory paragraph */}
            <p>
                MovieBooks is a platform dedicated to exploring the fascinating connections
                between literature and film.
            </p>

            {/* Paragraph explaining the concept */}
            <p>
                Have you ever spotted a character reading a specific book in a movie and
                wondered about its significance? Or noticed thematic parallels between a
                film's plot and a classic novel? MovieBooks aims to be the definitive
                resource for documenting these instances.
            </p>

            {/* Paragraph detailing user interactions */}
            <p>
                Users can create "connections" linking a movie and a book, providing
                context, insights, screenshots, and links to the relevant works. Engage
                with the community by commenting on connections, liking your favorites,
                and discovering new literary links in cinema.
            </p>

            {/* Paragraph mentioning the beta status */}
            <p>
                This project is currently in Beta. We appreciate your contributions and
                feedback!
            </p>

            {/* Placeholder comment indicating where more content could be added if needed */}
            {/* Add more content as desired */}
        </div>
    );
};

export default AboutPage;

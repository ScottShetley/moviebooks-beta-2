// client/src/pages/HelpPage/HelpPage.js
import React from 'react';
import styles from './HelpPage.module.css'; // Import styles for this page

/**
 * Renders the static "Help / FAQ" page content.
 * Provides answers to common questions about using the MovieBooks application.
 */
const HelpPage = () => {
    return (
        // Main container div for the help page content, styled using CSS Modules
        <div className={styles.helpContainer}>
            {/* Page Heading */}
            <h1>Help / FAQ</h1>

            {/* Section for Getting Started questions */}
            <section>
                <h2>Getting Started</h2>
                <p><strong>How do I create an account?</strong> Click the "Signup" button in the header and fill out the required fields (email, username, password).</p>
                <p><strong>How do I add a new Connection?</strong> Once logged in, click the "+ Add New" button in the header. Fill in the movie title, book title, your context/description, and optionally upload relevant images (poster, cover, screenshot) and add tags or details like genre, director, etc.</p>
            </section>

            {/* Section for Feed usage questions */}
            <section>
                <h2>Using the Feed</h2>
                <p><strong>How do the filters work?</strong> Use the input fields at the top of the Feed page to search for connections based on tags, movie details (genre, director, actor), or book details (genre, author). Enter your terms (comma-separate multiple tags/genres/actors) and click "Apply Filters". Click "Clear All Filters" to reset.</p>
                <p><strong>What are Likes and Favorites?</strong> Click the heart icon (♡) to "Like" a connection. Click the star icon (☆) to add a connection to your personal "Favorites" list (visible on your profile).</p>
                <p><strong>How do comments work?</strong> Click the comment bubble icon on a connection card to view comments or add your own. You must be logged in to comment.</p>
            </section>

            {/* Section for Profile page questions */}
             <section>
                <h2>My Profile</h2>
                <p><strong>What's on my profile page?</strong> Your profile page (accessed via "My Profile" in the header) displays your username, lists all the connections you have created, and shows connections you have favorited.</p>
            </section>

            {/* Section for Contact/Feedback information */}
            {/* Add more Q&A sections as needed */}
            <section>
                 <h2>Contact / Feedback</h2>
                <p>Having trouble or have a suggestion? Please reach out via [Your preferred contact method - e.g., GitHub Issues link, email address - to be added later].</p>
            </section>
        </div>
    );
};

export default HelpPage;

// client/src/pages/HelpPage/HelpPage.js
import React from 'react';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import styles from './HelpPage.module.css';

const HelpPage = () => {
    const pageTitle = "Help & FAQ - Movie-Books";
    const metaDescription = "Find answers to frequently asked questions about using Movie-Books. Learn how to create connections, use filters, manage your profile, and more.";
    const pageUrl = "https://movie-books.com/help"; // Define the canonical URL

    return (
        <>
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={metaDescription} />
                <link rel="canonical" href={pageUrl} />
                {/* Basic OG/Twitter Tags for Help Page */}
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:url" content={pageUrl} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={metaDescription} />
            </Helmet>
            <div className={styles.helpContainer}>
                <h1>Help / FAQ</h1>

                <section>
                    <h2>Getting Started</h2>
                    <p><strong>How do I create an account?</strong> Click the "Signup" button in the header and fill out the required fields (email, username, password).</p>
                    <p><strong>How do I add a new Connection?</strong> Once logged in, click the "+ Add New" button in the header. Fill in the movie title, book title, your context/description, and optionally upload relevant images (poster, cover, screenshot) and add tags or details like genre, director, etc.</p>
                </section>

                <section>
                    <h2>Using the Feed</h2>
                    <p><strong>How do the filters work?</strong> Use the input fields at the top of the Feed page to search for connections based on tags, movie details (genre, director, actor), or book details (genre, author). Enter your terms (comma-separate multiple tags/genres/actors) and click "Apply Filters". Click "Clear All Filters" to reset.</p>
                    <p><strong>What are Likes and Favorites?</strong> Click the heart icon (♡) to "Like" a connection. Click the star icon (☆) to add a connection to your personal "Favorites" list (visible on your profile).</p>
                    <p><strong>How do comments work?</strong> Click the comment bubble icon on a connection card to view comments or add your own. You must be logged in to comment.</p>
                </section>

                <section>
                    <h2>My Profile</h2>
                    <p><strong>What's on my profile page?</strong> Your profile page (accessed via "My Profile" in the header) displays your username, lists all the connections you have created, and shows connections you have favorited.</p>
                </section>

                {/* Add more Q&A sections as needed */}
                <section>
                    <h2>Contact / Feedback</h2>
                    <p>
                        Having trouble, have a suggestion, or just want to say hello? 
                        Please reach out to us at: <a href="mailto:contact@movie-books.com">contact@movie-books.com</a>.
                    </p>
                </section>
            </div>
        </>
    );
};

export default HelpPage;
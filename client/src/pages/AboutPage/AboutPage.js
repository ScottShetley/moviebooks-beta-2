// client/src/pages/AboutPage/AboutPage.js
import React from 'react';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import styles from './AboutPage.module.css';

const AboutPage = () => {
    const pageTitle = "About Movie-Books | Discover Literary Connections in Film";
    const metaDescription = "Learn about Movie-Books, the platform for documenting and exploring books featured in movies. Discover our mission and join the community.";

    return (
        <> {/* Use a Fragment to wrap Helmet and the page content */}
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={metaDescription} />
                {/* You can also add Open Graph and Twitter Card tags here if desired,
                    though for an 'About' page, title and description are often sufficient.
                    Example:
                    <meta property="og:title" content={pageTitle} />
                    <meta property="og:description" content={metaDescription} />
                    <meta property="og:url" content="https://movie-books.com/about" />
                    <meta property="og:type" content="website" />
                    <meta name="twitter:card" content="summary" />
                    <meta name="twitter:title" content={pageTitle} />
                    <meta name="twitter:description" content={metaDescription} />
                */}
                <link rel="canonical" href="https://movie-books.com/about" />
            </Helmet>
            <div className={styles.aboutContainer}>
                <h1>About Movie-Books</h1>
                <p>
                    Movie-Books is a platform dedicated to exploring the fascinating connections
                    between literature and film.
                </p>
                <p>
                    Have you ever spotted a character reading a specific book in a movie and
                    wondered about its significance? Or noticed thematic parallels between a
                    film's plot and a classic novel? Movie-Books aims to be the definitive
                    resource for documenting these instances.
                </p>
                <p>
                    Users can create "connections" linking a movie and a book, providing
                    context, insights, screenshots, and links to the relevant works. Engage
                    with the community by commenting on connections, liking your favorites,
                    and discovering new literary links in cinema.
                </p>
                <p>
                    This project is currently in Beta. We appreciate your contributions and
                    feedback!
                </p>
                {/* Add more content as desired */}

                <p className={styles.contactInfo || ''}> {/* Added an optional class for styling */}
                    For any inquiries, feedback, or suggestions, please feel free to contact us at: <a href="mailto:contact@movie-books.com">contact@movie-books.com</a>.
                </p>
                
                {/*
                // Uncomment or add a footer if needed, updating the name here too:
                // <footer className={styles.aboutFooter}>
                //    <p>© {new Date().getFullYear()} Movie-Books. All rights reserved.</p>
                // </footer>
                */}
            </div>
        </>
    );
};

export default AboutPage;
// client/src/pages/AboutPage/AboutPage.js
import React from 'react';
import styles from './AboutPage.module.css';

const AboutPage = () => {
    return (
        <div className={styles.aboutContainer}>
            <h1>About MovieBooks</h1>
            <p>
                MovieBooks is a platform dedicated to exploring the fascinating connections
                between literature and film.
            </p>
            <p>
                Have you ever spotted a character reading a specific book in a movie and
                wondered about its significance? Or noticed thematic parallels between a
                film's plot and a classic novel? MovieBooks aims to be the definitive
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
        </div>
    );
};

export default AboutPage;
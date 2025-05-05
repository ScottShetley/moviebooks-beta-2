// client/src/pages/AboutPage/AboutPage.js
import React from 'react';
import styles from './AboutPage.module.css';

const AboutPage = () => {
    return (
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
             {/*
             // Uncomment or add a footer if needed, updating the name here too:
             // <footer className={styles.aboutFooter}>
             //    <p>© {new Date().getFullYear()} Movie-Books. All rights reserved.</p>
             // </footer>
             */}
        </div>
    );
};

export default AboutPage;
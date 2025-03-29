import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';
import Button from '../../components/Common/Button/Button'; // Adjust path if your Button component is elsewhere

const LandingPage = () => {
    return (
        <div className={styles.landingContainer}>
            <header className={styles.heroHeader}>
                <h1>Welcome to MovieBooks!</h1>
                <p className={styles.subtitle}>
                    Where Cinema Meets Literature
                </p>
            </header>

            <section className={styles.aboutSection}>
                <h2>What is MovieBooks?</h2>
                <p>
                    MovieBooks is a specialized platform dedicated to documenting, discovering,
                    and discussing books that appear within movies – whether they're subtle props,
                    significant plot elements, or meaningful references.
                </p>
                <p>
                    Join our community to connect movies with the books featured in them,
                    share context, add images, and explore the fascinating intersection
                    of film and literature.
                </p>
                {/* Optional: Add an image or graphic here */}
                {/* <img src="/path/to/your/graphic.svg" alt="MovieBooks Concept" className={styles.conceptImage} /> */}
            </section>

            <section className={styles.ctaSection}>
                <h2>Ready to Explore?</h2>
                <div className={styles.buttonGroup}>
                    <Link to="/signup" className={styles.linkNoUnderline}>
                        {/* If using a custom Button component */}
                        <Button >Get Started (Sign Up)</Button>
                        {/* If using a standard button - uncomment below and CSS */}
                        {/* <button className={styles.ctaButton}>Get Started (Sign Up)</button> */}
                    </Link>
                    <span className={styles.orText}>or</span>
                    <Link to="/login" className={styles.linkNoUnderline}>
                        {/* If using a custom Button component */}
                        <Button variant="secondary">Log In</Button>
                        {/* If using a standard button - uncomment below and CSS */}
                        {/* <button className={`${styles.ctaButton} ${styles.loginButton}`}>Log In</button> */}
                    </Link>
                </div>
            </section>

             {/* Optional Footer or additional sections */}
             {/*
             <footer className={styles.landingFooter}>
                 <p>© {new Date().getFullYear()} MovieBooks. All rights reserved.</p>
             </footer>
             */}
        </div>
    );
};

export default LandingPage;
// client/src/pages/LandingPage/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom'; // Used for navigation without full page reloads
import styles from './LandingPage.module.css'; // Import styles for this page
import Button from '../../components/Common/Button/Button'; // Import the reusable Button component

/**
 * Renders the landing page for unauthenticated users.
 * Provides a brief introduction to the application and calls to action (Signup/Login).
 */
const LandingPage = () => {
    return (
        // Main container for the landing page content
        <div className={styles.landingContainer}>
            {/* Hero section with the main heading and subtitle */}
            <header className={styles.heroHeader}>
                <h1>Welcome to MovieBooks!</h1>
                <p className={styles.subtitle}>
                    Where Cinema Meets Literature
                </p>
            </header>

            {/* Section describing the application */}
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
                {/* Optional: Placeholder for an image or graphic */}
                {/* <img src="/path/to/your/graphic.svg" alt="MovieBooks Concept" className={styles.conceptImage} /> */}
            </section>

            {/* Call to Action (CTA) section with Signup and Login buttons */}
            <section className={styles.ctaSection}>
                <h2>Ready to Explore?</h2>
                {/* Group containing the buttons and 'or' text */}
                <div className={styles.buttonGroup}>
                    {/* Link component wraps the Button for client-side routing to the signup page */}
                    <Link to="/signup" className={styles.linkNoUnderline}>
                        {/* Use the reusable Button component (default primary variant) */}
                        <Button>Get Started (Sign Up)</Button>
                    </Link>
                    {/* Simple text separator */}
                    <span className={styles.orText}>or</span>
                    {/* Link component wraps the Button for client-side routing to the login page */}
                    <Link to="/login" className={styles.linkNoUnderline}>
                        {/* Use the reusable Button component with the 'secondary' variant */}
                        <Button variant="secondary">Log In</Button>
                    </Link>
                </div>
            </section>

             {/* Optional Footer section - currently commented out */}
             {/*
             <footer className={styles.landingFooter}>
                 <p>© {new Date().getFullYear()} MovieBooks. All rights reserved.</p>
             </footer>
             */}
        </div>
    );
};

export default LandingPage;

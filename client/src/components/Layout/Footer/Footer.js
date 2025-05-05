// client/src/components/Layout/Footer/Footer.js
import React from 'react';
import styles from './Footer.module.css'; // Import CSS module

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* Use the container class for centering content if needed, or style directly */}
      <div className="container">
        <p>
          © {currentYear} Movie-Books BETA. All Rights Reserved (sort of). {/* Updated name here */}
          {/* Example Link */}
          {/* | <a href="/about">About</a> */}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
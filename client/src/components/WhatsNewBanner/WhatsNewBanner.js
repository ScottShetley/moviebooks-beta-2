import React from 'react';
import { Link } from 'react-router-dom';
import styles from './WhatsNewBanner.module.css';

const WhatsNewBanner = ({ onDismiss, updateMessage, updatesPageLink = "/updates" }) => {
  return (
    <div className={styles.bannerContainer}>
      <p className={styles.updateText}>
        {updateMessage}
        <Link to={updatesPageLink} className={styles.learnMoreLink}>
          Learn More
        </Link>
      </p>
      <button onClick={onDismiss} className={styles.dismissButton}>
        ×
      </button>
    </div>
  );
};

export default WhatsNewBanner;
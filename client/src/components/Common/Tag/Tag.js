// client/src/components/Common/Tag/Tag.js
import React from 'react';
import PropTypes from 'prop-types';
import styles from './Tag.module.css';

/**
 * A simple reusable component to display a tag.
 * Can be wrapped in a Link or Button for interactivity.
 */
const Tag = ({ tag, className }) => {
  if (!tag) return null;

  // Combine default styles with any passed-in className
  const tagClasses = `${styles.tag} ${className || ''}`;

  return (
    <span className={tagClasses}>
      #{tag}
    </span>
  );
};

Tag.propTypes = {
  tag: PropTypes.string.isRequired,
  className: PropTypes.string, // Optional custom class
};

export default Tag;
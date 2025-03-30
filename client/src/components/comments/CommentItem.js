// client/src/components/Comment/CommentItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './CommentItem.module.css';

const CommentItem = ({ comment }) => {
    // Basic check for required comment data
    if (!comment || !comment.user || !comment.user.username || !comment.text || !comment.createdAt) {
        console.error("CommentItem received incomplete data:", comment);
        return <li className={styles.commentItem}>Error: Invalid comment data.</li>;
    }

    const { user, text, createdAt } = comment;

    return (
        <li className={styles.commentItem}>
            <div className={styles.commentHeader}>
                <Link to={`/profile/${user._id}`} className={styles.username}>
                    {user.username}
                </Link>
                <span className={styles.timestamp}>
                    {new Date(createdAt).toLocaleString()} {/* Show date and time */}
                </span>
            </div>
            <p className={styles.commentText}>{text}</p>
        </li>
    );
};

export default CommentItem;
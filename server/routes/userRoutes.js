// server/routes/userRoutes.js
const express = require('express');
const {
    getUserProfile,
    getUserConnections
} = require('../controllers/userController.js');
const { protect } = require('../middleware/authMiddleware.js'); // Need protect for 'me' route

const router = express.Router();

// --- Routes for '/api/users' ---

// GET /api/users/me: Get the profile of the currently logged-in user (Private)
// Uses 'me' as a specific identifier instead of an ID
router.get('/me', protect, getUserProfile);

// GET /api/users/:userId/connections: Get connections for a specific user profile (Public)
// This route uses a dynamic parameter :userId
router.get('/:userId/connections', getUserConnections);

// Could add routes later for updating user profile, getting user list (admin), etc.

module.exports = router;
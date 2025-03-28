// server/utils/generateToken.js
const jwt = require('jsonwebtoken');

// Function to generate a JWT token for a user ID
const generateToken = (id) => {
  // Sign the token with the user ID payload, your JWT secret, and expiration time
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token will expire in 30 days
  });
};

module.exports = generateToken;
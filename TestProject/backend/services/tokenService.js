const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Generate JWT token
const generateJWT = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
};

// Verify JWT token
const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Generate UUID for share links
const generateShareToken = () => {
  return uuidv4();
};

module.exports = {
  generateJWT,
  verifyJWT,
  generateShareToken
};

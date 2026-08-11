// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../../utils/jwtUtils');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = verifyToken(token.replace('BEARER ', '')); 
    req.userId = decoded.userId; 
    req.userMail = decoded.userMail;
    next();
  } catch (error) {
    console.error("Failed to verify token : ", error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = { authenticate };

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wannaChat_dev_secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '6h';

const generateToken = (userId, userMail) => {
  return jwt.sign({ userId, userMail }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };

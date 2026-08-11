// src/routes/chatRoutes.js
const express = require('express');
const multer = require('multer');
const { register, login } = require('../controllers/authController');
const { createChatRoom, listChatRooms, getChatMessages } = require('../controllers/chatController');
const { uploadImage } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/register', register);
router.post('/login', login);

router.post('/chat', authenticate, createChatRoom);
router.get('/chat', authenticate, listChatRooms);
router.get('/chat/:id/messages', authenticate, getChatMessages);

router.post('/upload', authenticate, upload.single('image'), uploadImage);

module.exports = router;

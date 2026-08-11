// src/database/connection.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/wannaChat';

async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');
}

module.exports = { connectDB };

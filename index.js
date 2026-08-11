// index.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { Redis } = require('ioredis');
const chatRoutes = require('./src/routes/chatRoutes');
const socketHandler = require('./src/handlers/socketHandler');
const { startServer, handleShutdown } = require('./src/handlers/serverHandler');
const { startWorker } = require('./src/queue/messageWorker');
const { REDIS_URL, isTLS } = require('./utils/redisConfig');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Socket.io Redis Adapter for horizontal scaling
const redisOpts = isTLS ? { tls: { rejectUnauthorized: false } } : {};
const pubClient = new Redis(REDIS_URL, redisOpts);
const subClient = pubClient.duplicate({ ...redisOpts, enableReadyCheck: false });

pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err.message));
subClient.on('error', (err) => console.error('Redis Sub Client Error:', err.message));

io.adapter(createAdapter(pubClient, subClient));
console.log('Socket.io Redis Adapter attached');

const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use('/api', chatRoutes);
app.use(express.static('public'));

// Socket handler
socketHandler(io);

// Start bullmq worker
startWorker();

// Connect to mongo and start
(async () => {
    const srv = await startServer(PORT, server);
    await handleShutdown(srv);
})();

// server_handler.js
const mongoose = require('mongoose');
const { connectDB } = require('../database/connection');

async function withRetry(operation, { retries = 10, delayMs = 2000 } = {}) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt === retries) {
                throw error;
            }

            console.warn(`Startup retry ${attempt + 1}/${retries} failed: ${error.message}`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    throw lastError;
}

async function startServer(PORT, server) {
    try {
        await withRetry(() => connectDB(), { retries: 15, delayMs: 2000 });
        console.log('MongoDB connection established');
        await new Promise((resolve, reject) => {
            server.listen(PORT, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                console.log(`Server is running on http://localhost:${PORT}`);
                resolve();
            });
        });
        return server; 
    } catch (error) {
        console.error('Error starting server:', error.message);
        throw error;
    }
}

async function handleShutdown(server) {
    process.on('SIGINT', () => {
        console.log('Received SIGINT signal (Ctrl+C)');
        mongoose.disconnect()
            .then(() => {
                console.log('Closed MongoDB connection');
                server.close(() => {
                    console.log('Server is shutting down gracefully');
                    process.exit(0);
                });
            })
            .catch((err) => {
                console.error('Error closing MongoDB connection:', err);
                server.close(() => {
                    console.error('Server is shutting down abruptly');
                    process.exit(1);
                });
            });
    });
}

module.exports = {
    startServer,
    handleShutdown,
    withRetry,
};
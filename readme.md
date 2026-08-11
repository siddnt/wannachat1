# wannaChat
============

## Introduction
A production-ready, horizontally scalable real-time chat application built with Node.js, Socket.io, Redis, MongoDB, and BullMQ. 

Designed for high performance and low latency, wannaChat uses a multi-layered architecture to process real-time interactions efficiently. It features a distributed WebSocket setup behind an Nginx reverse proxy with sticky sessions, allowing it to scale effortlessly across multiple nodes.

## Features
- **Sleek Dark Mode UI:** Built with Tailwind CSS for a premium, responsive experience.
- **Secure Authentication:** JWT-based login and registration with encrypted passwords.
- **Real-Time Messaging:** Instantaneous message delivery using Socket.io.
- **Horizontal Scalability:** Multi-server WebSocket synchronization using `@socket.io/redis-adapter`.
- **Async Data Persistence:** Non-blocking database writes powered by BullMQ background workers.
- **Low Latency Caching:** Fast message retrieval and active user tracking via Redis.
- **Room-Based Chat:** Create or join dynamic chat rooms instantly.

## Table of Contents
- [Architecture](#architecture)
- [Installation (Docker)](#installation-docker)
- [Local Development](#local-development)
- [API Endpoints](#api-endpoints)

---

## Architecture

wannaChat is built to handle production loads without blocking the main event loop.

1. **Load Balancing:** An Nginx reverse proxy sits at the edge (Port 80) and uses `ip_hash` to maintain sticky sessions across multiple Node.js backend replicas.
2. **Real-Time Layer:** Socket.io handles WebSockets. The Redis Adapter ensures that if a user on Node A sends a message to a room, it is instantly broadcasted to users connected to Node B and Node C.
3. **Caching Layer:** Redis is used to track online users and cache recent messages for sub-millisecond retrieval.
4. **Persistence Layer:** Instead of directly writing to MongoDB during a chat event, the Node server pushes a job to a BullMQ queue. A background worker picks up the job and safely persists the message to MongoDB, keeping WebSocket latency near zero.

---

## Quick Start (Zero Config)

The absolute easiest way to test wannaChat is using Docker. I've built smart fallbacks into the code, meaning you don't even need to configure a `.env` file to get started—everything works right out of the box!

1. Clone the repository to your local machine.
2. Spin up the entire multi-server cluster (Nginx, MongoDB, Redis, and 3 Node.js backend replicas) with one command:
   ```bash
   docker-compose up -d --build --scale node-app=3
   ```
3. Open your browser and navigate to `http://localhost`.

*Note: If you want to connect to your own cloud databases instead of the local Docker ones, just create a `.env` file and add your `MONGO_URI` and `REDIS_URL`.*

---

## Local Development

If you prefer to run the application directly without Docker (connecting directly to your cloud databases):

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Update the `.env` file with your connection strings.
3. Start the application:
   ```bash
   node index.js
   ```
4. Access the app at `http://localhost:5000`.

---

## API Endpoints

The backend exposes the following REST endpoints alongside the WebSocket connections:

- `POST /api/register` - Register a new user
- `POST /api/login` - Authenticate and receive a JWT
- `POST /api/chat` - Create a new chat room
- `GET /api/chat` - List all available chat rooms
- `GET /api/chat/:id/messages` - Retrieve historical messages for a specific room

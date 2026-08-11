// utils/redisConfig.js
// Centralised Redis connection config with Upstash TLS auto-detection.
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const isTLS = REDIS_URL.startsWith('rediss://');

// For the `redis` v4 npm package (redisUtils.js)
function getRedisClientOptions() {
  const opts = { url: REDIS_URL };
  if (isTLS) {
    opts.socket = { tls: true, rejectUnauthorized: false };
  }
  return opts;
}

// For BullMQ (ioredis-format connection object)
function getBullMQConnection() {
  const parsed = new URL(REDIS_URL);
  const opts = {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    maxRetriesPerRequest: null, // Required by BullMQ
  };
  if (parsed.password) opts.password = decodeURIComponent(parsed.password);
  if (parsed.username && parsed.username !== 'default') opts.username = parsed.username;
  if (isTLS) opts.tls = {};
  return opts;
}

module.exports = { REDIS_URL, isTLS, getRedisClientOptions, getBullMQConnection };

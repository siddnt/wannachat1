// src/queue/messageQueue.js
const { Queue } = require('bullmq');
const { getBullMQConnection } = require('../../utils/redisConfig');

const messageQueue = new Queue('message-saving-queue', {
  connection: getBullMQConnection(),
});

async function enqueueMessage(payload) {
  await messageQueue.add('save-message', payload, {
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}

module.exports = { messageQueue, enqueueMessage };

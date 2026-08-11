// src/queue/messageWorker.js
const { Worker } = require('bullmq');
const { getBullMQConnection } = require('../../utils/redisConfig');
const { saveMessage } = require('../repos/chatRoom');

let worker;

function startWorker() {
  worker = new Worker(
    'message-saving-queue',
    async (job) => {
      const { messageText, userMail, userName, isEvent, roomName, imageUrl } = job.data;
      console.log(`[Worker] Processing job ${job.id}: saving message to MongoDB`);
      await saveMessage(messageText, userMail, userName, isEvent, roomName, imageUrl);
      console.log(`[Worker] Job ${job.id} completed`);
    },
    {
      connection: getBullMQConnection(),
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err.message);
  });

  console.log('[Worker] BullMQ message-saving worker started');
  return worker;
}

async function stopWorker() {
  if (worker) {
    await worker.close();
    console.log('[Worker] BullMQ worker stopped');
  }
}

module.exports = { startWorker, stopWorker };

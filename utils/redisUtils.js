// utils/redisUtils.js
const redis = require('redis');
const math = require('math');
const { getRedisClientOptions } = require('./redisConfig');

const client = redis.createClient(getRedisClientOptions());

client.on('error', err => {
  console.log('Redis Client Error ', err);
});

client.connect().then(async () => {
  console.log('Successfully connected to Redis server!');

  process.on('SIGINT', () => {
    client.quit()
        .then(() => console.log('Disconnected from Redis server'))
        .catch(err => console.error('Error disconnecting from Redis: ', err));
  });
}).catch(err => {
  console.error('Error connecting to Redis:', err);
  process.exit(1);
});

async function saveMessageToRedis(roomName, message) {
  console.log("--------A message landed for Redis --------- ");
  const key = `room_name_${roomName}`;
  try {
    const res1 = await client.lPush(key, JSON.stringify(message));
    if (res1 === 0) {
      console.log("Could not set data to redis")
    } else {
      console.log("Set data to redis under key ", key)
    }
  } catch (error) {
    console.error("Error saving message to Redis:", error);
  }
}

async function cacheRecentMessages(roomName, messages) {
  const messageData = messages.map((message) => JSON.stringify(message));
  const key = `room_name_${roomName}`;
  try {
    for (const message of messageData) {
      const res1 = await client.rPush(key, message);
      if (res1 === 0) {
        console.log("Could not set data to redis")
      } else {
        console.log("Set data to redis")
      }
    }
  } catch (error) {
    console.error('Error caching messages:', error);
  }
}

async function getRecentMessages(roomName, count) {
  const key = `room_name_${roomName}`;
  const listLength = await client.lLen(key);
  let limit = math.min(listLength, count-1)
  const messages = await client.lRange(key, 0, limit);
  return messages.map((message) => JSON.parse(message));
}

const setUserActive = async (socketId, roomName, userMail, userName) => {
  console.log("User Status update attempt to redis. ", socketId, roomName, userMail, userName);
  await client.hSet(
      socketId,
      {
        roomName: roomName,
        userMail: userMail,
        userName: userName,
      },
  ).then((fieldsAdded) => {
    console.log("User Status updated to redis. ", fieldsAdded);
  }).catch(err => {
    console.log("Error occurred ", err)
  })
  await AddOnlineUsers(roomName, userMail, userName)
}

const setUserOffline = async (socketId) => {
  try {
    const data = await client.hGetAll(socketId);
    if (!data || !data.roomName) return {};
    const { roomName, userMail, userName } = data;
    console.log(userMail, userName, roomName)
    
    await DeleteOnlineUsers(roomName, userMail, userName)
    await client.DEL(socketId)
    console.log("User sent to offline status")
    return { userMail, userName, roomName };
  } catch (e) {
    console.log("Error occurred ", e)
    return {};
  }
}

const getOnlineUsers = async (roomName) => {
  let key = `${roomName}_online_members`
  try {
    const onlineMembers = await client.sMembers(key);
    if (onlineMembers.length === 0) {
      console.log("no online members")
    } else {
      console.log("retrieved online members : ", onlineMembers)
      // Map back to just the display names for the frontend
      return onlineMembers.map(member => member.split('::')[1] || member);
    }
  } catch (error) {
    console.error("Error fetching online users:", error);
  }
}

const AddOnlineUsers = async (roomName, userMail, userName) => {
  let key = `${roomName}_online_members`
  try {
    const res1 = await client.sAdd(key, `${userMail}::${userName}`);
    if (res1 === 0) {
      console.log("Could not set data to redis")
    } else {
      console.log("Set data to redis under key ", key)
    }
  } catch (error) {
    console.error("Error adding online user:", error);
  }
}

const DeleteOnlineUsers = async (roomName, userMail, userName) => {
  let key = `${roomName}_online_members`
  try {
    const res1 = await client.sRem(key, `${userMail}::${userName}`);
    if (res1 === 0) {
      console.log("Could not delete data from redis")
    } else {
      console.log("removed data from redis ", key)
    }
  } catch (error) {
    console.error("Error removing online user:", error);
  }
}

module.exports = { saveMessageToRedis, getRecentMessages, cacheRecentMessages, getOnlineUsers, setUserActive, setUserOffline };

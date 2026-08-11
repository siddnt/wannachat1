// socketHandler.js
const { getRecentMessages, setUserActive, setUserOffline, getOnlineUsers } = require('../../utils/redisUtils');
const { verifyToken } = require('../../utils/jwtUtils');
const { enqueueMessage } = require('../queue/messageQueue');

const socketHandler = (io) => {
    io.on('connection', (socket) => {
      console.log('A user requested connection : ', socket.id);

      let userMail;
      try {
        const decoded = verifyToken(socket.handshake.headers.authorization.replace('BEARER ', ''));
        userMail = decoded.userMail;
      } catch (error) {
        console.error("Failed to verify token : ", error);
        socket.emit('receiveMessage', 'Token Unauthorized');
        socket.disconnect(true);
        return;
      }

      const userName = decodeURIComponent(socket.handshake.headers['x-user-name'] || '') || userMail;
      console.log("Connected user : ", userMail, "Display name:", userName);

      socket.on('joinRoom', joinRoomHandler(socket, io, userMail, userName));
      socket.on('sendMessage', sendMessageHandler(io, userMail, userName));
      socket.on('getRecentMessages', getRecentMessageHandler(socket));
      socket.on('getOnlineUsers', getOnlineUsersHandler(socket));
      socket.on('disconnect', disconnectHandler(socket, io));
    });
  };

  const joinRoomHandler = (socket, io, userMail, userName) => {
    return async (data) => {
      const { roomName } = data;
      console.log("joined Room ---------", roomName);
      socket.join(roomName);

      socket.emit('receiveMessage', `Welcome ${userName} to room ${roomName}`);
      await setUserActive(socket.id, roomName, userMail, userName)
      const newMessage = prepareMessage(roomName, `${userName} joined the room`, userMail, userName, true)
      io.to(roomName).emit('receiveMessage', newMessage);

      enqueueMessage(newMessage);

      const users = await getOnlineUsers(roomName);
      console.log('Online users after joining : ', users);

      io.to(roomName).emit('onlineUsers', {
        roomName: roomName,
        users: users || [],
      });
    }
  }

  const sendMessageHandler = (io, userMail, userName) => {
    return async (data) => {
      const { roomName, message } = data;
      const newMessage = prepareMessage(roomName, message, userMail, userName, false)

      // 1. Instant Broadcast: emit immediately
      io.to(roomName).emit('receiveMessage', newMessage);

      // 2. Background Save: push to BullMQ — not awaiting  the db save
      enqueueMessage(newMessage);
    }
  }

  const getRecentMessageHandler = (socket) => {
    return async (data) => {
    const { roomName, count } = data;
    const messages = await getRecentMessages(roomName, count);
    socket.emit('recentMessages', messages);
    }
  }

  const getOnlineUsersHandler = (socket) => {
    return async (data) => {
    const { roomName } = data;
    const users = await getOnlineUsers(roomName);
    console.log('Online users fetch : ', users);

    socket.emit('onlineUsers', {
      roomName: roomName,
      users: users || [],
    });
  }
}

  const disconnectHandler = (socket, io) => {
    return async () => {
      try {
        const data = await setUserOffline(socket.id);
        if (!data || !data.roomName) return;
        const { userMail, userName, roomName } = data;
        
        console.log(`User ${userName} (${userMail}) disconnected from room ${roomName}`);

        const newMessage = prepareMessage(roomName, `${userName} left the room`, userMail, userName, true)
        io.to(roomName).emit('receiveMessage', newMessage);

        enqueueMessage(newMessage);

        const users = await getOnlineUsers(roomName);
        console.log('Online users after disconnection : ', users);
        io.to(roomName).emit('onlineUsers', {
          roomName: roomName,
          users: users || [],
        });
      } catch (error) {
        console.error('Error handling disconnected user:', error);
      }
  }
}

const prepareMessage = (roomName, messageText, userMail, userName, isEvent) => ({roomName, messageText, userMail, userName, isEvent})

module.exports = socketHandler;
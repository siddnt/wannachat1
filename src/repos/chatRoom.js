const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const {saveMessageToRedis, getRecentMessages, cacheRecentMessages} = require("../../utils/redisUtils");
const recentMessages = 20

const User = require('../models/User');

async function saveMessage(messageBody, mail, userName, isEvent, roomName, imageUrl) {
    console.log("---------saving data-------",messageBody, mail, userName, isEvent, roomName, imageUrl);

    try {
        let chatRoom = await ChatRoom.findOne({ name: roomName });
        if (!chatRoom) {
            chatRoom = await ChatRoom.create({ name: roomName });
        }

        const message = await Message.create({
            roomId: chatRoom._id,
            text: messageBody,
            sender: mail,
            isEvent: isEvent,
            imageUrl: imageUrl,
        });

        console.log("Message created successfully:", message.toObject());

        const msgObj = message.toObject();
        msgObj.userName = userName;

        await saveMessageToRedis(roomName, msgObj);
        console.log("Successfully added caching to redis");

        return msgObj;
    } catch (error) {
        console.error("Error saving message:", error);
        throw error; // Re-throw the error to propagate it
    }
}

const getMessage = async function (roomName) {
    try {
        // Try retrive messages from Redis
        let messages = await getRecentMessages(roomName, recentMessages);
        if (!messages || messages.length === 0) {
            const chatRoom = await ChatRoom.findOne({ name: roomName });
            if (!chatRoom) return [];

            messages = await Message.find({ roomId: chatRoom._id })
                .sort({ timestamp: -1 })
                .limit(20)
                .lean();

            cacheRecentMessages(roomName, messages); // Cache 
        }

        const emails = messages.map(m => m.sender);
        const users = await User.find({ email: { $in: emails } }).lean();
        const emailToName = {};
        users.forEach(u => emailToName[u.email] = u.name);
        
        messages.forEach(m => {
            m.userName = emailToName[m.sender] || m.sender;
        });

        return messages;
    } catch (error) {
        try {
            const chatRoom = await ChatRoom.findOne({ name: roomName });
            if (!chatRoom) return [];

            let messages = await Message.find({ roomId: chatRoom._id })
                .sort({ timestamp: -1 })
                .limit(20)
                .lean();

            cacheRecentMessages(roomName, messages); // Cache retrieved messages
            console.log("Error retrieving message from redis ", error)
            
            // Populate user names dynamically for historical messages
            const emails = messages.map(m => m.sender);
            const users = await User.find({ email: { $in: emails } }).lean();
            const emailToName = {};
            users.forEach(u => emailToName[u.email] = u.name);
            
            messages.forEach(m => {
                m.userName = emailToName[m.sender] || m.sender;
            });

            return messages;
        } catch (dbError) {
            console.error("Error retrieving messages from DB:", dbError);
            return [];
        }
    }
  };

const getRoomName = async function (chatRoomId) {
    console.log("------ChatRoomId------", chatRoomId)
    try {
        const chatRoom = await ChatRoom.findById(chatRoomId).select('name');

        if (chatRoom) {
            console.log('Chat Room Name:', chatRoom.name);
            return chatRoom.name
        } else {
            console.log('Chat Room not found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = { saveMessage, getMessage, getRoomName };

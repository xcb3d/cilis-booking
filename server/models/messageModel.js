import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const messagesCollection = 'messages';

// Create a new message
async function createMessage(messageData) {
  const db = getDB();
  
  const newMessage = {
    conversationId: new ObjectId(messageData.conversationId),
    sender: new ObjectId(messageData.sender),
    content: messageData.content,
    readStatus: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Add attachments if they exist
  if (messageData.attachments && Array.isArray(messageData.attachments)) {
    newMessage.attachments = messageData.attachments;
  }
  
  // Log message creation for debugging
  console.log('Creating new message:', {
    conversationId: newMessage.conversationId,
    sender: newMessage.sender,
    readStatus: newMessage.readStatus
  });
  
  const result = await db.collection(messagesCollection).insertOne(newMessage);
  return { _id: result.insertedId, ...newMessage };
}

// Get messages by conversation ID (with pagination)
async function getMessagesByConversation(conversationId, page = 1, limit = 50) {
  const db = getDB();
  
  const skip = (page - 1) * limit;
  
  const messages = await db.collection(messagesCollection)
    .find({ conversationId: new ObjectId(conversationId) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  
  return messages.reverse(); // Return in chronological order (oldest first)
}

// Mark messages as read
async function markMessagesAsRead(conversationId, userId) {
  const db = getDB();
  
  // Log the query parameters
  console.log('Marking messages as read with params:', {
    conversationId,
    userId,
    conversationIdObj: new ObjectId(conversationId),
    userIdObj: new ObjectId(userId)
  });
  
  // First check how many unread messages match our criteria
  const unreadCount = await db.collection(messagesCollection).countDocuments({
    conversationId: new ObjectId(conversationId),
    sender: { $ne: new ObjectId(userId) },
    readStatus: false
  });
  
  console.log(`Found ${unreadCount} unread messages to mark as read`);
  
  // Then perform the update
  const result = await db.collection(messagesCollection).updateMany(
    { 
      conversationId: new ObjectId(conversationId),
      sender: { $ne: new ObjectId(userId) },
      readStatus: false
    },
    { $set: { readStatus: true, updatedAt: new Date() } }
  );
  
  return result;
}

// Count unread messages for a user
async function countUnreadMessages(userId) {
  const db = getDB();
  
  // First, get all conversations where the user is a participant
  const userConversations = await db.collection('conversations')
    .find({ participants: new ObjectId(userId) })
    .toArray();
  
  const conversationIds = userConversations.map(conv => conv._id);
  
  // Count unread messages in these conversations where user is not the sender
  return db.collection(messagesCollection).countDocuments({
    conversationId: { $in: conversationIds },
    sender: { $ne: new ObjectId(userId) },
    readStatus: false
  });
}

export default {
  createMessage,
  getMessagesByConversation,
  markMessagesAsRead,
  countUnreadMessages
}; 
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const conversationsCollection = 'conversations';

// Create a new conversation
async function createConversation(participants) {
  const db = getDB();
  
  const conversationData = {
    participants: participants.map(id => new ObjectId(id)),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessage: null
  };
  
  const result = await db.collection(conversationsCollection).insertOne(conversationData);
  return { _id: result.insertedId, ...conversationData };
}

// Get conversation by ID
async function getConversationById(id) {
  const db = getDB();
  return db.collection(conversationsCollection).findOne({
    _id: new ObjectId(id)
  });
}

// Get conversations by participant ID (user ID)
async function getConversationsByParticipant(userId) {
  const db = getDB();
  return db.collection(conversationsCollection)
    .find({
      participants: { $in: [new ObjectId(userId)] }
    })
    .sort({ updatedAt: -1 })
    .toArray();
}

// Get conversation by participants (checks if conversation exists between these users)
async function getConversationByParticipants(participantIds) {
  const db = getDB();
  const objectIdParticipants = participantIds.map(id => new ObjectId(id));
  
  return db.collection(conversationsCollection).findOne({
    participants: { 
      $all: objectIdParticipants,
      $size: objectIdParticipants.length
    }
  });
}

// Update last message and timestamp
async function updateLastMessage(conversationId, messageId, content) {
  const db = getDB();
  
  return db.collection(conversationsCollection).updateOne(
    { _id: new ObjectId(conversationId) },
    { 
      $set: {
        lastMessage: {
          _id: new ObjectId(messageId),
          content: content,
          timestamp: new Date()
        },
        updatedAt: new Date()
      }
    }
  );
}

export default {
  createConversation,
  getConversationById,
  getConversationsByParticipant,
  getConversationByParticipants,
  updateLastMessage
}; 
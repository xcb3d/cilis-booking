import conversationModel from '../models/conversationModel.js';
import messageModel from '../models/messageModel.js';
import userModel from '../models/userModel.js';
import { ObjectId } from 'mongodb';

// Get or create a conversation between users
async function getOrCreateConversation(participantIds) {
  try {
    // Check if conversation already exists between these participants
    const existingConversation = await conversationModel.getConversationByParticipants(participantIds);
    
    if (existingConversation) {
      return existingConversation;
    }
    
    // Create new conversation if it doesn't exist
    const newConversation = await conversationModel.createConversation(participantIds);
    return newConversation;
  } catch (error) {
    throw error;
  }
}

// Get user's conversations with basic info about other participants
async function getUserConversations(userId) {
  try {
    const conversations = await conversationModel.getConversationsByParticipant(userId);
    
    // Get user info for all participants
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Find participants that are not the current user
        const otherParticipantIds = conversation.participants
          .filter(id => id.toString() !== userId.toString());
        
        // Get user info for other participants
        const otherParticipants = await Promise.all(
          otherParticipantIds.map(async (participantId) => {
            const user = await userModel.findById(participantId.toString());
            if (user) {
              // Return limited user information for security
              return {
                _id: user._id,
                name: user.name,
                avatar: user.avatar || null,
                role: user.role
              };
            }
            return null;
          })
        );
        
        // Filter out any null participants
        const validParticipants = otherParticipants.filter(p => p !== null);
        
        return {
          ...conversation,
          otherParticipants: validParticipants
        };
      })
    );
    
    return enrichedConversations;
  } catch (error) {
    throw error;
  }
}

// Send a message
async function sendMessage(senderId, conversationId, content, attachments = []) {
  try {
    // Check if conversation exists
    const conversation = await conversationModel.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Improved check for participant - handles both string and ObjectId types
    const isParticipant = conversation.participants.some(participantId => 
      participantId.toString() === senderId.toString()
    );
    
    if (!isParticipant) {
      console.log('User not in conversation. User ID:', senderId, 'Participants:', conversation.participants.map(id => id.toString()));
      throw new Error('User is not part of this conversation');
    }
    
    // Create message
    const messageData = {
      conversationId,
      sender: senderId,
      content,
      attachments
    };
    
    const message = await messageModel.createMessage(messageData);
    
    // Update conversation with last message
    await conversationModel.updateLastMessage(conversationId, message._id, content);
    
    return message;
  } catch (error) {
    throw error;
  }
}

// Get messages for a conversation
async function getConversationMessages(userId, conversationId, page = 1, limit = 50) {
  try {
    // Check if conversation exists
    const conversation = await conversationModel.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Improved check for participant - handles both string and ObjectId types
    const isParticipant = conversation.participants.some(participantId => 
      participantId.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      console.log('User not in conversation. User ID:', userId, 'Participants:', conversation.participants.map(id => id.toString()));
      throw new Error('User is not part of this conversation');
    }
    
    // Get messages
    const messages = await messageModel.getMessagesByConversation(conversationId, page, limit);
    
    // Mark messages as read and log result
    const updateResult = await messageModel.markMessagesAsRead(conversationId, userId);
    console.log('Mark messages as read result:', {
      conversationId,
      userId,
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    });
    
    return messages;
  } catch (error) {
    throw error;
  }
}

// Get unread message count for user
async function getUnreadMessageCount(userId) {
  try {
    return messageModel.countUnreadMessages(userId);
  } catch (error) {
    throw error;
  }
}

// Search for users by role and search query
async function searchUsers(searchQuery, role) {
  try {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return [];
    }
    
    // Find users with the specified role and name matching the search query
    const users = await userModel.searchUsersByRole(role, searchQuery);
    
    // Return only necessary information for security
    return users.map(user => ({
      _id: user._id,
      name: user.name,
      avatar: user.avatar || null,
      role: user.role,
      field: user.field || '',
      verified: user.verified || false
    }));
  } catch (error) {
    throw error;
  }
}

export default {
  getOrCreateConversation,
  getUserConversations,
  sendMessage,
  getConversationMessages,
  getUnreadMessageCount,
  searchUsers
}; 
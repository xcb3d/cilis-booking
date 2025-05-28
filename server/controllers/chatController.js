import chatService from '../services/chatService.js';
import conversationModel from '../models/conversationModel.js';
import messageModel from '../models/messageModel.js';

// Get conversations for the current user
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await chatService.getUserConversations(userId);
    
    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error getting user conversations:', error);
    res.status(500).json({ message: 'Error retrieving conversations' });
  }
};

// Create or get a conversation with another user
const createOrGetConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }
    
    const participantIds = [userId, participantId];
    const conversation = await chatService.getOrCreateConversation(participantIds);
    
    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    res.status(500).json({ message: 'Error creating or retrieving conversation' });
  }
};

// Get messages for a specific conversation
const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    console.log(`Getting messages for conversation ${conversationId} for user ${userId}`);
    
    // If the user only wants to mark messages as read without retrieving them fully
    // (detected if page=0 is passed as parameter)
    if (parseInt(page) === 0) {
      // Check if conversation exists and user is authorized
      const conversation = await conversationModel.getConversationById(conversationId);
      if (!conversation) {
        return res.status(403).json({ message: 'Conversation not found' });
      }
      
      // Verify the user is part of the conversation
      const isParticipant = conversation.participants.some(
        participantId => participantId.toString() === userId.toString()
      );
      
      if (!isParticipant) {
        return res.status(403).json({ message: 'User is not part of this conversation' });
      }
      
      // Mark messages as read without retrieving them
      const result = await messageModel.markMessagesAsRead(conversationId, userId);
      console.log('Marked messages as read (click only):', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });
      
      return res.status(200).json({ success: true, messagesRead: result.modifiedCount });
    }
    
    // Normal flow - get messages and mark as read
    const messages = await chatService.getConversationMessages(
      userId,
      conversationId,
      parseInt(page),
      parseInt(limit)
    );
    
    console.log(`Marking messages as read for conversation ${conversationId}`);
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    if (error.message === 'Conversation not found' || error.message === 'User is not part of this conversation') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error retrieving messages' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, content, attachments = [] } = req.body;
    
    if (!conversationId || !content) {
      return res.status(400).json({ message: 'Conversation ID and content are required' });
    }
    
    const message = await chatService.sendMessage(userId, conversationId, content, attachments);
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    if (error.message === 'Conversation not found' || error.message === 'User is not part of this conversation') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error sending message' });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await chatService.getUnreadMessageCount(userId);
    
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error retrieving unread count' });
  }
};

// Search for experts (for clients to start new conversations)
const searchExperts = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Make sure the requesting user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can search for experts' });
    }
    
    const experts = await chatService.searchUsers(search, 'expert');
    
    res.status(200).json(experts);
  } catch (error) {
    console.error('Error searching experts:', error);
    res.status(500).json({ message: 'Error searching experts' });
  }
};

// Search for clients (for experts to start new conversations)
const searchClients = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Make sure the requesting user is an expert
    if (req.user.role !== 'expert') {
      return res.status(403).json({ message: 'Only experts can search for clients' });
    }
    
    const clients = await chatService.searchUsers(search, 'client');
    
    res.status(200).json(clients);
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ message: 'Error searching clients' });
  }
};

// Mark all messages in a conversation as read
const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    
    console.log(`Marking messages as read in conversation ${conversationId} for user ${userId}`);
    
    // Check if conversation exists
    const conversation = await conversationModel.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is part of the conversation
    const isParticipant = conversation.participants.some(
      participantId => participantId.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'User is not part of this conversation' });
    }
    
    // Mark messages as read
    const result = await messageModel.markMessagesAsRead(conversationId, userId);
    
    console.log('Messages marked as read:', {
      conversationId,
      userId,
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
    
    // Get participants to notify
    const otherParticipants = conversation.participants
      .filter(p => p.toString() !== userId.toString())
      .map(p => p.toString());
    
    // Send success response
    res.status(200).json({ 
      success: true, 
      messagesRead: result.modifiedCount,
      otherParticipants
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
};

export default {
  getUserConversations,
  createOrGetConversation,
  getConversationMessages,
  sendMessage,
  getUnreadCount,
  searchExperts,
  searchClients,
  markMessagesAsRead
}; 
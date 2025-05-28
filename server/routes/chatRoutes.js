import express from 'express';
import chatController from '../controllers/chatController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(authMiddleware.authenticateToken);

// Get all conversations for the current user
router.get('/conversations', chatController.getUserConversations);

// Create or get a conversation with another user
router.post('/conversations', chatController.createOrGetConversation);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', chatController.getConversationMessages);

// Send a message
router.post('/messages', chatController.sendMessage);

// Get unread message count
router.get('/unread-count', chatController.getUnreadCount);

// Search for experts (for clients to start new conversations)
router.get('/experts', chatController.searchExperts);

// Search for clients (for experts to start new conversations)
router.get('/clients', chatController.searchClients);

// Mark messages in a conversation as read
router.post('/conversations/:conversationId/read', chatController.markMessagesAsRead);

export default router; 
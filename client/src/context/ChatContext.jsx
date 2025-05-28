import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/authStore';

const ChatContext = createContext({});

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showConversations, setShowConversations] = useState(true);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers({});
      return;
    }

    // Connect to socket server
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Handle socket connection
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      // Automatically rejoin active conversation room if exists
      if (currentConversation) {
        newSocket.emit('join-conversation', currentConversation._id);
      }
    });

    // Handle reconnection events
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to chat server after ${attemptNumber} attempts`);
      
      // Re-join conversation room if we have an active conversation
      if (currentConversation) {
        newSocket.emit('join-conversation', currentConversation._id);
      }
      
      // Refresh conversations list after reconnection
      fetchConversations();
      fetchUnreadCount();
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Attempting to reconnect: attempt ${attemptNumber}`);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to chat server after maximum attempts');
    });

    // Handle errors
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Handle disconnect
    newSocket.on('disconnect', (reason) => {
      console.log(`Disconnected from chat server. Reason: ${reason}`);
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, try to reconnect
        newSocket.connect();
      }
    });

    // Save socket instance
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, isAuthenticated]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for incoming messages
    socket.on('receive-message', (message) => {
      if (currentConversation && currentConversation._id === message.conversationId) {
        // When we receive a message in the current conversation, add it to messages
        setMessages((prevMessages) => [...prevMessages, message]);
        
        // Mark as read if this is the current conversation
        socket.emit('mark-read', {
          conversationId: message.conversationId,
          participantIds: message.participants
        });
      } else {
        // If we're not viewing this conversation, update the conversations list
        // to show the unread indicator
        setConversations(prevConversations => 
          prevConversations.map(conv => {
            if (conv._id === message.conversationId) {
              return {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  content: message.content,
                  timestamp: message.createdAt,
                  readStatus: false // Mark as unread when we receive a message in a different conversation
                }
              };
            }
            return conv;
          })
        );
      }
      
      // Update conversations list to get latest order
      fetchConversations();
    });

    // Listen for online user updates
    socket.on('user-online', (userId) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: true
      }));
    });

    socket.on('user-offline', (userId) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: false
      }));
    });

    socket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    // Listen for message notifications
    socket.on('new-message-notification', (notification) => {
      // Increment unread count if not in the conversation
      if (!currentConversation || currentConversation._id !== notification.conversationId) {
        fetchUnreadCount();
      }
    });

    // Listen for typing indicators
    socket.on('user-typing', ({ userId, name, isTyping, conversationId }) => {
      console.log('Typing event received:', { userId, name, isTyping, conversationId });
      
      setTypingUsers((prev) => {
        if (isTyping) {
          return { ...prev, [userId]: { name, conversationId } };
        } else {
          const newTypingUsers = { ...prev };
          delete newTypingUsers[userId];
          return newTypingUsers;
        }
      });
    });
    
    // Listen for when a user is viewing a conversation
    socket.on('user-viewing', ({ userId, conversationId }) => {
      console.log('User viewing conversation:', { userId, conversationId });
      
      // If we have outgoing messages in this conversation, mark them as read
      if (conversations.some(c => c._id === conversationId)) {
        // Update local message read status
        setMessages(prevMessages => 
          prevMessages.map(msg => ({
            ...msg,
            readStatus: msg.sender === user._id ? true : msg.readStatus
          }))
        );
      }
    });
    
    // Listen for when a user leaves a conversation view
    socket.on('user-left-view', ({ userId, conversationId }) => {
      console.log('User left conversation view:', { userId, conversationId });
    });

    // Listen for read status updates
    socket.on('messages-read', ({ conversationId, readBy }) => {
      console.log('Messages read event received:', { conversationId, readBy });
      
      // Update read status for all conversations
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv._id === conversationId) {
            // If this has a lastMessage, mark it as read
            if (conv.lastMessage) {
              return {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  readStatus: true
                }
              };
            }
          }
          return conv;
        })
      );
      
      // If this is the current conversation, update messages
      if (currentConversation && currentConversation._id === conversationId) {
        setMessages(prevMessages =>
          prevMessages.map(msg => ({
            ...msg,
            readStatus: true
          }))
        );
      }
    });

    // Clean up
    return () => {
      socket.off('receive-message');
      socket.off('new-message-notification');
      socket.off('user-typing');
      socket.off('messages-read');
      socket.off('user-viewing');
      socket.off('user-left-view');
      socket.off('user-online');
      socket.off('user-offline');
      socket.off('online-users');
    };
  }, [socket, currentConversation, user, conversations]);

  // Fetch conversations with retry logic
  const fetchConversations = async (retryCount = 3) => {
    if (!isAuthenticated) return;
    
    setLoadingConversations(true);
    try {
      const response = await axiosClient.get('/chat/conversations');
      setConversations(response);
      setLoadingConversations(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      
      // Retry logic
      if (retryCount > 0) {
        console.log(`Retrying fetchConversations... (${retryCount} attempts left)`);
        setTimeout(() => fetchConversations(retryCount - 1), 1000);
      } else {
        setLoadingConversations(false);
      }
    }
  };

  // Fetch unread count with retry logic
  const fetchUnreadCount = async (retryCount = 3) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await axiosClient.get('/chat/unread-count');
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      
      // Retry logic
      if (retryCount > 0) {
        console.log(`Retrying fetchUnreadCount... (${retryCount} attempts left)`);
        setTimeout(() => fetchUnreadCount(retryCount - 1), 1000);
      }
    }
  };

  // Fetch messages for a conversation with retry logic
  const fetchMessages = async (conversationId, page = 1, retryCount = 3) => {
    if (!isAuthenticated || !conversationId) return;
    
    setLoadingMessages(true);
    try {
      const response = await axiosClient.get(`/chat/conversations/${conversationId}/messages`, {
        params: { page }
      });
      
      setMessages(response);
      
      // Mark messages as read - only those sent by other users
      if (socket && response.length > 0) {
        const conversation = conversations.find(c => c._id === conversationId);
        if (conversation) {
          // Send socket event to notify other users
          socket.emit('mark-read', {
            conversationId,
            participantIds: conversation.participants.map(p => p._id)
          });
          
          // Also update local message state to show read status
          // Only mark messages from others as read
          setMessages(prev => 
            prev.map(msg => ({
              ...msg,
              readStatus: msg.sender === user?._id ? msg.readStatus : true
            }))
          );
        }
      }
      
      setLoadingMessages(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      
      // Retry logic
      if (retryCount > 0) {
        console.log(`Retrying fetchMessages... (${retryCount} attempts left)`);
        setTimeout(() => fetchMessages(conversationId, page, retryCount - 1), 1000);
      } else {
        setLoadingMessages(false);
      }
    }
  };

  // Send a message
  const sendMessage = async (conversationId, content) => {
    if (!isAuthenticated || !socket) return;
    
    try {
      // Get conversation participants
      const conversation = conversations.find(c => c._id === conversationId);
      if (!conversation) return;
      
      const participantIds = conversation.participants.map(p => p._id);
      
      // Send message to server
      const response = await axiosClient.post('/chat/messages', {
        conversationId,
        content
      });
      
      // Create new message with readStatus set to false initially
      const newMessage = {
        ...response,
        readStatus: false // Message is unread until the other participant reads it
      };
      
      // Emit socket event
      socket.emit('send-message', {
        conversationId,
        content,
        participants: participantIds,
        _id: response._id,
        createdAt: response.createdAt
      });
      
      // Update local messages
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation in the list with latest message
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv._id === conversationId) {
            return {
              ...conv,
              lastMessage: {
                _id: response._id,
                content: content,
                timestamp: response.createdAt,
                readStatus: false // Initially unread
              }
            };
          }
          return conv;
        })
      );
      
      // Update conversations list to get latest order
      await fetchConversations();
      
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Join a conversation room
  const joinConversation = (conversationId) => {
    if (!socket || !conversationId) return;
    socket.emit('join-conversation', conversationId);
  };

  // Leave a conversation room
  const leaveConversation = (conversationId) => {
    if (!socket || !conversationId) return;
    socket.emit('leave-conversation', conversationId);
  };

  // Send typing indicator
  const sendTypingIndicator = (conversationId, isTyping) => {
    if (!socket || !conversationId) return;
    socket.emit('typing', { conversationId, isTyping });
  };

  // Set current conversation and load messages
  const setActiveConversation = async (conversation) => {
    if (!conversation) {
      setCurrentConversation(null);
      setMessages([]);
      return;
    }

    // Make sure to show the conversation view immediately, not the list view
    setShowConversations(false);

    // Ensure we have the latest conversations list
    await fetchConversations();
    
    // Leave previous conversation room if exists
    if (currentConversation) {
      leaveConversation(currentConversation._id);
    }

    // Check if conversation is in our list, otherwise refresh the list
    const conversationExists = conversations.some(c => c._id === conversation._id);
    if (!conversationExists) {
      console.log('Conversation not found in list, refreshing conversations');
      await fetchConversations();
    }

    // Update UI immediately to show the conversation as read
    setConversations(prevConversations => 
      prevConversations.map(conv => {
        if (conv._id === conversation._id && conv.lastMessage) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              readStatus: true
            }
          };
        }
        return conv;
      })
    );

    setCurrentConversation(conversation);
    
    // Join new conversation room
    joinConversation(conversation._id);
    
    try {
      // Mark messages as read
      await markMessagesAsRead(conversation._id);
      
      // Fetch messages
      await fetchMessages(conversation._id);
    } catch (error) {
      console.error('Error setting active conversation:', error);
    }
    
    // Update unread count
    fetchUnreadCount();
  };

  // Load initial data when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchUnreadCount();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Toggle message dialog with preloading
  const toggleMessageDialog = (forceState) => {
    const newState = typeof forceState === 'boolean' ? forceState : !isMessageDialogOpen;
    
    // If we're opening the dialog, ensure conversations are loaded
    if (newState && !isMessageDialogOpen) {
      // Only fetch if not already loading and if we don't have conversations yet
      if (!loadingConversations && (!conversations || conversations.length === 0)) {
        fetchConversations();
      }
      
      // Also update the unread count
      fetchUnreadCount();
    }
    
    setIsMessageDialogOpen(newState);
  };

  // Enhanced mark messages as read function
  const markMessagesAsRead = async (conversationId) => {
    if (!isAuthenticated || !conversationId) return;
    
    try {
      // API call to mark messages as read - only those sent by other users
      // The server should handle this logic, but we're also updating the UI accordingly
      await axiosClient.post(`/chat/conversations/${conversationId}/read`);
      
      // Get conversation participants to notify
      const conversation = conversations.find(c => c._id === conversationId);
      if (!conversation) return;
      
      // Emit socket event to notify other users
      if (socket) {
        const participantIds = conversation.participants.map(p => 
          typeof p === 'object' ? p._id : p
        );
        
        socket.emit('mark-read', {
          conversationId,
          participantIds
        });
      }
      
      // Update local state - only for messages from others
      updateReadStatus(conversationId);
      
      // Refresh unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  // Helper function to update read status in the UI
  const updateReadStatus = (conversationId) => {
    // Update conversation list
    setConversations(prevConversations => 
      prevConversations.map(conv => {
        if (conv._id === conversationId && conv.lastMessage) {
          // Only mark the last message as read if it's not from the current user
          const shouldMarkAsRead = conv.lastMessage.sender !== user?._id;
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              readStatus: shouldMarkAsRead ? true : conv.lastMessage.readStatus
            }
          };
        }
        return conv;
      })
    );
    
    // Update current messages
    if (currentConversation && currentConversation._id === conversationId) {
      setMessages(prevMessages =>
        prevMessages.map(msg => ({
          ...msg,
          // Only mark messages from others as read
          readStatus: msg.sender === user?._id ? msg.readStatus : true
        }))
      );
    }
  };

  const value = {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    loadingMessages,
    loadingConversations,
    typingUsers,
    isMessageDialogOpen,
    onlineUsers,
    setActiveConversation,
    sendMessage,
    sendTypingIndicator,
    toggleMessageDialog,
    fetchConversations,
    fetchUnreadCount,
    markMessagesAsRead,
    socket,
    setConversations,
    setMessages,
    showConversations,
    setShowConversations
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);

export default ChatContext; 
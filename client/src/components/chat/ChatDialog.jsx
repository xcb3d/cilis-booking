import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChatBubbleOvalLeftEllipsisIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useChat } from '../../context/ChatContext';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import useAuthStore from '../../store/authStore';
import axiosClient from '../../utils/axiosClient';

const ChatDialog = () => {
  const { user } = useAuthStore();
  const { 
    isMessageDialogOpen, 
    toggleMessageDialog, 
    conversations,
    currentConversation,
    setActiveConversation,
    messages,
    sendMessage,
    loadingMessages,
    loadingConversations,
    sendTypingIndicator,
    typingUsers,
    unreadCount,
    setConversations,
    setMessages,
    socket,
    markMessagesAsRead,
    showConversations,
    setShowConversations
  } = useChat();
  const [messageInput, setMessageInput] = useState('');
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousDialogOpenRef = useRef(isMessageDialogOpen);
  
  // Preload conversations when dialog is opened
  useEffect(() => {
    // Only fetch if dialog has just opened (was closed, now open)
    if (isMessageDialogOpen && !previousDialogOpenRef.current) {
      console.log('Dialog opened - preloading conversations');
    }
    
    // Update ref for next render
    previousDialogOpenRef.current = isMessageDialogOpen;
  }, [isMessageDialogOpen]);
  
  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentConversation) return;
    
    sendMessage(currentConversation._id, messageInput.trim());
    setMessageInput('');
  }, [messageInput, currentConversation, sendMessage]);

  // Handle typing indicator with debouncing
  const handleTyping = useCallback((e) => {
    setMessageInput(e.target.value);
    
    if (currentConversation) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send typing indicator
      sendTypingIndicator(currentConversation._id, true);
      
      // Set timeout to stop typing indicator after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(currentConversation._id, false);
      }, 2000);
    }
  }, [currentConversation, sendTypingIndicator]);

  // Handle conversation click
  const handleConversationClick = useCallback(async (conversation) => {
    // Immediately update UI to show conversation as read
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
    
    try {
      // Mark messages as read
      await markMessagesAsRead(conversation._id);
    } catch (error) {
      console.error('Error marking messages as read on conversation click:', error);
    }
    
    // Set active conversation and show the conversation view
    setActiveConversation(conversation);
  }, [setConversations, markMessagesAsRead, setActiveConversation]);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    setShowConversations(true);
  }, [setShowConversations]);

  // Handle input focus
  const handleInputFocus = useCallback(async () => {
    // Only proceed if we have an active conversation
    if (!currentConversation) return;
    
    try {
      console.log('Marking messages as read due to input focus');
      await markMessagesAsRead(currentConversation._id);
    } catch (error) {
      console.error('Error marking messages as read on input focus:', error);
    }
  }, [currentConversation, markMessagesAsRead]);

  // Format typing indicator text
  const getTypingText = useCallback(() => {
    if (!currentConversation) return '';
    
    const typingUsersInConversation = Object.entries(typingUsers)
      .filter(([userId, data]) => 
        data.conversationId === currentConversation._id && 
        userId !== user?._id
      )
      .map(([_, data]) => data.name);
    
    if (typingUsersInConversation.length === 0) return '';
    if (typingUsersInConversation.length === 1) return `${typingUsersInConversation[0]} is typing...`;
    return 'Several people are typing...';
  }, [currentConversation, typingUsers, user?._id]);

  return (
    <>
      {/* Chat icon button */}
      <button
        onClick={toggleMessageDialog}
        className="fixed bottom-8 right-8 p-3 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all duration-200 focus:outline-none"
        aria-label="Open chat"
      >
        <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 text-xs rounded-full bg-red-500">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Chat dialog */}
      <Transition
        show={isMessageDialogOpen}
        enter="transition-opacity ease-in-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in-out duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Dialog
          className="fixed bottom-8 right-8 z-50 w-96 max-w-full h-[500px] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
          onClose={toggleMessageDialog}
          aria-label="Chat dialog"
          static
        >
          <div className="flex items-center justify-between bg-indigo-600 p-4">
            <h2 className="text-lg font-medium text-white">
              {showConversations 
                ? 'Tin nhắn' 
                : currentConversation?.otherParticipants?.[0]?.name || 'Cuộc trò chuyện'}
            </h2>
            <div className="flex items-center space-x-2">
              {!showConversations && (
                <button
                  onClick={handleBackClick}
                  className="text-white hover:text-indigo-200"
                  aria-label="Back to conversations"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <button
                onClick={toggleMessageDialog}
                className="text-white hover:text-indigo-200"
                aria-label="Close chat"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-grow overflow-auto">
            {showConversations ? (
              <div className="h-full flex flex-col">
                <div className="flex-grow overflow-auto">
                  <ConversationList
                    conversations={conversations}
                    onConversationClick={handleConversationClick}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-grow overflow-auto p-4">
                  <MessageList
                    messages={messages}
                    loading={loadingMessages}
                    currentUserId={user?._id}
                  />
                  <div ref={messageEndRef} />
                </div>
                
                {getTypingText() && (
                  <div className="px-4 py-1">
                    <TypingIndicator text={getTypingText()} />
                  </div>
                )}
                
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={handleTyping}
                      onFocus={handleInputFocus}
                      className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Type your message..."
                      disabled={!currentConversation}
                    />
                    <button
                      type="submit"
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!messageInput.trim() || !currentConversation}
                      aria-label="Send message"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default ChatDialog; 
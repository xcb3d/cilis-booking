import { format } from 'date-fns';
import { useCallback } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useChat } from '../../context/ChatContext';
import OnlineStatusIndicator from './OnlineStatusIndicator';
import axiosClient from '../../utils/axiosClient';

const ConversationList = ({ conversations, onConversationClick }) => {
  const { loadingConversations, socket, setConversations, onlineUsers } = useChat();

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // If today, just show time
      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a');
      }
      
      // If this year, show month and day
      if (date.getFullYear() === now.getFullYear()) {
        return format(date, 'MMM d');
      }
      
      // Otherwise show month, day and year
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return '';
    }
  };

  // Optimize conversation click handling with useCallback
  const handleConversationClick = useCallback((conversation) => {
    // Immediately update UI to show conversation as read
    setConversations(prevConversations => 
      prevConversations.map(conv => {
        if (conv._id === conversation._id) {
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
    
    // Call the parent handler directly without waiting for API calls
    // The API call will be handled in ChatContext's setActiveConversation
    onConversationClick(conversation);
  }, [setConversations, onConversationClick]);

  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers && onlineUsers[userId] === true;
  };

  if (loadingConversations) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-gray-500">No conversations yet</p>
        <p className="text-xs text-gray-400 mt-1">Start a new conversation to connect with someone</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conversation) => {
        const lastMessage = conversation.lastMessage;
        const otherParticipant = conversation.otherParticipants?.[0];
        const hasUnreadMessages = lastMessage && !lastMessage.readStatus;
        const isOnline = otherParticipant && isUserOnline(otherParticipant._id);
        
        return (
          <div
            key={conversation._id}
            onClick={() => handleConversationClick(conversation)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                {otherParticipant?.avatar ? (
                  <img 
                    src={otherParticipant.avatar} 
                    alt={`${otherParticipant.name}'s avatar`}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                )}
                
                <div className="absolute -bottom-1 -right-1">
                  <OnlineStatusIndicator isOnline={isOnline} size="sm" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center">
                    <h3 className={`text-sm ${hasUnreadMessages ? 'font-bold text-indigo-700' : 'font-medium'} truncate mr-2`}>
                      {otherParticipant?.name || 'Unknown User'}
                    </h3>
                  </div>
                  
                  {lastMessage && (
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(lastMessage.timestamp)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <p className={`text-xs ${hasUnreadMessages ? 'font-semibold text-gray-800' : 'text-gray-500'} truncate mr-2`}>
                    {lastMessage ? lastMessage.content : 'No messages yet'}
                  </p>
                  
                  {hasUnreadMessages && (
                    <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0"></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList; 
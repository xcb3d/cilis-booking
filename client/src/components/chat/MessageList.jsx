import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon, CheckIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { useChat } from '../../context/ChatContext';
import axiosClient from '../../utils/axiosClient';

const MessageList = ({ messages, loading, currentUserId }) => {
  const chatContext = useChat();
  const { socket, currentConversation, markMessagesAsRead } = chatContext;
  // Bảo đảm setMessages và setConversations tồn tại
  const setMessages = chatContext.setMessages || (() => console.log('setMessages not available'));
  const setConversations = chatContext.setConversations || (() => console.log('setConversations not available'));
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [checkedForMore, setCheckedForMore] = useState(false);
  const containerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  // Format timestamp to readable format
  const formatMessageTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  // Handle infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If scrolled near top and we're not already loading and there might be more
      if (
        container.scrollTop < 100 &&
        !loadingMore &&
        hasMore &&
        messages.length > 0 &&
        currentConversation
      ) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, messages, currentConversation]);

  // Add a direct check after a page change
  useEffect(() => {
    // If we've loaded page 2 and there's no more messages, make sure hasMore is false
    if (page > 1 && messages.length <= 20) {
      console.log('Only 20 or fewer messages after loading page 2, assuming no more messages');
      setHasMore(false);
    }
  }, [page, messages.length]);

  // Reset pagination when conversation changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setCheckedForMore(false);
    prevMessagesLengthRef.current = 0;
  }, [currentConversation?._id]);

  // Check if there are more messages when conversation first loads
  useEffect(() => {
    if (currentConversation && messages.length > 0 && !checkedForMore && page === 1) {
      // Check if there are earlier messages on first load
      checkForEarlierMessages();
    }
  }, [messages, currentConversation, checkedForMore]);

  // Check if there are earlier messages (without actually loading them)
  const checkForEarlierMessages = async () => {
    if (!currentConversation || loadingMore || !hasMore) return;
    
    console.log('Checking for earlier messages...');
    setLoadingMore(true);
    try {
      // Try to peek at the next page
      const nextPage = page + 1;
      console.log(`Checking for messages on page ${nextPage}`);
      const response = await axiosClient.get(
        `/chat/conversations/${currentConversation._id}/messages`,
        { params: { page: nextPage, limit: 1 } } // Just check for 1 message to minimize data transfer
      );
      
      console.log(`Found ${response.length} earlier messages`);
      
      // If we got 0 messages, there are no more
      if (!response || response.length === 0) {
        console.log('No more messages available - hiding button');
        setHasMore(false);
      }
      
      setCheckedForMore(true);
    } catch (error) {
      console.error('Error checking for earlier messages:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle message length changes
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length;
    } else if (messages.length === 0) {
      prevMessagesLengthRef.current = 0;
    }
  }, [messages]);

  // Load more messages when scrolling up
  const loadMoreMessages = async () => {
    if (!currentConversation || loadingMore || !hasMore) {
      console.log('Cannot load more messages:', { 
        hasConversation: !!currentConversation, 
        isLoading: loadingMore, 
        hasMoreMessages: hasMore 
      });
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      console.log(`Loading more messages for page ${nextPage}`);
      
      const response = await axiosClient.get(
        `/chat/conversations/${currentConversation._id}/messages`,
        { params: { page: nextPage, limit: 20 } }
      );
      
      console.log(`Loaded ${response.length} earlier messages`);
      
      // If we got no messages or less than the limit, we've reached the end
      if (!response || response.length === 0 || response.length < 20) {
        console.log('Reached the end of message history');
        setHasMore(false);
      }
      
      // Append older messages to the beginning
      if (response && response.length > 0) {
        setMessages(prevMessages => [...response, ...prevMessages]);
        setPage(nextPage);
        
        // Save current scroll position
        if (containerRef.current) {
          const { scrollHeight } = containerRef.current;
          setTimeout(() => {
            if (containerRef.current) {
              // After DOM update, restore scroll position
              containerRef.current.scrollTop = containerRef.current.scrollHeight - scrollHeight;
            }
          }, 0);
        }
      } else {
        console.log('No messages returned, setting hasMore to false');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      setCheckedForMore(true);
    }
  };

  // Handle click on the message area
  const handleMessageAreaClick = async () => {
    if (!messages || messages.length === 0) return;
    
    // Try to get conversation ID from current conversation
    if (!currentConversation || !currentConversation._id) return;
    
    const conversationId = currentConversation._id;
    
    try {
      console.log('Marking messages as read on message area click', conversationId);
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error marking messages as read on message area click:', error);
    }
  };

  // Show loading state - only when true loading (not just checking for more)
  if (loading && !loadingMore && messages.length === 0 && !checkedForMore) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show empty state
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>Chưa có tin nhắn</p>
        <p className="text-sm">Hãy bắt đầu cuộc trò chuyện</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div 
      ref={containerRef}
      className="space-y-3 h-full overflow-y-auto px-2" 
      onClick={handleMessageAreaClick}
    >
      {/* Loading indicator for more messages */}
      {loadingMore && (
        <div className="flex justify-center items-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {/* Messages grouped by date */}
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="mb-4">
          {/* Date separator */}
          <div className="flex justify-center mb-3">
            <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
              {new Date(date).toLocaleDateString(undefined, { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
              })}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-3">
            {dateMessages.map((message) => {
              const isCurrentUser = message.sender?.toString() === currentUserId?.toString();
              
              return (
                <div
                  key={message._id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isCurrentUser && (
                      <UserCircleIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md break-words ${
                        isCurrentUser
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div
                        className={`flex mt-1 text-xs ${
                          isCurrentUser ? 'text-indigo-200 justify-end' : 'text-gray-500'
                        }`}
                      >
                        <span>{formatMessageTime(message.createdAt)}</span>
                        
                        {isCurrentUser && (
                          <span className="ml-1">
                            {message.readStatus ? (
                              <CheckCircleIcon className="h-3 w-3 inline text-green-400" />
                            ) : (
                              <CheckIcon className="h-3 w-3 inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList; 
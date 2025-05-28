import { useChat } from '../../context/ChatContext';
import axiosClient from '../../utils/axiosClient';
import { useState } from 'react';

const StartConversationButton = ({ userId, userName, className = '' }) => {
  const { setActiveConversation, toggleMessageDialog, fetchConversations } = useChat();
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Create or get a conversation with this user directly using API
      const conversation = await axiosClient.post('/chat/conversations', {
        participantId: userId
      });
      
      // Fetch all conversations to update the list
      await fetchConversations();
      
      // Add otherParticipants information to ensure name shows up in the header
      // This is necessary in case the conversations list hasn't been updated yet
      const enrichedConversation = {
        ...conversation,
        otherParticipants: [
          {
            _id: userId,
            name: userName
          }
        ]
      };
      
      // Set it as the active conversation with enriched data
      await setActiveConversation(enrichedConversation);
      
      // Open the chat dialog
      toggleMessageDialog();
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartConversation}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 mr-1" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97-1.94.284-3.916.455-5.922.518-1.946.063-3.8.063-5.946 0-1.11-.037-2.187-.137-3.236-.276a1.2 1.2 0 00-1.195.931 1.38 1.38 0 01-1.369 1.117.928.928 0 01-.67-.31.956.956 0 01-.167-.556V5.538c0-1.946 1.37-3.68 3.348-3.97 1.124-.167 2.27-.293 3.433-.368zM12 15.75c-1.958 0-3.551-1.522-3.551-3.4s1.593-3.4 3.551-3.4c1.958 0 3.552 1.522 3.552 3.4s-1.594 3.4-3.552 3.4z" clipRule="evenodd" />
        </svg>
      )}
      {loading ? 'Đang kết nối...' : `Nhắn tin với ${userName}`}
    </button>
  );
};

export default StartConversationButton; 
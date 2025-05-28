import React from 'react';

const TypingIndicator = ({ text }) => {
  return (
    <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 flex items-center">
      <div className="flex space-x-1 mr-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
      </div>
      <span className="text-gray-500 italic">{text}</span>
    </div>
  );
};

export default TypingIndicator; 
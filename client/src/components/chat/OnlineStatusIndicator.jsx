import React from 'react';

/**
 * Online status indicator component
 * @param {Object} props
 * @param {boolean} props.isOnline - Whether the user is online
 * @param {string} props.lastSeen - Last seen timestamp (optional)
 * @param {string} props.size - Size of the indicator ('sm', 'md', 'lg')
 */
const OnlineStatusIndicator = ({ isOnline, lastSeen, size = 'md' }) => {
  // Determine size class
  const sizeClass = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }[size] || 'w-3 h-3';
  
  // Format last seen time if available
  const formattedLastSeen = lastSeen ? formatLastSeen(lastSeen) : null;
  
  return (
    <div className="relative inline-flex items-center">
      <span
        className={`${sizeClass} rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
        title={isOnline ? 'Online' : formattedLastSeen || 'Offline'}
      />
      {!isOnline && formattedLastSeen && (
        <span className="ml-2 text-xs text-gray-500">{formattedLastSeen}</span>
      )}
    </div>
  );
};

/**
 * Format last seen timestamp to a human-readable string
 * @param {string} timestamp - ISO string timestamp
 * @returns {string} Formatted string like "2h ago" or "Yesterday at 2:30 PM"
 */
const formatLastSeen = (timestamp) => {
  try {
    const lastSeenDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return `Yesterday at ${lastSeenDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return lastSeenDate.toLocaleDateString();
    }
  } catch (e) {
    return 'Unknown';
  }
};

export default OnlineStatusIndicator; 
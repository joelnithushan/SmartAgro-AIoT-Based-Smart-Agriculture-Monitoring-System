import React, { useState } from 'react';

const Sidebar = ({ 
  chats, 
  currentChatId, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat, 
  onUpdateChatTitle,
  isLoading 
}) => {
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleEditStart = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleEditSave = () => {
    if (editingTitle.trim() && editingChatId) {
      onUpdateChatTitle(editingChatId, editingTitle.trim());
      setEditingChatId(null);
      setEditingTitle('');
    }
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate) {
      // Firestore timestamp
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      // Firestore timestamp object
      date = new Date(timestamp.seconds * 1000);
    } else {
      // Regular date
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
                <p className="text-xs text-gray-500">All your conversations</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        {!isCollapsed && (
          <>
            <button
              onClick={onNewChat}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 mb-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search chat history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-8 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 hover:text-gray-600"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
        {isCollapsed && (
          <button
            onClick={onNewChat}
            className="w-full bg-green-500 text-white py-3 px-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
            title="New Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            {!isCollapsed && <p className="text-sm text-gray-500 mt-2">Loading chat history...</p>}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            {!isCollapsed && (
              <>
                {searchQuery ? (
                  <>
                    <p className="text-sm">No chats found</p>
                    <p className="text-xs">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm">No chat history</p>
                    <p className="text-xs">Start your first conversation!</p>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="p-2">
            {!isCollapsed && (
              <div className="px-3 py-2 mb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Recent Chats
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {filteredChats.length}{searchQuery ? ` of ${chats.length}` : ''}
                  </span>
                </div>
                {searchQuery && (
                  <p className="text-xs text-gray-400 mt-1">
                    Searching for: "{searchQuery}"
                  </p>
                )}
              </div>
            )}
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                  currentChatId === chat.id
                    ? 'bg-green-50 border border-green-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelectChat(chat.id)}
                title={isCollapsed ? chat.title : ''}
              >
                {isCollapsed ? (
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
                        {chat.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : editingChatId === chat.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={handleEditSave}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      autoFocus
                    />
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSave();
                        }}
                        className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCancel();
                        }}
                        className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {chat.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatDate(chat.updatedAt || chat.createdAt)}
                          </p>
                          {chat.messageCount && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {chat.messageCount} messages
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStart(chat.id, chat.title);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Rename chat"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this chat?')) {
                              onDeleteChat(chat.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete chat"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {isCollapsed ? (
          <div className="text-center">
            <div className="text-2xl mb-1">🤖</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <span>Powered by</span>
                <span className="font-semibold text-green-600">Gemini AI</span>
              </div>
              <p>Agriculture Assistant</p>
              <div className="flex items-center justify-center space-x-1 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Firestore Sync</span>
              </div>
            </div>
            
            {chats.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
                    // Delete all chats
                    chats.forEach(chat => onDeleteChat(chat.id));
                  }
                }}
                className="w-full text-xs text-red-500 hover:text-red-700 py-2 px-3 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear All Chats
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
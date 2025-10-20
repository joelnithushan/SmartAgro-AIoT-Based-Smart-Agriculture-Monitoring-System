import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  ChatBubbleLeftRightIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const EnhancedChatHistory = ({ 
  onChatSelect, 
  currentChatId, 
  onNewChat, 
  onDeleteChat,
  onRenameChat,
  isCollapsed = false,
  onToggle
}) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/history`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📚 Enhanced chat history loaded:', data);
          setChats(data.chats || []);
        } else {
          console.warn('Failed to load chat history:', response.status);
          setChats([]);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [currentUser]);

  // Filter chats based on search
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date like ChatGPT
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
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
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Handle chat rename
  const handleRenameStart = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleRenameSave = async () => {
    if (editingTitle.trim() && editingChatId) {
      try {
        await onRenameChat(editingChatId, editingTitle.trim());
        setEditingChatId(null);
        setEditingTitle('');
      } catch (error) {
        console.error('Error renaming chat:', error);
      }
    }
  };

  const handleRenameCancel = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSave();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search chats"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onToggle}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Toggle sidebar"
              >
                <EllipsisVerticalIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {!isCollapsed && showSearch && (
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* New Chat Button */}
        {!isCollapsed ? (
          <button
            onClick={onNewChat}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        ) : (
          <button
            onClick={onNewChat}
            className="w-full bg-green-600 text-white py-3 px-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            title="New Chat"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            {!isCollapsed && <p className="text-sm text-gray-500 mt-2">Loading chat history...</p>}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            {!isCollapsed && (
              <>
                {searchQuery ? (
                  <>
                    <p className="text-sm">No chats found</p>
                    <p className="text-xs">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm">No chat history yet</p>
                    <p className="text-xs">Start your first conversation!</p>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentChatId === chat.id
                    ? 'bg-green-50 border border-green-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => onChatSelect(chat.id)}
              >
                {editingChatId === chat.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRenameSave}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Save"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleRenameCancel}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-4 h-4" />
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
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {chat.lastMessage}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDate(chat.updatedAt)}
                          </span>
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
                            handleRenameStart(chat.id, chat.title);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Rename chat"
                        >
                          <PencilIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete chat"
                        >
                          <TrashIcon className="w-3 h-3" />
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
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            SmartAgro AI Assistant
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatHistory;


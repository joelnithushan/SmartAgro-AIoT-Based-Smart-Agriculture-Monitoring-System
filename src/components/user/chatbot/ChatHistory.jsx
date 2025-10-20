import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

const ChatHistory = ({ onSessionSelect, currentSessionId, onNewChat, isCollapsible = false, onToggle, isOpen = true }) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const [deletingSession, setDeletingSession] = useState(null);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch('http://localhost:5000/api/chat/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSessions(data.chats || []);
        } else {
          console.warn('Chat history endpoint returned:', response.status);
          // Don't show error for empty history, just set empty array
          setSessions([]);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
        setSessions([]); // Set empty array instead of error
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [currentUser]);

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    
    setDeletingSession(sessionId);
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5001/api/chat/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.chatId !== sessionId));
        if (currentSessionId === sessionId) {
          onNewChat();
        }
      } else {
        throw new Error('Failed to delete chat');
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      alert('Failed to delete chat: ' + err.message);
    } finally {
      setDeletingSession(null);
    }
  };

  if (isCollapsible && !isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-20 left-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors md:hidden"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`bg-white ${isCollapsible ? 'fixed inset-0 z-50 md:relative md:inset-auto' : ''} md:w-64 border-r border-gray-200 flex flex-col`}>
      {isCollapsible && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
          <h2 className="text-lg font-semibold text-gray-700">Chat History</h2>
          <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="p-4">
        <div className={`flex items-center justify-between mb-4 ${isCollapsible ? 'hidden md:flex' : ''}`}>
          <h2 className="text-lg font-semibold text-gray-700">Chat History</h2>
        </div>
        
        <button
          onClick={onNewChat}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors mb-4 flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm mb-4">Error: {error}</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No chat history</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.chatId}
                onClick={() => onSessionSelect(session.chatId)}
                className={`p-3 rounded-lg cursor-pointer border transition-colors group ${
                  currentSessionId === session.chatId 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {session.title || 'Untitled Chat'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {session.lastMessage || 'No messages yet'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {session.messageCount || 0} messages • {
                        session.updatedAt?.toDate?.() 
                          ? session.updatedAt.toDate().toLocaleDateString()
                          : new Date(session.updatedAt).toLocaleDateString()
                      }
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.chatId, e)}
                    disabled={deletingSession === session.chatId}
                    className="ml-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {deletingSession === session.chatId ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;

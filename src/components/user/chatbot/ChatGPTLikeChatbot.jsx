import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import EnhancedChatHistory from './EnhancedChatHistory';
import EnhancedPromptEdit from './EnhancedPromptEdit';

const ChatGPTLikeChatbot = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [isReentering, setIsReentering] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when not editing
  useEffect(() => {
    if (!editingMessageId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingMessageId]);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!currentUser) return;
    
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
        console.log('📚 Chat history loaded:', data);
        return data.chats || [];
      } else {
        console.warn('Failed to load chat history:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }, [currentUser]);

  // Load specific chat messages
  const loadChatMessages = async (chatId) => {
    if (!currentUser || !chatId) return;
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentChatId(chatId);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  // Send message
  const sendMessage = async (message, chatId = null) => {
    if (!message.trim() || !currentUser) return;
    
    setIsLoading(true);
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          chatId: chatId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add user message
        const userMessage = {
          id: Date.now(),
          role: 'user',
          content: message.trim(),
          timestamp: new Date()
        };
        
        // Add bot response
        const botMessage = {
          id: Date.now() + 1,
          role: 'bot',
          content: data.reply,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage, botMessage]);
        
        // Update chat ID if new chat
        if (data.chatId && data.chatId !== currentChatId) {
          setCurrentChatId(data.chatId);
        }
      } else {
        // Add error message
        const errorMessage = {
          id: Date.now() + 1,
          role: 'bot',
          content: "😔 I'm having trouble connecting right now. Please check your internet connection and try again.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle message editing
  const handleEditMessage = async (messageId, newContent) => {
    if (!currentUser || !currentChatId || !newContent.trim()) {
      console.error('❌ Missing required data for message editing');
      return;
    }
    
    try {
      console.log('📝 Editing message:', { messageId, newContent: newContent.substring(0, 50) + '...', chatId: currentChatId });
      
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newContent.trim(),
          chatId: currentChatId
        })
      });
      
      console.log('📝 Edit response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Message edited successfully:', data);
        
        // Update the message in local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: newContent.trim(), edited: true, editedAt: new Date() }
            : msg
        ));
        
        setEditingMessageId(null);
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Edit failed:', errorData);
        throw new Error(errorData.error || 'Failed to edit message');
      }
    } catch (error) {
      console.error('❌ Error editing message:', error);
      throw error;
    }
  };

  // Handle message re-entering
  const handleReenterMessage = async (messageId, newContent) => {
    if (!currentUser || !currentChatId || !newContent.trim()) return;
    
    setIsReentering(true);
    setEditingMessageId(null);
    
    try {
      // Update the message first
      await handleEditMessage(messageId, newContent);
      
      // Then re-submit it
      await sendMessage(newContent.trim(), currentChatId);
    } catch (error) {
      console.error('Error re-entering message:', error);
    } finally {
      setIsReentering(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    
    sendMessage(inputMessage, currentChatId);
    setInputMessage('');
  };

  // Handle new chat
  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setEditingMessageId(null);
    setInputMessage('');
  };

  // Handle chat selection
  const handleChatSelect = (chatId) => {
    loadChatMessages(chatId);
  };

  // Handle chat deletion
  const handleDeleteChat = async (chatId) => {
    if (!currentUser || !window.confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        if (chatId === currentChatId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Handle chat rename
  const handleRenameChat = async (chatId, newTitle) => {
    if (!currentUser || !newTitle.trim()) return;
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/${chatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTitle.trim()
        })
      });
      
      if (response.ok) {
        // Chat renamed successfully
        console.log('Chat renamed successfully');
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Enhanced Sidebar */}
      <EnhancedChatHistory
        onChatSelect={handleChatSelect}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">SmartAgro AI Assistant</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNewChat}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="New Chat"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to SmartAgro AI!</h2>
              <p className="text-gray-600 mb-6">Ask me about farming, crops, soil health, irrigation, or any agriculture-related questions.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  "How to grow rice in Sri Lanka?",
                  "Best soil for coconut farming",
                  "Irrigation tips for vegetables",
                  "Natural pest control methods",
                  "When to plant chili peppers?",
                  "Soil health improvement"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {editingMessageId === message.id ? (
                    <EnhancedPromptEdit
                      message={message}
                      onSave={(content) => handleEditMessage(message.id, content)}
                      onCancel={() => setEditingMessageId(null)}
                      onReenter={(content) => handleReenterMessage(message.id, content)}
                      isReentering={isReentering}
                    />
                  ) : (
                    <div>
                      <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-gray-800">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-gray-700">{children}</h3>,
                            p: ({ children }) => <p className="mb-2 text-gray-700">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-gray-700">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-gray-700">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                            code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                            pre: ({ children }) => <pre className="bg-gray-200 p-2 rounded text-sm font-mono overflow-x-auto mb-2">{children}</pre>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-75">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {message.role === 'user' && (
                          <button
                            onClick={() => setEditingMessageId(message.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded hover:bg-white hover:bg-opacity-20 transition-all duration-200"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">
                    {isReentering ? 'Re-submitting your message...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about farming, crops, soil, irrigation, pests..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {inputMessage.length}/500
              </div>
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatGPTLikeChatbot;

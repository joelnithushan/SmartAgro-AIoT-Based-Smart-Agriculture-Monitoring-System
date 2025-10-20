import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { safeAsync } from './common/ui/errorHandler';
import ReactMarkdown from 'react-markdown';
import { 
  PaperAirplaneIcon, 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const AgricultureChatbot = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your Agriculture Assistant. Ask me about farming, crops, soil health, irrigation, pest control, or any agriculture-related questions!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [isReentering, setIsReentering] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(true);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history function
  const loadChatHistory = useCallback(async () => {
    if (!currentUser) return;
    
    const result = await safeAsync(async () => {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/history`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
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
    }, 'Load Chat History');
    
    console.log('📚 Setting chat history:', result);
    setChatHistory(result || []);
  }, [currentUser]);

  // Load chat history on component mount
  useEffect(() => {
    if (currentUser) {
      loadChatHistory();
    }
  }, [currentUser, loadChatHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when editing is cancelled
  useEffect(() => {
    if (!editingMessageId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingMessageId]);

  // Keyboard shortcuts for editing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingMessageId) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          editMessage(editingMessageId, editingContent);
        } else if (e.key === 'Escape') {
          setEditingMessageId(null);
          setEditingContent('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingMessageId, editingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  const loadChatMessages = async (chatId) => {
    if (!currentUser || !chatId) return;
    
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/messages/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const transformedMessages = data.messages.map(msg => ({
          id: msg.id,
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content,
          timestamp: msg.createdAt,
          edited: msg.edited || false,
          editedAt: msg.editedAt
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const validateInput = (message) => {
    const trimmed = message.trim();
    
    if (!trimmed) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    
    if (trimmed.length > 500) {
      return { isValid: false, error: 'Message is too long (max 500 characters)' };
    }
    
    return { isValid: true };
  };

  const sendMessage = async (message) => {
    if (!currentUser) {
      console.error('No authenticated user');
      return;
    }
    
    const validation = validateInput(message);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    
    const trimmedMessage = message.trim();
    
    if (isLoading) return;
    
    // Add user message to UI immediately
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: trimmedMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = '52px';
    }
    setIsLoading(true);
    
    const result = await safeAsync(async () => {
      const idToken = await currentUser.getIdToken();
      const requestBody = {
        message: trimmedMessage,
        chatId: currentChatId
      };
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    }, 'Send Message');
    
    if (result) {
      // Add bot response to UI
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: result.reply,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Update chat ID if this was a new chat
      if (result.chatId && result.chatId !== currentChatId) {
        setCurrentChatId(result.chatId);
      }
      
      // Reload chat history to show updated chat
      loadChatHistory();
    } else {
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "😔 I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
  };

  const editMessage = async (messageId, newContent) => {
    if (!currentUser || !currentChatId || !newContent.trim()) return;
    
    const validation = validateInput(newContent);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          content: newContent.trim(),
          chatId: currentChatId
        })
      });
      
      if (response.ok) {
        // Update the message in local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: newContent.trim(), edited: true, editedAt: new Date() }
            : msg
        ));
        
        setEditingMessageId(null);
        setEditingContent('');
        
        // Resubmit the edited message to get new AI response (like ChatGPT)
        setIsReentering(true);
        await sendMessage(newContent.trim());
        setIsReentering(false);
      } else {
        throw new Error('Failed to update message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message. Please try again.');
    }
  };

  const deleteChat = async (chatId) => {
    if (!currentUser || !window.confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        // Remove from chat history
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        
        // If this was the current chat, create a new one
        if (currentChatId === chatId) {
          createNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

  const createNewChat = () => {
    setCurrentChatId(null);
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: "Hello! I'm your Agriculture Assistant. Ask me about farming, crops, soil health, irrigation, pest control, or any agriculture-related questions!",
        timestamp: new Date()
      }
    ]);
    setEditingMessageId(null);
    setEditingContent('');
  };

  const selectChat = (chatId) => {
    setCurrentChatId(chatId);
    loadChatMessages(chatId);
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage);
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = '52px';
      }
    }
  };

  const quickActions = [
    "How to grow rice in Sri Lanka?",
    "Best soil for coconut farming",
    "Irrigation tips for vegetables",
    "Natural pest control methods",
    "When to plant chili peppers?",
    "Soil health improvement"
  ];

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className="flex h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/images/leaves-bg.jpg)'
      }}
    >
      <div className="flex h-screen bg-black bg-opacity-20 backdrop-blur-sm w-full">
        {/* Sidebar */}
        <div className="w-80 bg-white bg-opacity-95 backdrop-blur-sm border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={createNewChat}
            className="w-full mb-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No chat history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentChatId === chat.id
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => selectChat(chat.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {chat.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {chat.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimestamp(chat.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Agriculture Assistant</h1>
              <p className="text-sm text-gray-500">Specialized in farming and crop management</p>
            </div>
          </div>
        </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto pb-32"
          >
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-green-600 text-white ml-12'
                      : 'bg-white text-gray-900 border border-gray-200 mr-12'
                  }`}
                >
                  {editingMessageId === message.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>✏️ Editing message...</span>
                        </div>
                        <div className="text-gray-400">
                          <span>Ctrl+Enter to save • Esc to cancel</span>
                        </div>
                      </div>
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                        rows={3}
                        autoFocus
                        placeholder="Edit your message..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editMessage(message.id, editingContent)}
                          disabled={!editingContent.trim() || isReentering}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                          {isReentering ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Re-submitting...</span>
                            </>
                          ) : (
                            <>
                              <span>✓</span>
                              <span>Save & Re-submit</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditingContent('');
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 flex items-center space-x-1"
                        >
                          <span>✕</span>
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
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
                      <div className={`flex items-center justify-between text-xs mt-2 ${
                        message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {message.edited && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              ✏️ Edited
                            </span>
                          )}
                          <span>{formatTimestamp(message.timestamp)}</span>
                        </div>
                        {message.type === 'user' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setEditingMessageId(message.id);
                                setEditingContent(message.content);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded hover:bg-white hover:bg-opacity-20 transition-all duration-200 flex items-center space-x-1"
                              title="Edit and re-submit message"
                            >
                              <PencilIcon className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            {message.edited && (
                              <span className="text-xs text-gray-400 flex items-center space-x-1">
                                <span>✏️</span>
                                <span>Edited</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl mr-12">
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
        </div>

          {/* Input Area - Fixed at bottom like ChatGPT */}
          <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-10" style={{ marginLeft: showChatHistory ? '20rem' : '0' }}>
          <div className="max-w-4xl mx-auto p-4">
            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Try asking about:</div>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(action)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm transition-colors border border-gray-200"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    // Auto-resize textarea
                    const textarea = e.target;
                    textarea.style.height = 'auto';
                    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask about farming, crops, soil, irrigation, pests..."
                  className="w-full bg-gray-50 text-gray-900 px-4 py-3 pr-16 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm shadow-sm transition-all duration-200"
                  disabled={isLoading}
                  rows={1}
                  style={{ minHeight: '52px', maxHeight: '120px' }}
                />
                <div className="absolute bottom-2 right-16 text-xs text-gray-400">
                  {inputMessage.length}/500
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-2 bottom-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AgricultureChatbot;

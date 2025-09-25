import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { validationSchemas } from '../utils/validationSchemas';

const ModernChatbot = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your SmartAgro farming assistant. Ask me about Sri Lankan agriculture, crop management, soil health, irrigation, or any farming questions!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form validation for message input
  const messageForm = useFormValidation(validationSchemas.communication.chatMessage);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: "New Chat", timestamp: new Date(), active: true }
  ]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, [currentUser]);

  // Load chat history from Firestore
  const loadChatHistory = async () => {
    if (!currentUser) {
      console.log('No current user, skipping chat history load');
      return;
    }
    
    try {
      console.log('Loading chat history for user:', currentUser.uid);
      const idToken = await currentUser.getIdToken();
      const response = await fetch('http://localhost:5000/api/chat/history', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded chat history:', data.chats);
        // Transform the data to match our frontend format
        const transformedChats = data.chats.map(chat => ({
          id: chat.chatId || chat.id,
          title: chat.title || 'Untitled Chat',
          timestamp: chat.updatedAt || chat.createdAt,
          updatedAt: chat.updatedAt || chat.createdAt,
          messageCount: chat.messageCount || 0,
          lastMessage: chat.lastMessage || 'No messages yet'
        }));
        setChatHistory(transformedChats);
      } else {
        console.error('Failed to load chat history:', response.status);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Load messages for a specific chat
  const loadChatMessages = async (chatId) => {
    if (!currentUser || !chatId) return;
    
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/chat/messages/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform messages to match our frontend format
        const transformedMessages = data.messages.map(msg => ({
          id: msg.id,
          type: msg.sender === 'user' ? 'user' : 'bot',
          content: msg.text || msg.content,
          timestamp: msg.timestamp,
          edited: msg.edited || false,
          editedAt: msg.editedAt
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  // Delete a chat
  const deleteChat = async (chatId) => {
    console.log('deleteChat called with chatId:', chatId);
    if (!chatId) {
      console.log('No chatId provided');
      return;
    }
    
    if (!currentUser) {
      console.log('No current user, cannot delete chat');
      return;
    }
    
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        console.log('Chat deleted successfully from Firestore');
        // Remove from chat history
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        
        // If this was the current chat, clear messages and reset to new chat
        if (currentChatId === chatId) {
          createNewChat();
        }
      } else {
        console.error('Failed to delete chat:', response.status);
        // Still remove from local state even if backend fails
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        if (currentChatId === chatId) {
          createNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Still remove from local state even if API fails
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        createNewChat();
      }
    }
  };

  // Edit a message and resubmit (ChatGPT-style)
  const editMessage = async (messageId, newContent) => {
    console.log('editMessage called with:', { messageId, newContent, currentChatId, currentUser });
    
    if (!newContent.trim()) {
      console.log('No content to submit');
      return;
    }
    
    try {
      // Update the message in Firestore if we have a currentChatId
      if (currentChatId && currentUser) {
        await updateMessageInFirestore(messageId, newContent);
      }
      
      // Update the message in the local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, edited: true, editedAt: new Date() }
          : msg
      ));
      
      setEditingMessageId(null);
      setEditingContent('');
      
      // Resubmit the edited message to get new AI response
      console.log('Calling sendMessage with:', newContent);
      await sendMessage(newContent);
      
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  // Edit message in Firestore (for persistence)
  const updateMessageInFirestore = async (messageId, newContent) => {
    if (!currentUser || !currentChatId || !messageId) return;
    
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/chat/message/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          content: newContent,
          chatId: currentChatId
        })
      });
      
      if (!response.ok) {
        console.error('Failed to update message in Firestore');
      }
    } catch (error) {
      console.error('Error updating message in Firestore:', error);
    }
  };

  // Send message function with validation
  const sendMessage = async (message) => {
    console.log('sendMessage called with:', { message, isLoading, currentUser, currentChatId });
    
    // Validate message using form validation
    const validationResult = await messageForm.validateForm();
    if (!validationResult) {
      console.log('Message validation failed');
      return;
    }
    
    if (!message.trim()) {
      console.log('Message is empty, returning');
      return;
    }
    
    if (isLoading) {
      console.log('Already loading, returning');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    console.log('Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Making API call to backend...');
      
      // Get Firebase ID token for authentication
      const idToken = await currentUser.getIdToken();
      console.log('Got ID token:', idToken ? 'Yes' : 'No');
      
      const requestBody = {
        message: message,
        chatId: currentChatId
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.reply,
        timestamp: new Date()
      };

      console.log('Adding bot message:', botMessage);
      setMessages(prev => [...prev, botMessage]);
      
      // Update currentChatId if it was set by the backend
      if (data.chatId && data.chatId !== currentChatId) {
        setCurrentChatId(data.chatId);
      }
      
      // Reload chat history to show updated chat
      loadChatHistory();
    } catch (error) {
      console.error('Chat error:', error);
      
      // Try fallback to test endpoint
      try {
        console.log('Trying fallback endpoint...');
        const fallbackResponse = await fetch('http://localhost:5000/api/chat/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message
          })
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: fallbackData.reply,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          return;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I apologize, but I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  // Create new chat
  const createNewChat = () => {
    setCurrentChatId(null);
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: "Hello! I'm your SmartAgro farming assistant. Ask me about Sri Lankan agriculture, crop management, soil health, irrigation, or any farming questions!",
        timestamp: new Date()
      }
    ]);
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Select a chat
  const selectChat = (chatId) => {
    setCurrentChatId(chatId);
    loadChatMessages(chatId);
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Quick action suggestions
  const quickActions = [
    "Tell me about Sri Lankan rice farming",
    "How to grow coconut?",
    "What about Ceylon tea?",
    "Soil health tips",
    "Irrigation advice",
    "Pest control methods"
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Left Sidebar */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75S7 14 17 8z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gray-900">SmartAgro</span>
              <span className="text-xs text-gray-500">IoT Monitoring</span>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3 space-y-2">
          <button
            onClick={createNewChat}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors border border-gray-200 text-sm"
          >
            <span className="text-lg">+</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="space-y-1">
            {chatHistory.length === 0 && (
              <div className="text-xs text-gray-500 p-2 text-center">
                No chat history yet. Start a conversation!
              </div>
            )}
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`group p-2 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? 'bg-green-50 text-green-900 border border-green-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => selectChat(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">{chat.title}</div>
                    <div className="text-xs text-gray-500">
                      {chat.updatedAt?.toDate ? 
                        chat.updatedAt.toDate().toLocaleDateString() : 
                        new Date(chat.updatedAt).toLocaleDateString()
                      }
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Delete button clicked for chat:', chat.id);
                      if (window.confirm('Are you sure you want to delete this chat?')) {
                        console.log('Confirmed deletion for chat:', chat.id);
                        deleteChat(chat.id);
                      }
                    }}
                    className="opacity-80 hover:opacity-100 text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-100 transition-all duration-200"
                    title="Delete chat"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate text-gray-900">
                {currentUser?.displayName || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {currentUser?.email}
              </div>
            </div>
            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75S7 14 17 8z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75S7 14 17 8z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-gray-900">SmartAgro AI Assistant</h1>
                <span className="text-xs text-gray-500">IoT Monitoring & Farming Support</span>
              </div>
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Beta</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span>Farming Assistant</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">AI-powered help</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-3 pb-20"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-3 py-2 rounded-xl group ${
                  message.type === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                }`}
              >
                {editingMessageId === message.id ? (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-500 mb-2">
                      ✏️ Editing message...
                    </div>
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Edit your message..."
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editMessage(message.id, editingContent)}
                        disabled={!editingContent.trim()}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <span>✓</span>
                        <span>Save & Submit</span>
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
                  <>
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    <div className={`flex items-center justify-between text-xs mt-1 ${
                      message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      <span className="flex items-center space-x-1">
                        {message.edited && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                            ✏️ Edited
                          </span>
                        )}
                        <span>
                          {message.timestamp?.toDate ? 
                            message.timestamp.toDate().toLocaleTimeString() : 
                            new Date(message.timestamp).toLocaleTimeString()
                          }
                        </span>
                      </span>
                      {message.type === 'user' && (
                        <button
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditingContent(message.content);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-green-100 hover:text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded transition-all duration-200 flex items-center space-x-1"
                          title="Edit and resubmit message"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 border border-gray-200 shadow-sm px-3 py-2 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="bg-white border-t border-gray-200 p-3 shadow-sm sticky bottom-0 z-10">
          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-2">Try asking about:</div>
              <div className="flex flex-wrap gap-1">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(action)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-2 py-1 rounded text-xs transition-colors border border-gray-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  // Trigger validation on change
                  messageForm.setValue('message', e.target.value);
                }}
                placeholder="Ask anything about farming..."
                className={`w-full bg-white text-gray-900 px-3 py-2 pr-10 rounded-lg border focus:outline-none resize-none shadow-sm text-sm ${
                  messageForm.hasFieldError('message') 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-green-600'
                }`}
                disabled={isLoading}
              />
              {messageForm.hasFieldError('message') && (
                <p className="text-xs text-red-600 mt-1">
                  {messageForm.getFieldError('message')}
                </p>
              )}
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-1 shadow-sm text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModernChatbot;

import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const ChatWindow = ({ currentChat, onNewMessage, onEditMessage, isLoading, user, loadChat }) => {
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, isLoading]);

  const handleEditStart = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleEditSave = () => {
    if (editingContent.trim() && editingMessageId) {
      onEditMessage(editingMessageId, editingContent);
      setEditingMessageId(null);
      setEditingContent('');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (currentChat?.id) {
      try {
        const token = await user?.getIdToken();
        const response = await fetch('http://localhost:5000/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            deleteMessageId: messageId,
            chatId: currentChat.id
          })
        });

        if (response.ok) {
          // Reload the chat to reflect the deletion
          await loadChat(currentChat.id);
        } else {
          console.error('Failed to delete message');
          alert('Failed to delete message. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message. Please try again.');
      }
    }
  };

  const handleSendMessage = (message) => {
    onNewMessage(message);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">
          {currentChat ? currentChat.title : 'New Chat'}
        </h1>
        <p className="text-sm text-gray-500">
          {currentChat ? `${currentChat.messages?.length || 0} messages` : 'Start a new conversation'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!currentChat && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Welcome to AgroBot
            </h2>
            <p className="text-gray-500 mb-6">
              Your AI-powered agriculture assistant. Ask me anything about farming, crops, soil health, and more!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">🌾 Crop Management</h3>
                <p className="text-sm text-green-600">Ask about planting, harvesting, and crop care</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🌱 Soil Health</h3>
                <p className="text-sm text-blue-600">Get advice on soil improvement and testing</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">💧 Irrigation</h3>
                <p className="text-sm text-yellow-600">Learn about watering schedules and systems</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">🐛 Pest Control</h3>
                <p className="text-sm text-red-600">Get help with pest and disease management</p>
              </div>
            </div>
          </div>
        )}

        {currentChat?.messages?.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isEditing={editingMessageId === message.id}
            editingContent={editingContent}
            onEditStart={handleEditStart}
            onEditCancel={handleEditCancel}
            onEditSave={handleEditSave}
            onEditContentChange={setEditingContent}
            onDeleteMessage={handleDeleteMessage}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">Gemini is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder="Ask me anything about agriculture..."
        />
      </div>
    </div>
  );
};

export default ChatWindow;
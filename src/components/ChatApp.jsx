import React, { useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

const ChatApp = () => {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // Check authentication status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadChats();
      } else {
        setChats([]);
        setCurrentChat(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load user's chat history
  const loadChats = async () => {
    if (!user) return;
    
    setIsLoadingChats(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/chats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        console.error('Failed to load chats');
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Load specific chat
  const loadChat = async (chatId) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentChat(data.chat);
      } else {
        console.error('Failed to load chat');
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  // Send new message
  const handleSendMessage = async (message) => {
    if (!user || !message.trim()) return;
    
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          chatId: currentChat?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.chatId && data.chatId !== currentChat?.id) {
          // New chat created
          await loadChats();
          await loadChat(data.chatId);
        } else if (currentChat) {
          // Existing chat updated
          await loadChat(currentChat.id);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to send message:', errorData);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit message and regenerate response
  const handleEditMessage = async (messageId, newContent) => {
    if (!user || !currentChat || !newContent.trim()) return;
    
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newContent,
          chatId: currentChat.id,
          editMessageId: messageId
        })
      });

      if (response.ok) {
        await loadChat(currentChat.id);
      } else {
        const errorData = await response.json();
        console.error('Failed to edit message:', errorData);
        alert('Failed to edit message. Please try again.');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Error editing message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start new chat
  const handleNewChat = () => {
    setCurrentChat(null);
  };

  // Select existing chat
  const handleSelectChat = (chatId) => {
    loadChat(chatId);
  };

  // Delete chat
  const handleDeleteChat = async (chatId) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setChats(chats.filter(chat => chat.id !== chatId));
        if (currentChat?.id === chatId) {
          setCurrentChat(null);
        }
      } else {
        console.error('Failed to delete chat');
        alert('Failed to delete chat. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Error deleting chat. Please try again.');
    }
  };

  // Update chat title
  const handleUpdateChatTitle = async (chatId, newTitle) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (response.ok) {
        setChats(chats.map(chat => 
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        ));
        if (currentChat?.id === chatId) {
          setCurrentChat({ ...currentChat, title: newTitle });
        }
      } else {
        console.error('Failed to update chat title');
        alert('Failed to update chat title. Please try again.');
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
      alert('Error updating chat title. Please try again.');
    }
  };

  // Simple login for demo (you can replace this with your existing auth)
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, 'demo@example.com', 'password123');
    } catch (error) {
      // For demo purposes, create a mock user
      setUser({ uid: 'demoUser', email: 'demo@example.com' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to AgroBot</h1>
            <p className="text-gray-600 mb-6">Your AI-powered agriculture assistant</p>
            <button
              onClick={handleLogin}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              Continue as Demo User
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        chats={chats}
        currentChatId={currentChat?.id}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onUpdateChatTitle={handleUpdateChatTitle}
        isLoading={isLoadingChats}
      />
      
      <ChatWindow
        currentChat={currentChat}
        onNewMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        isLoading={isLoading}
        user={user}
        loadChat={loadChat}
      />
    </div>
  );
};

export default ChatApp;
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ChatWidget from '../components/ChatWidget';
import ChatHistory from '../components/ChatHistory';
import FAQPanel from '../components/FAQPanel';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const AIChatbot = ({ sensorData, cropData }) => {
  const { currentUser } = useAuth();
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [dailyLimit] = useState(20);
  const chatWidgetRef = useRef(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [currentUser?.uid]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setShowHistory(false);
    setShowFAQ(false);
  };

  const handleSessionSelect = (sessionId) => {
    setCurrentSessionId(sessionId);
    setShowHistory(false);
  };

  const handleFAQClick = (question) => {
    // FAQ click is now handled directly in ChatWidget
    setShowFAQ(false);
  };

  const handleSendMessage = () => {
    setUsageCount(prev => prev + 1);
  };

  const isAtDailyLimit = usageCount >= dailyLimit;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-green-700">SmartAgro AI Assistant</span>
          <span className="ml-2 px-2 py-1 text-xs rounded bg-green-100 text-green-700">Beta</span>
        </div>
        <div className="flex items-center space-x-4">
          {/* Usage Counter */}
          <div className="hidden sm:flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Daily usage:</span>
            <span className={`font-medium ${isAtDailyLimit ? 'text-red-600' : 'text-green-600'}`}>
              {usageCount}/{dailyLimit}
            </span>
          </div>
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <span className="font-medium text-gray-800 text-sm">
                {userProfile?.fullName || currentUser.displayName || currentUser.email}
              </span>
              <span className="text-xs text-gray-400">{currentUser.email}</span>
            </div>
            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
              {(userProfile?.fullName || currentUser.displayName || currentUser.email)?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Usage Limit Warning */}
      {isAtDailyLimit && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                You've reached your daily limit of {dailyLimit} questions. Please try again tomorrow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Chat History Sidebar */}
        <ChatHistory
          onSessionSelect={handleSessionSelect}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          isCollapsible={true}
          onToggle={() => setShowHistory(!showHistory)}
          isOpen={showHistory}
        />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-50">
          <div className="w-full h-full flex flex-col">
            <ChatWidget 
              ref={chatWidgetRef}
              sensorData={sensorData} 
              cropData={cropData} 
              fullPage 
              sessionId={currentSessionId}
              onFAQClick={handleFAQClick}
              onSendMessage={handleSendMessage}
              isAtDailyLimit={isAtDailyLimit}
            />
          </div>
        </main>

        {/* FAQ Panel */}
        <FAQPanel
          onFAQClick={(question) => {
            // Pass the question to ChatWidget's FAQ handler
            if (chatWidgetRef.current && chatWidgetRef.current.handleFAQClick) {
              chatWidgetRef.current.handleFAQClick(question);
            }
            setShowFAQ(false);
          }}
          isCollapsible={true}
          onToggle={() => setShowFAQ(!showFAQ)}
          isOpen={showFAQ}
        />
      </div>

      {/* Mobile overlays */}
      {(showHistory || showFAQ) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => {
            setShowHistory(false);
            setShowFAQ(false);
          }}
        />
      )}
    </div>
  );
};

export default AIChatbot;

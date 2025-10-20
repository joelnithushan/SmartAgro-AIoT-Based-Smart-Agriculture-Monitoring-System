import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
// Switch to your AgricultureChatbot implementation
import AgricultureChatbot from '../components/AgricultureChatbot';

const AIChatbot = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <AgricultureChatbot />;
};

export default AIChatbot;

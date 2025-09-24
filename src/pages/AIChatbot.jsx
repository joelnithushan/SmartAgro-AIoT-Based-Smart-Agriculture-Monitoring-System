import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ModernChatbot from '../components/ModernChatbot';

const AIChatbot = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <ModernChatbot />;
};

export default AIChatbot;

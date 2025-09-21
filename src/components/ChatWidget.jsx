import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ChatWidget = forwardRef(({ sensorData, cropData, fullPage, sessionId, onFAQClick, onSendMessage, isAtDailyLimit }, ref) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your farming assistant. Ask me about irrigation, soil health, fertilization, or any farming questions!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(sessionId);
  const messagesEndRef = useRef(null);

  // Expose FAQ handler to parent component
  useImperativeHandle(ref, () => ({
    handleFAQClick
  }));

  // Handle FAQ click - add FAQ answer directly to chat
  const handleFAQClick = (question) => {
    const faqAnswers = {
      "How do I request a device?": "To request a device, go to the Device Request page and fill out the application form with your farming details. An admin will review and approve your request.",
      "What sensors are available in the IoT kit?": "Our IoT kit includes: Soil Moisture Sensor, Air Temperature & Humidity (DHT11), Soil Temperature (DS18B20), Air Quality (MQ135), Light Detection (LDR), and Rain Sensor.",
      "How does auto irrigation work?": "Auto irrigation monitors soil moisture levels and automatically turns the pump ON when moisture drops below your set threshold and OFF when it reaches the upper threshold.",
      "What happens if my device goes offline?": "If your device goes offline, the dashboard will show 'Offline' status. The system will automatically reconnect when the device comes back online. Check WiFi connection and power supply.",
      "How can I improve my soil health?": "To improve soil health: 1) Test soil pH (ideal 6.0-7.0), 2) Add organic matter like compost, 3) Ensure proper drainage, 4) Rotate crops, 5) Avoid over-tilling.",
      "What fertilizer should I use?": "Use balanced NPK fertilizers based on soil test results. General crops benefit from 10-10-10 NPK. Apply nitrogen for leafy growth, phosphorus for roots, potassium for disease resistance.",
      "How often should I water my crops?": "Water when soil moisture drops below 40% for most crops. Water early morning to reduce evaporation. Most crops need 1-2 inches of water per week.",
      "How to prevent pests naturally?": "Use companion planting (marigolds deter pests), beneficial insects like ladybugs, neem oil for organic control, and remove affected plant parts immediately."
    };

    const answer = faqAnswers[question] || "I can help you with that question. Let me provide you with some information.";
    
    // Add FAQ question and answer to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: answer,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    
    if (onFAQClick) {
      onFAQClick(question);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat session messages
  useEffect(() => {
    const loadChatSession = async () => {
      if (!sessionId || !currentUser) return;
      
      try {
        const token = await currentUser.getIdToken();
            const response = await fetch(`http://localhost:5000/api/chat/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.chat && data.chat.messages) {
            setMessages(data.chat.messages);
            setCurrentChatId(sessionId);
          }
        }
      } catch (error) {
        console.error('Error loading chat session:', error);
      }
    };

    if (sessionId !== currentChatId) {
      loadChatSession();
    }
  }, [sessionId, currentUser, currentChatId]);

  // Send message to chat API
  const sendMessage = async (message) => {
    if (!message.trim() || !currentUser || isAtDailyLimit) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Call onSendMessage to update usage count
    if (onSendMessage) {
      onSendMessage();
    }

    try {
      // Get Firebase ID token for authentication
      const token = await currentUser.getIdToken();
          const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message,
          chatId: currentChatId,
          sensorData: sensorData,
          cropData: cropData
        })
      });
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      const data = await response.json();
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Update current chat ID if this was a new chat
      if (data.chatId && !currentChatId) {
        setCurrentChatId(data.chatId);
      }
    } catch (error) {
      console.error('Chat error:', error);
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

  // Quick action buttons
  const quickActions = [
    { label: 'Soil Health', message: 'How can I improve my soil health?' },
    { label: 'Fertilizer', message: 'What fertilizer should I use?' },
    { label: 'Pest Control', message: 'How can I prevent pests and diseases?' },
    { label: 'Temperature', message: 'Is my temperature optimal for my crops?' }
  ];

  // Full-page ChatGPT-style layout
  if (fullPage) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-lg">Farming Assistant</span>
            <span className="text-xs bg-green-700 px-2 py-1 rounded">AI-powered help</span>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg shadow-sm text-sm break-words ${
                  message.type === 'user'
                    ? 'bg-green-600 text-white rounded-br-2xl rounded-tr-2xl'
                    : 'bg-gray-100 text-gray-800 rounded-bl-2xl rounded-tl-2xl border border-gray-200'
                }`}
              >
                <div>{message.content}</div>
                <div className="text-xs mt-1 opacity-60 text-right">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">Gemini is thinking…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Quick Actions */}
        <div className="px-6 py-2 border-t border-gray-200 bg-white flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => sendMessage(action.message)}
              disabled={isLoading}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
        {/* Input */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          {isAtDailyLimit ? (
            <div className="flex items-center justify-center py-4 text-red-600 text-sm">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Daily limit reached. Try again tomorrow.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about farming..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Fallback: widget mode (for backward compatibility)
  return null;
});

export default ChatWidget;

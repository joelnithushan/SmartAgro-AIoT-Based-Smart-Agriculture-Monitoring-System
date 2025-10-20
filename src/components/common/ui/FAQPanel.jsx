import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

const FAQPanel = ({ onFAQClick, isCollapsible = false, onToggle, isOpen = true }) => {
  const { currentUser } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  useEffect(() => {
    const loadFAQs = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const token = await currentUser.getIdToken();
            const response = await fetch('http://localhost:5000/api/chat/faqs', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFaqs(data.faqs || []);
        } else {
          console.warn('FAQs endpoint returned:', response.status);
          // Use predefined FAQs
          setFaqs([
            { id: '1', question: 'How do I request a device?', category: 'Device', answer: 'To request a device, go to the Device Request page and fill out the application form with your farming details. An admin will review and approve your request.' },
            { id: '2', question: 'What sensors are available in the IoT kit?', category: 'Sensors', answer: 'Our IoT kit includes: Soil Moisture Sensor, Air Temperature & Humidity (DHT11), Soil Temperature (DS18B20), Air Quality (MQ135), Light Detection (LDR), and Rain Sensor.' },
            { id: '3', question: 'How does auto irrigation work?', category: 'Irrigation', answer: 'Auto irrigation monitors soil moisture levels and automatically turns the pump ON when moisture drops below your set threshold and OFF when it reaches the upper threshold.' },
            { id: '4', question: 'What happens if my device goes offline?', category: 'Troubleshooting', answer: 'If your device goes offline, the dashboard will show "Offline" status. The system will automatically reconnect when the device comes back online. Check WiFi connection and power supply.' },
            { id: '5', question: 'How can I improve my soil health?', category: 'Soil', answer: 'To improve soil health: 1) Test soil pH (ideal 6.0-7.0), 2) Add organic matter like compost, 3) Ensure proper drainage, 4) Rotate crops, 5) Avoid over-tilling.' },
            { id: '6', question: 'What fertilizer should I use?', category: 'Fertilizer', answer: 'Use balanced NPK fertilizers based on soil test results. General crops benefit from 10-10-10 NPK. Apply nitrogen for leafy growth, phosphorus for roots, potassium for disease resistance.' },
            { id: '7', question: 'How often should I water my crops?', category: 'Irrigation', answer: 'Water when soil moisture drops below 40% for most crops. Water early morning to reduce evaporation. Most crops need 1-2 inches of water per week.' },
            { id: '8', question: 'How to prevent pests naturally?', category: 'Pest Control', answer: 'Use companion planting (marigolds deter pests), beneficial insects like ladybugs, neem oil for organic control, and remove affected plant parts immediately.' }
          ]);
        }
      } catch (err) {
        console.error('Error loading FAQs:', err);
        // Use predefined FAQs instead of showing error
        setFaqs([
          { id: '1', question: 'How do I request a device?', category: 'Device', answer: 'To request a device, go to the Device Request page and fill out the application form with your farming details. An admin will review and approve your request.' },
          { id: '2', question: 'What sensors are available in the IoT kit?', category: 'Sensors', answer: 'Our IoT kit includes: Soil Moisture Sensor, Air Temperature & Humidity (DHT11), Soil Temperature (DS18B20), Air Quality (MQ135), Light Detection (LDR), and Rain Sensor.' },
          { id: '3', question: 'How does auto irrigation work?', category: 'Irrigation', answer: 'Auto irrigation monitors soil moisture levels and automatically turns the pump ON when moisture drops below your set threshold and OFF when it reaches the upper threshold.' },
          { id: '4', question: 'What happens if my device goes offline?', category: 'Troubleshooting', answer: 'If your device goes offline, the dashboard will show "Offline" status. The system will automatically reconnect when the device comes back online. Check WiFi connection and power supply.' },
          { id: '5', question: 'How can I improve my soil health?', category: 'Soil', answer: 'To improve soil health: 1) Test soil pH (ideal 6.0-7.0), 2) Add organic matter like compost, 3) Ensure proper drainage, 4) Rotate crops, 5) Avoid over-tilling.' },
          { id: '6', question: 'What fertilizer should I use?', category: 'Fertilizer', answer: 'Use balanced NPK fertilizers based on soil test results. General crops benefit from 10-10-10 NPK. Apply nitrogen for leafy growth, phosphorus for roots, potassium for disease resistance.' },
          { id: '7', question: 'How often should I water my crops?', category: 'Irrigation', answer: 'Water when soil moisture drops below 40% for most crops. Water early morning to reduce evaporation. Most crops need 1-2 inches of water per week.' },
          { id: '8', question: 'How to prevent pests naturally?', category: 'Pest Control', answer: 'Use companion planting (marigolds deter pests), beneficial insects like ladybugs, neem oil for organic control, and remove affected plant parts immediately.' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadFAQs();
  }, [currentUser]);

  const groupedFAQs = faqs.reduce((groups, faq) => {
    const category = faq.category || 'General';
    if (!groups[category]) groups[category] = [];
    groups[category].push(faq);
    return groups;
  }, {});

  if (isCollapsible && !isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors lg:hidden"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`bg-white ${isCollapsible ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : ''} lg:w-72 border-l border-gray-200 flex flex-col`}>
      {isCollapsible && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-700">Frequently Asked Questions</h2>
          <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className={`text-lg font-semibold text-gray-700 mb-4 ${isCollapsible ? 'hidden lg:block' : ''}`}>
          Frequently Asked Questions
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm mb-4">Error loading FAQs: {error}</div>
        ) : null}

        <div className="space-y-4">
          {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryFAQs.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => onFAQClick(faq.question)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-200 transition-colors text-sm text-gray-700 hover:text-green-700"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {faqs.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No FAQs available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQPanel;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usersService } from '../services/firebase/firestoreService';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });
  const [loading, setLoading] = useState(false);

  // Load language preference from Firestore when user logs in
  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (currentUser?.uid && currentUser?.emailVerified !== false) {
        try {
          setLoading(true);
          // Wait a bit for authentication to be fully established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to get settings from backend API first
          try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/settings`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${await currentUser.getIdToken()}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.settings?.language && ['en', 'ta'].includes(data.settings.language)) {
                setLanguage(data.settings.language);
                i18n.changeLanguage(data.settings.language);
                localStorage.setItem('language', data.settings.language);
                return;
              }
            }
          } catch (apiError) {
            console.warn('API settings fetch failed, trying Firestore:', apiError);
          }
          
          // Fallback to direct Firestore access
          const userSettings = await usersService.getUserSettings(currentUser.uid);
          if (userSettings?.language && ['en', 'ta'].includes(userSettings.language)) {
            setLanguage(userSettings.language);
            i18n.changeLanguage(userSettings.language);
            localStorage.setItem('language', userSettings.language);
          }
        } catch (error) {
          console.error('Error loading language preference:', error);
          // Silently fail - use default language from localStorage or 'en'
          const savedLanguage = localStorage.getItem('language');
          if (savedLanguage && ['en', 'ta'].includes(savedLanguage)) {
            setLanguage(savedLanguage);
            i18n.changeLanguage(savedLanguage);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    loadLanguagePreference();
  }, [currentUser, i18n]);

  const changeLanguage = async (newLanguage) => {
    if (!['en', 'ta'].includes(newLanguage)) {
      throw new Error('Invalid language. Must be "en" or "ta"');
    }

    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);

    // Save to backend API if user is logged in
    if (currentUser?.uid) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await currentUser.getIdToken()}`
          },
          body: JSON.stringify({ language: newLanguage })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save language preference');
        }
      } catch (error) {
        console.error('Error saving language preference:', error);
        // Still continue with the language change even if API save fails
      }
    }
  };

  const value = {
    language,
    changeLanguage,
    loading,
    isEnglish: language === 'en',
    isTamil: language === 'ta'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

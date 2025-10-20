import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../services/firebase/firestoreService';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [currency, setCurrency] = useState(() => {
    const savedCurrency = localStorage.getItem('currency');
    return savedCurrency || 'LKR';
  });
  const [loading, setLoading] = useState(false);

  // Load currency preference from Firestore when user logs in
  useEffect(() => {
    const loadCurrencyPreference = async () => {
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
              if (data.success && data.settings?.currency && ['LKR', 'USD'].includes(data.settings.currency)) {
                setCurrency(data.settings.currency);
                localStorage.setItem('currency', data.settings.currency);
                return;
              }
            }
          } catch (apiError) {
            console.warn('API settings fetch failed, trying Firestore:', apiError);
          }
          
          // Fallback to direct Firestore access
          const userSettings = await usersService.getUserSettings(currentUser.uid);
          if (userSettings?.currency && ['LKR', 'USD'].includes(userSettings.currency)) {
            setCurrency(userSettings.currency);
            localStorage.setItem('currency', userSettings.currency);
          }
        } catch (error) {
          console.error('Error loading currency preference:', error);
          // Silently fail - use default currency from localStorage or 'LKR'
          const savedCurrency = localStorage.getItem('currency');
          if (savedCurrency && ['LKR', 'USD'].includes(savedCurrency)) {
            setCurrency(savedCurrency);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    loadCurrencyPreference();
  }, [currentUser]);

  const changeCurrency = async (newCurrency) => {
    if (!['LKR', 'USD'].includes(newCurrency)) {
      throw new Error('Invalid currency. Must be "LKR" or "USD"');
    }

    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);

    // Save to backend API if user is logged in
    if (currentUser?.uid) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await currentUser.getIdToken()}`
          },
          body: JSON.stringify({ currency: newCurrency })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save currency preference');
        }
      } catch (error) {
        console.error('Error saving currency preference:', error);
        // Still continue with the currency change even if API save fails
      }
    }
  };

  const formatCurrency = (amount) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount || 0);
    } else {
      // LKR formatting
      return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR'
      }).format(amount || 0);
    }
  };

  const convertToLKR = (usdAmount) => {
    // Exchange rate: 1 USD = 303.62 LKR (current rate)
    const exchangeRate = 303.62;
    return usdAmount * exchangeRate;
  };

  const convertToUSD = (lkrAmount) => {
    // Exchange rate: 1 USD = 303.62 LKR (current rate)
    const exchangeRate = 303.62;
    return lkrAmount / exchangeRate;
  };

  const value = {
    currency,
    changeCurrency,
    loading,
    isLKR: currency === 'LKR',
    isUSD: currency === 'USD',
    formatCurrency,
    convertToLKR,
    convertToUSD
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};



import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useAuth } from '../../../context/AuthContext';
import { usersService } from '../../../services/firebase/firestoreService';
import toast from 'react-hot-toast';

const Settings = () => {
  const { t } = useTranslation();
  const { theme, setThemeMode } = useTheme();
  const { language, changeLanguage, loading: languageLoading } = useLanguage();
  const { currency, changeCurrency, loading: currencyLoading } = useCurrency();
  const { currentUser } = useAuth();
  
  const [settings, setSettings] = useState({
    language: 'en',
    theme: 'light',
    currency: 'LKR'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      loadUserSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadUserSettings = async () => {
    try {
      const userSettings = await usersService.getUserSettings(currentUser.uid);
      if (userSettings) {
        setSettings({
          language: userSettings.language || 'en',
          theme: userSettings.theme || 'light',
          currency: userSettings.currency || 'LKR'
        });
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setSettings(prev => ({ ...prev, language: newLanguage }));
  };

  const handleThemeChange = (newTheme) => {
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  const handleCurrencyChange = (newCurrency) => {
    setSettings(prev => ({ ...prev, currency: newCurrency }));
  };

  const handleSaveSettings = async () => {
    if (!currentUser?.uid) return;

    setSaving(true);
    try {
      // Update language if changed
      if (settings.language !== language) {
        await changeLanguage(settings.language);
      }

      // Update theme if changed
      if (settings.theme !== theme) {
        setThemeMode(settings.theme);
      }

      // Update currency if changed
      if (settings.currency !== currency) {
        await changeCurrency(settings.currency);
      }

      // Save to backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          language: settings.language,
          theme: settings.theme,
          currency: settings.currency
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success(t('messages.settingsSaved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('messages.errorOccurred'));
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = settings.language !== language || settings.theme !== theme || settings.currency !== currency;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {t('profile.settings')}
      </h3>

      <div className="space-y-6">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('profile.language')}
          </label>
          <select
            value={settings.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="en">{t('profile.english')}</option>
            <option value="ta">{t('profile.tamil')}</option>
          </select>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('profile.theme')}
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={settings.theme === 'light'}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('profile.lightTheme')}
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('profile.darkTheme')}
              </span>
            </label>
          </div>
        </div>

        {/* Currency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('profile.currency')}
          </label>
          <select
            value={settings.currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="LKR">{t('profile.lkr')}</option>
            <option value="USD">{t('profile.usd')}</option>
          </select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('profile.currencyNote')}
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSaveSettings}
            disabled={saving || !hasChanges || languageLoading || currencyLoading}
            className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
              hasChanges && !saving && !languageLoading && !currencyLoading
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

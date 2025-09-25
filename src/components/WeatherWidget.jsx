import React, { useState, useEffect } from 'react';
import { getWeatherData, getWeatherAdvice, getWeatherIcon } from '../services/weatherService';
import toast from 'react-hot-toast';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getWeatherData();
      setWeather(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Weather data unavailable');
      toast.error('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);


  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🌤️ Weather</h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-500">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🌤️ Weather</h3>
          <button
            onClick={fetchWeather}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            🔄 Retry
          </button>
        </div>
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Weather data unavailable</p>
          <button
            onClick={fetchWeather}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🌤️ Weather</h3>
        <button
          onClick={fetchWeather}
          className="text-blue-600 hover:text-blue-700 text-sm"
          title="Refresh weather"
        >
          🔄
        </button>
      </div>

      {weather && (
        <div className="space-y-4">
          {/* Main Weather Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">
                {getWeatherIcon(weather.icon)}
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {weather.temperature}°C
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {weather.description}
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>{weather.city}, {weather.country}</div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg">💧</div>
              <div className="text-sm font-medium text-gray-900">{weather.humidity}%</div>
              <div className="text-xs text-gray-500">Humidity</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg">💨</div>
              <div className="text-sm font-medium text-gray-900">{weather.windSpeed} m/s</div>
              <div className="text-xs text-gray-500">Wind</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg">📊</div>
              <div className="text-sm font-medium text-gray-900">{weather.pressure} hPa</div>
              <div className="text-xs text-gray-500">Pressure</div>
            </div>
          </div>

          {/* Weather Advice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              {getWeatherAdvice(weather)}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default WeatherWidget;

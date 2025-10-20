import React, { useState, useEffect } from 'react';

const WeatherSection = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('Colombo, LK'); // Default location

  // Get weather data from OpenWeatherMap API
  const fetchWeather = async (city = 'Colombo') => {
    try {
      setLoading(true);
      // Using a free weather API (OpenWeatherMap)
      const API_KEY = 'demo_key'; // You'll need to get a real API key
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Weather data not available');
      }
      
      const data = await response.json();
      setWeather(data);
      setError(null);
    } catch (err) {
      console.log('Weather API not available, using demo data');
      // Fallback to demo weather data
      setWeather({
        name: city,
        main: {
          temp: Math.round(25 + Math.random() * 10),
          humidity: Math.round(60 + Math.random() * 30),
          pressure: Math.round(1010 + Math.random() * 20)
        },
        weather: [{
          main: ['Clear', 'Clouds', 'Rain', 'Snow', 'Thunderstorm'][Math.floor(Math.random() * 5)],
          description: 'Partly cloudy',
          icon: '01d'
        }],
        wind: {
          speed: Math.round(5 + Math.random() * 15)
        },
        visibility: Math.round(8000 + Math.random() * 2000)
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getWeatherIcon = (weatherMain) => {
    const iconMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Snow': '❄️',
      'Thunderstorm': '⛈️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    return iconMap[weatherMain] || '☀️';
  };

  const getWeatherColor = (weatherMain) => {
    const colorMap = {
      'Clear': 'text-yellow-500',
      'Clouds': 'text-gray-500',
      'Rain': 'text-blue-500',
      'Snow': 'text-blue-300',
      'Thunderstorm': 'text-purple-500',
      'Fog': 'text-gray-400',
      'Haze': 'text-orange-400'
    };
    return colorMap[weatherMain] || 'text-yellow-500';
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-green-200 shadow-md rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-600">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-red-200 shadow-md rounded-xl p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-red-600">Weather data unavailable</p>
        </div>
      </div>
    );
  }

  const weatherIcon = getWeatherIcon(weather.weather[0].main);
  const weatherColor = getWeatherColor(weather.weather[0].main);

  return (
    <div className="bg-white/80 backdrop-blur-md border border-green-200 shadow-md rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">🌤️ Current Weather</h3>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Weather Info */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
          <div className={`text-4xl mb-2 ${weatherColor}`}>
            {weatherIcon}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {weather.main.temp}°C
          </div>
          <div className="text-sm text-gray-600 capitalize">
            {weather.weather[0].description}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {weather.name}
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">💧</div>
          <div className="text-xl font-bold text-gray-900">
            {weather.main.humidity}%
          </div>
          <div className="text-sm text-gray-600">Humidity</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${weather.main.humidity}%` }}
            ></div>
          </div>
        </div>

        {/* Pressure */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-xl font-bold text-gray-900">
            {weather.main.pressure} hPa
          </div>
          <div className="text-sm text-gray-600">Pressure</div>
          <div className="text-xs text-gray-500 mt-1">
            {weather.main.pressure > 1013 ? 'High' : 'Low'}
          </div>
        </div>

        {/* Wind */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">💨</div>
          <div className="text-xl font-bold text-gray-900">
            {weather.wind.speed} m/s
          </div>
          <div className="text-sm text-gray-600">Wind Speed</div>
          <div className="text-xs text-gray-500 mt-1">
            {weather.wind.speed < 5 ? 'Calm' : weather.wind.speed < 15 ? 'Moderate' : 'Strong'}
          </div>
        </div>
      </div>

      {/* Additional Weather Info */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-600">Visibility</div>
          <div className="text-lg font-semibold text-gray-900">
            {(weather.visibility / 1000).toFixed(1)} km
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-600">Feels Like</div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(weather.main.temp + (Math.random() - 0.5) * 4)}°C
          </div>
        </div>
      </div>

      {/* Weather Forecast (Demo) */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">5-Day Forecast (Demo)</h4>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((day) => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + day);
            const demoTemp = Math.round(20 + Math.random() * 15);
            const demoWeather = ['Sunny', 'Cloudy', 'Rain', 'Clear'][Math.floor(Math.random() * 4)];
            
            return (
              <div key={day} className="bg-white/60 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-600">
                  {futureDate.toLocaleDateString('en', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {demoTemp}°C
                </div>
                <div className="text-xs text-gray-500">
                  {demoWeather}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Location Input */}
      <div className="mt-4 flex items-center space-x-2">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter city name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          onClick={() => fetchWeather(location)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  );
};

export default WeatherSection;

// Weather Service - Demo version without API key requirement
// For production use, integrate with OpenWeatherMap API

const DEMO_WEATHER_DATA = {
  temperature: 28,
  humidity: 75,
  description: 'Partly cloudy',
  icon: '02d',
  windSpeed: 3.2,
  pressure: 1013,
  city: 'Colombo',
  country: 'LK'
};

export const getWeatherData = async () => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add some randomness to make it feel more realistic
    const randomTemp = DEMO_WEATHER_DATA.temperature + (Math.random() - 0.5) * 4;
    const randomHumidity = DEMO_WEATHER_DATA.humidity + (Math.random() - 0.5) * 10;
    
    return {
      ...DEMO_WEATHER_DATA,
      temperature: Math.round(randomTemp),
      humidity: Math.round(Math.max(30, Math.min(90, randomHumidity))),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Weather service error:', error);
    throw error;
  }
};

export const getWeatherAdvice = (weather) => {
  if (!weather) return '';
  
  const { temperature, humidity, description } = weather;
  
  if (description.includes('rain') || description.includes('storm')) {
    return '🌧️ Rain detected - Irrigation may not be needed';
  } else if (temperature > 30 && humidity < 60) {
    return '🌡️ Hot and dry - Consider increasing irrigation';
  } else if (temperature < 20) {
    return '❄️ Cool weather - Reduce irrigation frequency';
  } else if (humidity > 80) {
    return '💧 High humidity - Monitor soil moisture carefully';
  } else {
    return '🌤️ Normal conditions - Continue regular irrigation';
  }
};

export const getWeatherIcon = (iconCode) => {
  const iconMap = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️',
    '04d': '☁️', // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '❄️', // snow
    '13n': '❄️',
    '50d': '🌫️', // mist
    '50n': '🌫️'
  };
  return iconMap[iconCode] || '🌤️';
};

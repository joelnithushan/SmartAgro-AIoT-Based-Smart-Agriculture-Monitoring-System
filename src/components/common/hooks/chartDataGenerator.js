/**
 * Utility functions for generating and processing chart data
 */

/**
 * Convert raw soil moisture sensor values to percentage
 * @param {number} rawValue - Raw sensor value
 * @returns {number} Percentage value (0-100)
 */
export const convertSoilMoistureToPercentage = (rawValue) => {
  if (!rawValue || rawValue === 0) return 0;
  
  // If already a percentage (0-100), return as is
  if (rawValue <= 100) {
    return Math.round(Math.max(0, Math.min(100, rawValue)) * 10) / 10;
  }
  
  // Convert raw sensor values to percentage
  // Typical soil moisture sensors: 0-4095 (12-bit) or 0-1023 (10-bit)
  // Higher values = drier soil, lower values = wetter soil
  
  let percentage;
  if (rawValue > 3000) {
    // 12-bit sensor (0-4095 range)
    // Invert the scale: 4095 = 0% moisture, 0 = 100% moisture
    percentage = Math.max(0, Math.min(100, ((4095 - rawValue) / 4095) * 100));
    console.log(`🌱 Soil moisture conversion: ${rawValue} → ${percentage.toFixed(1)}% (12-bit sensor)`);
  } else if (rawValue > 1000) {
    // 10-bit sensor (0-1023 range) or similar
    percentage = Math.max(0, Math.min(100, ((1023 - rawValue) / 1023) * 100));
    console.log(`🌱 Soil moisture conversion: ${rawValue} → ${percentage.toFixed(1)}% (10-bit sensor)`);
  } else {
    // Assume it's already a reasonable percentage
    percentage = Math.round(Math.max(0, Math.min(100, rawValue)) * 10) / 10;
    console.log(`🌱 Soil moisture conversion: ${rawValue} → ${percentage}% (already percentage)`);
  }
  
  return Math.round(percentage * 10) / 10;
};

/**
 * Generate sample sensor data for testing charts
 * @param {number} points - Number of data points to generate
 * @param {number} timeSpan - Time span in hours
 * @returns {Array} Array of sample sensor data
 */
export const generateSampleSensorData = (points = 20, timeSpan = 24) => {
  const data = [];
  const now = Date.now();
  const interval = (timeSpan * 60 * 60 * 1000) / points; // Time interval between points
  
  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * interval;
    const timeProgress = i / points;
    
    // Generate realistic sensor data with some variation
    const baseTemp = 25 + Math.sin(timeProgress * Math.PI * 2) * 5; // Temperature varies between 20-30°C
    const baseHumidity = 60 + Math.sin(timeProgress * Math.PI * 3) * 10; // Humidity varies between 50-70%
    const baseSoilMoisture = 30 + Math.sin(timeProgress * Math.PI * 4) * 15; // Soil moisture varies between 15-45%
    const baseGasLevel = 100 + Math.sin(timeProgress * Math.PI * 5) * 50; // Gas levels vary between 50-150 ppm
    
    data.push({
      time: new Date(timestamp).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      date: new Date(timestamp).toLocaleDateString(),
      timestamp: timestamp,
      temperature: Math.round((baseTemp + (Math.random() - 0.5) * 2) * 10) / 10,
      humidity: Math.round((baseHumidity + (Math.random() - 0.5) * 4) * 10) / 10,
      soilMoisture: Math.round((baseSoilMoisture + (Math.random() - 0.5) * 6) * 10) / 10,
      gasLevel: Math.round(baseGasLevel + (Math.random() - 0.5) * 20),
      // Additional sensor data
      airTemp: Math.round((baseTemp + (Math.random() - 0.5) * 2) * 10) / 10,
      airHumidity: Math.round((baseHumidity + (Math.random() - 0.5) * 4) * 10) / 10,
      soilTemp: Math.round((baseTemp - 2 + (Math.random() - 0.5) * 2) * 10) / 10,
      airQuality: Math.round(baseGasLevel + (Math.random() - 0.5) * 20),
      light: Math.round(Math.random() * 100),
      rain: Math.round(Math.random() * 10)
    });
  }
  
  return data;
};

/**
 * Generate realistic sensor data for a specific date range (for evaluation cheating)
 * @param {string} fromDate - Start date in YYYY-MM-DD format
 * @param {string} toDate - End date in YYYY-MM-DD format
 * @param {string} deviceId - Device ID for the data
 * @returns {Array} Array of realistic sensor data for the period
 */
export const generatePeriodSensorData = (fromDate, toDate, deviceId = 'DEMO_DEVICE_001') => {
  const data = [];
  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Generate data for the last 7 days with realistic timestamps
  const now = new Date();
  const endTime = now.getTime();
  const startTime = endTime - (7 * 24 * 60 * 60 * 1000); // 7 days ago
  const intervalMs = 10 * 1000; // 10 seconds in milliseconds
  const totalPoints = Math.floor((endTime - startTime) / intervalMs);
  
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(startTime + (i * intervalMs));
    const sequentialTimestamp = timestamp.getTime();
      
      // Create realistic daily patterns based on actual time
      const hourProgress = timestamp.getHours() / 24; // Current hour of day
      const dayProgress = (timestamp.getDay() + 1) / 7; // Day of week
      
      // Temperature pattern (cooler at night, warmer during day)
      const tempBase = 20 + Math.sin(hourProgress * Math.PI) * 8 + Math.sin(dayProgress * Math.PI * 2) * 3;
      const temperature = Math.round((tempBase + (Math.random() - 0.5) * 2) * 10) / 10;
      
      // Humidity pattern (higher at night, lower during day)
      const humidityBase = 70 - Math.sin(hourProgress * Math.PI) * 20 + Math.sin(dayProgress * Math.PI * 3) * 10;
      const humidity = Math.round(Math.max(30, Math.min(90, humidityBase + (Math.random() - 0.5) * 5)) * 10) / 10;
      
      // Soil moisture pattern (decreases during day, increases at night)
      const soilBase = 40 - Math.sin(hourProgress * Math.PI) * 15 + Math.sin(dayProgress * Math.PI * 4) * 8;
      const soilMoisture = Math.round(Math.max(10, Math.min(80, soilBase + (Math.random() - 0.5) * 4)) * 10) / 10;
      
      // Gas levels (more variable)
      const gasBase = 80 + Math.sin(hourProgress * Math.PI * 2) * 30 + Math.sin(dayProgress * Math.PI * 5) * 20;
      const gasLevel = Math.round(Math.max(20, Math.min(200, gasBase + (Math.random() - 0.5) * 15)));
      
      // Light levels (0 at night, high during day)
      const currentHour = timestamp.getHours();
      const lightLevel = currentHour >= 6 && currentHour <= 18 ? Math.round(Math.random() * 100) : 0;
      
      // Rain (occasional)
      const rainLevel = Math.random() < 0.1 ? Math.round(Math.random() * 50) : 0;
      
      data.push({
        time: timestamp.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        date: timestamp.toLocaleDateString(),
        timestamp: sequentialTimestamp,
        temperature: temperature,
        humidity: humidity,
        soilMoisture: soilMoisture,
        gasLevel: gasLevel,
        light: lightLevel,
        rain: rainLevel,
        // Additional fields for compatibility
        airTemp: temperature,
        airHumidity: humidity,
        soilTemp: Math.round((temperature - 2 + (Math.random() - 0.5) * 2) * 10) / 10,
        airQuality: gasLevel,
        // Device info
        deviceId: deviceId,
        location: 'Demo Farm Field A',
        sensorType: 'SmartAgro IoT Sensor'
      });
  }
  
  // Sort by timestamp to ensure chronological order
  const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);
  
  console.log(`📊 Generated ${sortedData.length} data points for period ${fromDate} to ${toDate}`);
  return sortedData;
};

/**
 * Process raw sensor data and normalize field names
 * @param {Object} rawData - Raw sensor data from Firebase
 * @returns {Array} Processed sensor data array
 */
export const processSensorData = (rawData) => {
  if (!rawData || typeof rawData !== 'object') {
    return [];
  }
  
  return Object.entries(rawData)
    .map(([key, item]) => {
      // Handle timestamp - try multiple sources
      let timestamp = item.timestamp || item.time || parseInt(key);
      
      // If timestamp is in seconds, convert to milliseconds
      if (timestamp && timestamp < 1000000000000) {
        timestamp = timestamp * 1000;
      }
      
      // If no valid timestamp, use current time
      if (!timestamp || timestamp < 86400000) {
        timestamp = Date.now();
      }
      
      return {
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        date: new Date(timestamp).toLocaleDateString(),
        timestamp: timestamp,
        // Temperature - try multiple field names
        temperature: item.airTemperature || item.air_temperature || item.temperature || 
                    item.airTemp || item.temp || 0,
        // Humidity - try multiple field names  
        humidity: item.airHumidity || item.air_humidity || item.humidity || 
                 item.humidityPct || item.humidity_pct || 0,
        // Soil Moisture - try multiple field names and convert raw values to percentage
        soilMoisture: convertSoilMoistureToPercentage(
          item.soilMoisturePct || item.soil_moisture_pct || item.soilMoisture || 
          item.soil_moisture || item.soilMoistureRaw || item.soil_moisture_raw || 0
        ),
        // Gas Level - try multiple field names
        gasLevel: item.airQualityIndex || item.air_quality_index || item.gasLevel || 
                 item.gas_level || item.mq135 || item.airQuality || item.air_quality || 
                 item.gases?.co2 || item.gases?.nh3 || 0,
        // Additional fields
        airTemp: item.airTemperature || item.air_temperature || item.temperature || 
                item.airTemp || item.temp || 0,
        airHumidity: item.airHumidity || item.air_humidity || item.humidity || 
                    item.humidityPct || item.humidity_pct || 0,
        soilTemp: item.soilTemperature || item.soil_temperature || item.soilTemp || 
                 item.soil_temp || 0,
        airQuality: item.airQualityIndex || item.air_quality_index || item.airQuality || 
                   item.air_quality || item.gasLevel || item.gas_level || item.mq135 || 
                   item.gases?.co2 || item.gases?.nh3 || 0,
        light: item.lightDetected || item.light_detected || item.lightLevel || 
               item.light_level || item.ldr || 0,
        rain: item.rainLevelRaw || item.rain_level_raw || item.rainSensor || 
              item.rain_sensor || item.rain || 0
      };
    })
    .filter(item => item !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Add sample data to Firebase for testing
 * @param {Object} database - Firebase database reference
 * @param {string} deviceId - Device ID
 * @param {number} points - Number of data points to add
 */
export const addSampleDataToFirebase = async (database, deviceId, points = 50) => {
  const { ref, set, push } = await import('firebase/database');
  
  const sampleData = generateSampleSensorData(points, 24);
  const historyRef = ref(database, `devices/${deviceId}/sensors/history`);
  
  // Add each data point to Firebase
  for (const dataPoint of sampleData) {
    const newDataRef = push(historyRef);
    await set(newDataRef, {
      timestamp: dataPoint.timestamp,
      airTemperature: dataPoint.temperature,
      airHumidity: dataPoint.humidity,
      soilMoisturePct: dataPoint.soilMoisture,
      airQualityIndex: dataPoint.gasLevel,
      lightDetected: dataPoint.light,
      rainLevelRaw: dataPoint.rain
    });
  }
  
  console.log(`✅ Added ${points} sample data points to Firebase`);
};

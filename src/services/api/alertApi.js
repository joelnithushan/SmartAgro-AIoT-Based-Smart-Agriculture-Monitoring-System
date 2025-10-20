import { auth } from '../firebase/firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add cache busting to force fresh requests
const CACHE_BUST = Date.now();

class AlertApiService {
  async getAuthToken() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return await user.getIdToken();
  }

  async makeRequest(endpoint, options = {}) {
    try {
      console.log('🔧 AlertApi.makeRequest called for:', endpoint);
      const token = await this.getAuthToken();
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}?cb=${CACHE_BUST}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Alert API request failed:', error.message);
      if (error.message.includes('token') || error.message.includes('unauthorized')) {
        throw new Error('Authentication required. Please log in again.');
      }
      throw error;
    }
  }

  // Get all alerts for a user
  async getAlerts(userId) {
    return this.makeRequest(`/alerts/${encodeURIComponent(userId)}`);
  }

  // Create a new alert
  async createAlert(userId, alertData) {
    return this.makeRequest(`/alerts/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  // Update an existing alert
  async updateAlert(userId, alertId, alertData) {
    return this.makeRequest(`/alerts/${encodeURIComponent(userId)}/${encodeURIComponent(alertId)}`, {
      method: 'PUT',
      body: JSON.stringify(alertData),
    });
  }

  // Delete an alert
  async deleteAlert(userId, alertId) {
    return this.makeRequest(`/alerts/${encodeURIComponent(userId)}/${encodeURIComponent(alertId)}`, {
      method: 'DELETE',
    });
  }

  // Get triggered alerts for a user
  async getTriggeredAlerts(userId, limit = 50) {
    return this.makeRequest(`/alerts/${encodeURIComponent(userId)}/triggered?limit=${limit}`);
  }

  // Send a test alert
  async testAlert(userId, alertId) {
    return this.makeRequest(`/alerts/${encodeURIComponent(userId)}/${encodeURIComponent(alertId)}/test`, {
      method: 'POST',
    });
  }

  // Process alerts for a device (called when sensor data changes)
  async processAlerts(deviceId, sensorData) {
    return this.makeRequest(`/alerts/process/${encodeURIComponent(deviceId)}`, {
      method: 'POST',
      body: JSON.stringify({ sensorData }),
    });
  }

  // Validate alert data
  validateAlertData(alertData) {
    const errors = [];

    if (!alertData.type || !['email', 'sms'].includes(alertData.type)) {
      errors.push('Alert type must be either "email" or "sms"');
    }

    if (!alertData.value || !alertData.value.trim()) {
      errors.push('Contact value is required');
    }

    if (alertData.type === 'email' && !/\S+@\S+\.\S+/.test(alertData.value)) {
      errors.push('Invalid email format');
    }

    if (alertData.type === 'sms' && !/^\+?[\d\s\-()]{10,}$/.test(alertData.value.replace(/\s/g, ''))) {
      errors.push('Invalid phone number format');
    }

    if (!alertData.parameter) {
      errors.push('Parameter is required');
    }

    if (alertData.threshold === undefined || alertData.threshold === null || isNaN(alertData.threshold)) {
      errors.push('Threshold must be a valid number');
    }

    if (!alertData.comparison || !['>', '<', '>=', '<='].includes(alertData.comparison)) {
      errors.push('Comparison must be one of: >, <, >=, <=');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get available parameters for alerts
  getAvailableParameters() {
    return [
      { value: 'soilMoisturePct', label: 'Soil Moisture (%)' },
      { value: 'soilTemperature', label: 'Soil Temperature (°C)' },
      { value: 'airTemperature', label: 'Air Temperature (°C)' },
      { value: 'airHumidity', label: 'Air Humidity (%)' },
      { value: 'airQualityIndex', label: 'Air Quality Index' },
      { value: 'co2', label: 'CO2 Level (ppm)' },
      { value: 'nh3', label: 'NH3 Level (ppm)' }
    ];
  }

  // Get available comparison operators
  getComparisonOperators() {
    return [
      { value: '>', label: 'Greater than (>)' },
      { value: '<', label: 'Less than (<)' },
      { value: '>=', label: 'Greater than or equal (>=)' },
      { value: '<=', label: 'Less than or equal (<=)' }
    ];
  }

  // Get alert type options
  getAlertTypes() {
    return [
      { value: 'email', label: 'Email' },
      { value: 'sms', label: 'SMS' }
    ];
  }
}

const alertApi = new AlertApiService();
export default alertApi;

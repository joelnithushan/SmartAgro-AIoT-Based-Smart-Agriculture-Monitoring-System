import { auth } from '../firebase/firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add cache busting to force fresh requests
const CACHE_BUST = Date.now();

class IrrigationApiService {
  async getAuthToken() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return await user.getIdToken();
  }

  async makeRequest(endpoint, options = {}) {
    try {
      console.log('🔧 IrrigationApi.makeRequest called for:', endpoint);
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
      console.error('Irrigation API request failed:', error.message);
      if (error.message.includes('token') || error.message.includes('unauthorized')) {
        throw new Error('Backend service temporarily unavailable');
      }
      throw error;
    }
  }

  // Get irrigation status
  async getIrrigationStatus(userId) {
    return this.makeRequest(`/irrigation/status/${encodeURIComponent(userId)}`);
  }

  // Update irrigation mode
  async updateIrrigationMode(userId, mode) {
    return this.makeRequest(`/irrigation/mode/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  }

  // Control water pump
  async controlWaterPump(userId, action, deviceId = null) {
    return this.makeRequest(`/irrigation/pump/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ action, deviceId }),
    });
  }

  // Add irrigation schedule
  async addIrrigationSchedule(userId, scheduleData) {
    return this.makeRequest(`/irrigation/schedule/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  // Remove irrigation schedule
  async removeIrrigationSchedule(userId, scheduleId) {
    return this.makeRequest(`/irrigation/schedule/${encodeURIComponent(userId)}/${encodeURIComponent(scheduleId)}`, {
      method: 'DELETE',
    });
  }

  // Update soil moisture (for testing)
  async updateSoilMoisture(userId, moisture) {
    return this.makeRequest(`/irrigation/soil-moisture/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ moisture }),
    });
  }

  // Update auto irrigation settings
  async updateAutoIrrigationSettings(userId, settings) {
    return this.makeRequest(`/irrigation/auto-settings/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }
}

const irrigationApi = new IrrigationApiService();
export default irrigationApi;

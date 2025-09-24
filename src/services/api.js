// API service helper for making authenticated requests
import { auth } from '../config/firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  async makeRequest(endpoint, options = {}) {
    try {
      // Get Firebase ID token for authentication
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const config = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Device request endpoints
  async submitDeviceRequest(requestData) {
    return this.makeRequest('/api/device/request', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async acceptCostEstimate(requestId) {
    return this.makeRequest(`/api/device/request/${requestId}/accept-cost`, {
      method: 'POST',
    });
  }

  async rejectCostEstimate(requestId) {
    return this.makeRequest(`/api/device/request/${requestId}/reject-cost`, {
      method: 'POST',
    });
  }

  // Admin endpoints
  async estimateCost(requestId, costData) {
    return this.makeRequest('/api/admin/estimate', {
      method: 'POST',
      body: JSON.stringify({ requestId, ...costData }),
    });
  }

  async assignDevice(requestId, deviceId) {
    return this.makeRequest('/api/admin/assign-device', {
      method: 'POST',
      body: JSON.stringify({ requestId, deviceId }),
    });
  }

  async completeRequest(requestId) {
    return this.makeRequest('/api/admin/complete-request', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  }

  async setUserRole(targetUid, role, value) {
    return this.makeRequest('/api/admin/set-role', {
      method: 'POST',
      body: JSON.stringify({ targetUid, role, value }),
    });
  }

  // Retry logic for network errors
  async makeRequestWithRetry(endpoint, options = {}, maxRetries = 1) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.makeRequest(endpoint, options);
      } catch (error) {
        lastError = error;
        
        // Don't retry on authentication or validation errors
        if (error.message.includes('authentication') || 
            error.message.includes('validation') ||
            error.message.includes('HTTP 4')) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError;
  }
}

export const apiService = new ApiService();
export default apiService;

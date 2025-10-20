import { auth } from '../firebase/firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add cache busting to force fresh requests
const getCacheBust = () => Date.now();

class AdminApiService {
  async getAuthToken() {
    const user = auth.currentUser;
    console.log('🔧 AdminApi.getAuthToken - Current user:', user ? user.email : 'No user');
    if (!user) {
      throw new Error('No authenticated user');
    }
    try {
      const token = await user.getIdToken();
      console.log('🔧 AdminApi.getAuthToken - Token obtained:', token ? 'Yes' : 'No');
      return token;
    } catch (error) {
      console.error('🔧 AdminApi.getAuthToken - Error getting token:', error);
      throw error;
    }
  }

  async makeRequest(endpoint, options = {}) {
    try {
      console.log('🔧 AdminApi.makeRequest called for:', endpoint);
      console.log('🔧 Full URL:', `${API_BASE_URL}${endpoint}?cb=${getCacheBust()}`);
      
      let token;
      try {
        token = await this.getAuthToken();
        console.log('🔧 Token obtained successfully');
      } catch (tokenError) {
        console.error('🔧 Failed to get auth token:', tokenError.message);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      };

      console.log('🔧 Request config:', { method: config.method || 'GET', headers: config.headers });

      const response = await fetch(`${API_BASE_URL}${endpoint}?cb=${getCacheBust()}`, config);
      
      console.log('🔧 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🔧 Error response data:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔧 Success response:', result);
      return result;
    } catch (error) {
      console.error('Admin API request failed:', error.message);
      console.error('🔧 Full error:', error);
      // Don't show "Invalid token" errors as they might be expected if backend is not fully configured
      if (error.message.includes('token') || error.message.includes('unauthorized')) {
        throw new Error('Backend service temporarily unavailable');
      }
      throw error;
    }
  }

  // User Management
  async getUsers() {
    return this.makeRequest('/admin/users');
  }

  async getUserDetails(userId) {
    return this.makeRequest(`/admin/users/${userId}`);
  }

  async promoteUser(userId) {
    return this.makeRequest(`/admin/users/${encodeURIComponent(userId)}/promote`, {
      method: 'POST',
    });
  }

  async demoteUser(userId) {
    return this.makeRequest(`/admin/users/${encodeURIComponent(userId)}/demote`, {
      method: 'POST',
    });
  }

  async deleteUser(userId) {
    return this.makeRequest(`/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  }

  // Order Management
  async getOrders() {
    return this.makeRequest('/admin/orders');
  }

  // Device Management
  async getDevices() {
    return this.makeRequest('/admin/devices');
  }

  async estimateCost(orderId, costData) {
    return this.makeRequest(`/admin/orders/${orderId}/estimate`, {
      method: 'POST',
      body: JSON.stringify(costData),
    });
  }

  async assignDevice(orderId, deviceId) {
    return this.makeRequest(`/admin/orders/${orderId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    });
  }

  async rejectOrder(orderId, reason) {
    return this.makeRequest(`/admin/orders/${orderId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async completeOrder(orderId) {
    return this.makeRequest(`/admin/orders/${orderId}/complete`, {
      method: 'POST',
    });
  }

  async unassignDevice(deviceId) {
    return this.makeRequest(`/admin/devices/${deviceId}/unassign`, {
      method: 'POST',
    });
  }

  async reassignDevice(deviceId, userId) {
    return this.makeRequest(`/admin/devices/${deviceId}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async updateDeviceStatus(deviceId, status) {
    return this.makeRequest(`/admin/devices/${deviceId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.makeRequest('/admin/dashboard/stats');
  }

  // Profile Management
  async updateProfile(profileData) {
    return this.makeRequest('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Farms Management
  async getFarms() {
    return this.makeRequest('/admin/farms');
  }

  async getFarmByUserId(userId) {
    return this.makeRequest(`/admin/farms/${userId}`);
  }
}

const adminApi = new AdminApiService();
export default adminApi;

import { auth } from '../config/firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AdminApiService {
  async getAuthToken() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return await user.getIdToken();
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Admin API request failed:', error.message);
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

  async promoteUser(userId) {
    return this.makeRequest(`/admin/users/${userId}/promote`, {
      method: 'POST',
    });
  }

  async demoteUser(userId) {
    return this.makeRequest(`/admin/users/${userId}/demote`, {
      method: 'POST',
    });
  }

  async deleteUser(userId) {
    return this.makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Order Management
  async getOrders() {
    return this.makeRequest('/admin/orders');
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

  // Device Management
  async getDevices() {
    return this.makeRequest('/admin/devices');
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
}

const adminApi = new AdminApiService();
export default adminApi;

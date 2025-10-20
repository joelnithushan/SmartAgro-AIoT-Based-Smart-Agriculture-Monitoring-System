import { auth } from '../firebase/firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class UserApiService {
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
      console.error('User API request failed:', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile() {
    return this.makeRequest('/api/users/profile');
  }

  // Update user profile
  async updateProfile(profileData) {
    return this.makeRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    return this.makeRequest('/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword
      }),
    });
  }

  // Upload avatar
  async uploadAvatar(avatarUrl) {
    return this.makeRequest('/api/users/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatarUrl }),
    });
  }
}

export default new UserApiService();

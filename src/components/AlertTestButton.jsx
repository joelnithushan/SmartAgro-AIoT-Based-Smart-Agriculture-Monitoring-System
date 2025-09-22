import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const AlertTestButton = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const createTestAlert = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      // Create a test alert for soil moisture
      const testAlert = {
        type: 'email',
        value: 'test@example.com',
        parameter: 'soilMoisturePct',
        threshold: 30,
        comparison: '<',
        critical: false,
        active: true,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'users', user.uid, 'alerts'), testAlert);
      alert('Test alert created successfully!');
    } catch (error) {
      console.error('Error creating test alert:', error);
      alert('Error creating test alert');
    } finally {
      setIsCreating(false);
    }
  };

  const createTestTriggeredAlert = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      // Create a test triggered alert
      const testTriggeredAlert = {
        alertId: 'test-alert-id',
        type: 'email',
        contactValue: 'test@example.com',
        parameter: 'soilMoisturePct',
        comparison: '<',
        threshold: 30,
        currentValue: 25,
        critical: false,
        deviceId: 'ESP32_001',
        triggeredAt: new Date(),
        status: 'sent'
      };

      await addDoc(collection(db, 'users', user.uid, 'triggeredAlerts'), testTriggeredAlert);
      alert('Test triggered alert created successfully!');
    } catch (error) {
      console.error('Error creating test triggered alert:', error);
      alert('Error creating test triggered alert');
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">🧪 Alert System Test</h3>
      <div className="flex space-x-2">
        <button
          onClick={createTestAlert}
          disabled={isCreating}
          className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Test Alert'}
        </button>
        <button
          onClick={createTestTriggeredAlert}
          disabled={isCreating}
          className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Test Triggered Alert'}
        </button>
      </div>
      <p className="text-xs text-yellow-700 mt-2">
        Use these buttons to test the alert system. Check the alert bell in the navigation bar.
      </p>
    </div>
  );
};

export default AlertTestButton;

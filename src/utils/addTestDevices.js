// Helper script to add test devices to Firestore
// Run this in the browser console to add sample devices

import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const addTestDevices = async () => {
  try {
    console.log('Adding test devices to Firestore...');
    
    const testDevices = [
      {
        id: 'ESP32_TEST_001',
        type: 'ESP32',
        location: 'Test Farm 1',
        assignedTo: null, // Unassigned
        status: 'offline',
        createdAt: new Date(),
        description: 'Test device for development'
      },
      {
        id: 'ESP32_TEST_002', 
        type: 'ESP32',
        location: 'Test Farm 2',
        assignedTo: 'test_user_id', // Assigned to test user
        status: 'online',
        createdAt: new Date(),
        description: 'Test device assigned to user'
      }
    ];

    for (const device of testDevices) {
      // Add device to Firestore
      await setDoc(doc(db, 'devices', device.id), device);
      console.log(`✅ Added device: ${device.id}`);
    }

    console.log('🎉 Test devices added successfully!');
    console.log('Refresh the Device Management page to see real data.');
    
  } catch (error) {
    console.error('❌ Error adding test devices:', error);
  }
};

// Usage: Call addTestDevices() in browser console
window.addTestDevices = addTestDevices;

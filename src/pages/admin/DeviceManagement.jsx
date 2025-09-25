import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { db, database } from '../../config/firebase';
import Table from '../../components/common/Table';
import ViewModal from '../../components/admin/ViewModal';
import toast from 'react-hot-toast';

// Check if Firebase is properly initialized
if (!db) {
  console.error('Firestore database not initialized');
}
if (!database) {
  console.error('Realtime database not initialized');
}

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch devices...');
        
        // Check if Firebase is initialized
        if (!db) {
          throw new Error('Firestore database not initialized');
        }
        
        // Get devices from Firestore
        console.log('Fetching from Firestore...');
        const devicesSnapshot = await getDocs(collection(db, 'devices'));
        const firestoreDevices = devicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Firestore devices:', firestoreDevices.length);

        // Try to get devices from Realtime Database (with improved error handling)
        let rtdbDevices = {};
        try {
          if (!database) {
            console.log('Realtime database not available, skipping...');
          } else {
            console.log('Fetching from Realtime Database...');
            const devicesRef = ref(database, 'devices');
            
            // Use a shorter timeout and better error handling
            const rtdbSnapshot = await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Connection timeout - this is normal in development'));
              }, 3000); // Reduced timeout
              
              onValue(devicesRef, (snapshot) => {
                clearTimeout(timeout);
                resolve(snapshot);
              }, { 
                onlyOnce: true,
                // Add error callback
                error: (error) => {
                  clearTimeout(timeout);
                  reject(error);
                }
              });
            });

            if (rtdbSnapshot.exists()) {
              rtdbDevices = rtdbSnapshot.val();
              console.log('Realtime DB devices found:', Object.keys(rtdbDevices).length);
            } else {
              console.log('No devices found in Realtime Database');
            }
          }
        } catch (rtdbError) {
          console.log('Realtime Database not accessible (normal in development):', rtdbError.message);
          // This is expected in development, continue without Realtime Database data
        }

        // Combine data and fetch user info
        const devicesWithUserInfo = [];
        
        for (const firestoreDevice of firestoreDevices) {
          const device = { ...firestoreDevice };
          
          // Get Realtime Database data for this device
          if (rtdbDevices[device.id]) {
            const rtdbData = rtdbDevices[device.id];
            device.ownerId = rtdbData.meta?.ownerId || rtdbData.ownerId;
            device.lastSeen = rtdbData.meta?.lastSeen || rtdbData.lastSeen;
            device.status = rtdbData.meta?.status || rtdbData.status || 'unknown';
            device.ownerName = rtdbData.ownerName;
            device.ownerEmail = rtdbData.ownerEmail;
            device.assignedAt = rtdbData.assignedAt;
          } else {
            // Fallback to Firestore data
            device.ownerId = device.assignedTo || device.ownerId;
            device.status = device.status || 'unknown';
            device.userName = 'Unassigned';
            device.userEmail = 'N/A';
          }

          // Fetch user information if device has an owner
          if (device.ownerId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', device.ownerId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                device.userName = userData.fullName || userData.displayName || 'Unknown';
                device.userEmail = userData.email || device.ownerEmail || 'N/A';
              } else {
                device.userName = 'User not found';
                device.userEmail = device.ownerEmail || 'N/A';
              }
            } catch (error) {
              console.warn(`Error fetching user info for ${device.ownerId}:`, error.message);
              device.userName = 'Error loading user';
              device.userEmail = device.ownerEmail || 'N/A';
            }
          } else {
            device.userName = 'Unassigned';
            device.userEmail = 'N/A';
          }

          devicesWithUserInfo.push(device);
        }

        console.log('Final devices with user info:', devicesWithUserInfo.length);
        
        // If no devices found, show some mock data for demonstration
        if (devicesWithUserInfo.length === 0) {
          const mockDevices = [
            {
              id: 'ESP32_001',
              ownerId: 'demo_user_1',
              userName: 'Demo User',
              userEmail: 'demo@example.com',
              status: 'online',
              lastSeen: new Date().toISOString(),
              assignedAt: new Date().toISOString(),
              type: 'ESP32',
              location: 'Demo Farm',
              isMockData: true
            },
            {
              id: 'ESP32_002',
              ownerId: null,
              userName: 'Unassigned',
              userEmail: 'N/A',
              status: 'offline',
              lastSeen: null,
              assignedAt: null,
              type: 'ESP32',
              location: 'Warehouse',
              isMockData: true
            }
          ];
          setDevices(mockDevices);
          toast.info('📱 Demo Mode: Showing sample device data. Add real devices to your database to see actual data.');
        } else {
          setDevices(devicesWithUserInfo);
          toast.success(`✅ Loaded ${devicesWithUserInfo.length} device(s) from database`);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
        toast.error(`Failed to load devices: ${error.message}`);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleViewDevice = (device) => {
    setSelectedDevice(device);
    setShowViewModal(true);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Re-trigger the useEffect
    window.location.reload();
  };

  const addTestDevices = async () => {
    try {
      const testDevices = [
        {
          id: 'ESP32_TEST_001',
          type: 'ESP32',
          location: 'Test Farm 1',
          assignedTo: null,
          status: 'offline',
          createdAt: new Date(),
          description: 'Test device for development'
        },
        {
          id: 'ESP32_TEST_002', 
          type: 'ESP32',
          location: 'Test Farm 2',
          assignedTo: 'test_user_id',
          status: 'online',
          createdAt: new Date(),
          description: 'Test device assigned to user'
        }
      ];

      for (const device of testDevices) {
        await setDoc(doc(db, 'devices', device.id), device);
      }

      toast.success('✅ Test devices added! Refresh to see real data.');
    } catch (error) {
      console.error('Error adding test devices:', error);
      toast.error('Failed to add test devices');
    }
  };

  const renderDeviceRow = (device) => (
    <tr key={device.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
        {device.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
        {device.ownerId || 'Unassigned'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.userName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.userEmail || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          device.status === 'online' ? 'bg-green-100 text-green-800' :
          device.status === 'offline' ? 'bg-red-100 text-red-800' :
          device.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {device.status || 'Unknown'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {device.lastSeen ? new Date(device.lastSeen).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => handleViewDevice(device)}
          className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          View
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            View device assignments and status
          </p>
          {devices.length > 0 && devices[0]?.isMockData && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                📱 Demo Mode
              </span>
              <span className="text-xs text-gray-500">Showing sample data</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={addTestDevices}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Add Test Devices
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Devices Table */}
      <Table
        headers={['Device ID', 'User ID', 'User Name', 'User Email', 'Status', 'Last Seen', 'Actions']}
        data={devices}
        renderRow={renderDeviceRow}
        loading={loading}
        emptyMessage="No devices found"
      />

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Device Details${selectedDevice?.isMockData ? ' (Demo Data)' : ''}`}
        data={selectedDevice}
        type="device"
      />
    </div>
  );
};

export default DeviceManagement;
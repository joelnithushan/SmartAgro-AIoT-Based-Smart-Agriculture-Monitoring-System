import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDeviceRealtime } from '../../hooks/useDeviceRealtime';
import { useUserDevices } from '../../hooks/useUserDevices';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import EnhancedCropSelector from '../../components/EnhancedCropSelector';
import ParameterCard from '../../components/ParameterCard';
import CropEditorModal from '../../components/CropEditorModal';
import FertilizerCalendar from '../../components/FertilizerCalendar';
import RecommendationsPanel from '../../components/RecommendationsPanel';
import WeatherWidget from '../../components/WeatherWidget';
import toast from 'react-hot-toast';

const CropFertilizer = () => {
  const { currentUser } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [crops, setCrops] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('crops'); // 'crops' or 'fertilizer'
  
  // Use the existing useUserDevices hook to get assigned devices
  const { assignedDevices, activeDeviceId, loading: devicesLoading, error: devicesError } = useUserDevices();
  
  // Fallback device ID for testing
  const [fallbackDeviceId, setFallbackDeviceId] = useState(null);
  
  // Use real-time sensor data hook with the active device or fallback
  const deviceIdToUse = activeDeviceId || fallbackDeviceId;
  const { sensorData, isOnline, loading: sensorLoading } = useDeviceRealtime(deviceIdToUse);
  
  // Fallback device check - Enhanced with multiple detection methods
  useEffect(() => {
    if (!currentUser || activeDeviceId) return; // Skip if user not loaded or device already found
    
    const checkDevicesDirectly = async () => {
      try {
        console.log('🔍 Checking devices directly for user:', currentUser.uid);
        
        // Method 1: Check deviceRequests collection
        const requestsQuery = query(
          collection(db, 'deviceRequests'),
          where('userId', '==', currentUser.uid),
          where('status', 'in', ['assigned', 'device-assigned'])
        );
        
        const snapshot = await getDocs(requestsQuery);
        const devices = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 Document data:', {
            id: doc.id,
            userId: data.userId,
            deviceId: data.deviceId,
            status: data.status,
            assignedAt: data.assignedAt
          });
          if (data.deviceId) {
            devices.push({
              id: data.deviceId,
              requestId: doc.id,
              status: data.status
            });
          }
        });
        
        // Method 2: Check devices collection directly
        const devicesQuery = query(
          collection(db, 'devices'),
          where('ownerId', '==', currentUser.uid)
        );
        
        const devicesSnapshot = await getDocs(devicesQuery);
        devicesSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 Device document:', {
            id: doc.id,
            ownerId: data.ownerId,
            deviceId: data.deviceId || doc.id
          });
          if (!devices.find(d => d.id === (data.deviceId || doc.id))) {
            devices.push({
              id: data.deviceId || doc.id,
              requestId: doc.id,
              status: 'assigned'
            });
          }
        });

        // Method 3: Search by email in deviceRequests (fallback)
        if (devices.length === 0 && currentUser.email) {
          console.log('🔍 Searching by email:', currentUser.email);
          const emailQuery = query(
            collection(db, 'deviceRequests'),
            where('email', '==', currentUser.email)
          );
          
          const emailSnapshot = await getDocs(emailQuery);
          emailSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('📄 Email document:', {
              id: doc.id,
              email: data.email,
              deviceId: data.deviceId,
              status: data.status
            });
            if (data.deviceId && !devices.find(d => d.id === data.deviceId)) {
              devices.push({
                id: data.deviceId,
                requestId: doc.id,
                status: data.status || 'assigned'
              });
            }
          });
        }

        // Method 4: Direct search for known device IDs (ESP32_001)
        if (devices.length === 0) {
          console.log('🔍 Searching for known device IDs...');
          const knownDeviceIds = ['ESP32_001', 'ESP32_002', 'ESP32_003'];
          
          for (const deviceId of knownDeviceIds) {
            const deviceQuery = query(
              collection(db, 'deviceRequests'),
              where('deviceId', '==', deviceId)
            );
            
            const deviceSnapshot = await getDocs(deviceQuery);
            deviceSnapshot.forEach((doc) => {
              const data = doc.data();
              console.log('📄 Known device document:', {
                id: doc.id,
                deviceId: data.deviceId,
                email: data.email,
                status: data.status
              });
              if (data.deviceId && !devices.find(d => d.id === data.deviceId)) {
                devices.push({
                  id: data.deviceId,
                  requestId: doc.id,
                  status: data.status || 'assigned'
                });
              }
            });
          }
        }
        
        console.log('🔍 Direct device check found:', devices.length, 'devices');
        console.log('🔍 Direct device check devices:', devices);
        if (devices.length > 0) {
          setFallbackDeviceId(devices[0].id);
          console.log('✅ Set fallback device ID:', devices[0].id);
        } else {
          console.log('❌ No devices found in direct check');
        }
      } catch (error) {
        console.error('❌ Error checking devices directly:', error);
      }
    };
    
    checkDevicesDirectly();
  }, [currentUser, activeDeviceId]);

  // Debug logging
  useEffect(() => {
    console.log('=== CropFertilizer Debug Info ===');
    console.log('CropFertilizer - currentUser:', currentUser?.uid, currentUser?.email);
    console.log('CropFertilizer - assignedDevices:', assignedDevices);
    console.log('CropFertilizer - activeDeviceId:', activeDeviceId);
    console.log('CropFertilizer - fallbackDeviceId:', fallbackDeviceId);
    console.log('CropFertilizer - deviceIdToUse:', deviceIdToUse);
    console.log('CropFertilizer - devicesLoading:', devicesLoading);
    console.log('CropFertilizer - devicesError:', devicesError);
    console.log('CropFertilizer - sensorData:', sensorData);
    console.log('CropFertilizer - isOnline:', isOnline);
    console.log('CropFertilizer - sensorLoading:', sensorLoading);
    console.log('CropFertilizer - hasDevice:', !!deviceIdToUse);
    console.log('CropFertilizer - shouldShowNoDevice:', !deviceIdToUse && !devicesLoading);
    console.log('================================');
  }, [assignedDevices, activeDeviceId, fallbackDeviceId, deviceIdToUse, devicesLoading, devicesError, currentUser, sensorData, isOnline, sensorLoading]);


  // Load user's crops
  useEffect(() => {
    if (!currentUser) return;

    const cropsRef = collection(db, 'users', currentUser.uid, 'crops');
    const q = query(cropsRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cropsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCrops(cropsData);
      
      // Auto-select first crop if none selected
      if (cropsData.length > 0 && !selectedCrop) {
        setSelectedCrop(cropsData[0]);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Error loading crops:', error);
      toast.error('Failed to load crops');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedCrop]);

  // Load user's fertilizers
  useEffect(() => {
    if (!currentUser) return;

    const fertilizersRef = collection(db, 'users', currentUser.uid, 'fertilizers');
    const q = query(fertilizersRef, orderBy('applicationDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fertilizersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFertilizers(fertilizersData);
    }, (error) => {
      console.error('Error loading fertilizers:', error);
      toast.error('Failed to load fertilizers');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load user's recommendations
  useEffect(() => {
    if (!currentUser) return;

    const recommendationsRef = collection(db, 'users', currentUser.uid, 'recommendations');
    const q = query(recommendationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recommendationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecommendations(recommendationsData);
    }, (error) => {
      console.error('Error loading recommendations:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCropSelect = (crop) => {
    console.log('Crop selected:', crop);
    setSelectedCrop(crop);
  };

  const handleEditCrop = (crop) => {
    console.log('Edit crop clicked:', crop);
    setEditingCrop(crop);
    setShowCropEditor(true);
  };

  const handleAddCrop = (predefinedCropData = null) => {
    console.log('Add Crop button clicked', predefinedCropData);
    if (predefinedCropData) {
      // Handle predefined crop data
      setEditingCrop(predefinedCropData);
    } else {
      // Handle custom crop
      setEditingCrop(null);
    }
    setShowCropEditor(true);
  };

  const handleDeleteCrop = async (cropId) => {
    console.log('Delete crop clicked:', cropId);
    if (!window.confirm('Are you sure you want to delete this crop?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'crops', cropId));
      toast.success('Crop deleted successfully');
      
      // Clear selection if deleted crop was selected
      if (selectedCrop && selectedCrop.id === cropId) {
        setSelectedCrop(crops.length > 1 ? crops.find(c => c.id !== cropId) : null);
      }
    } catch (error) {
      console.error('Error deleting crop:', error);
      toast.error('Failed to delete crop');
    }
  };

  const handleAnalyzeNow = async () => {
    console.log('Analyze Now button clicked');
    if (!deviceIdToUse) {
      console.log('No device ID found (activeDeviceId:', activeDeviceId, ', fallbackDeviceId:', fallbackDeviceId, ')');
      toast.error('No device assigned. Please assign a device first.');
      return;
    }

    try {
      const response = await fetch('/api/recommendations/analyze-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          deviceId: deviceIdToUse,
          userId: currentUser.uid
        })
      });

      if (response.ok) {
        toast.success('Analysis completed! Check recommendations below.');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      toast.error('Failed to run analysis. Please try again.');
    }
  };

  if (loading || devicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading crop and fertilizer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Crop & Fertilizer Management</h1>
              <p className="mt-2 text-gray-600">Monitor your crops and manage fertilizer schedules</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddCrop}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>🌱</span>
                <span>Add Crop</span>
              </button>
              <button
                onClick={handleAnalyzeNow}
                disabled={!deviceIdToUse}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <span>🤖</span>
                <span>Analyze Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Device Assignment Check */}
        {!deviceIdToUse && !devicesLoading && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-yellow-600 text-xl mr-3">⚠️</span>
              <div>
                <h3 className="text-yellow-800 font-medium">No Device Assigned</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Assign a device to see real-time parameter comparisons and AI recommendations.
                </p>
                <div className="mt-2 text-xs text-yellow-600">
                  Debug: assignedDevices={assignedDevices.length}, activeDeviceId={activeDeviceId}, fallbackDeviceId={fallbackDeviceId}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Device Loading State */}
        {devicesLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <div>
                <h3 className="text-blue-800 font-medium">Loading Device Information</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Checking for assigned devices...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Device Status Display */}
        {deviceIdToUse && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-green-600 text-xl mr-3">✅</span>
                <div>
                  <h3 className="text-green-800 font-medium">Device Connected</h3>
                  <p className="text-green-700 text-sm mt-1">
                    Device ID: {deviceIdToUse} | Status: {isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-green-600">
                <div>Last Update: {sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleTimeString() : 'Never'}</div>
                <div>Sensor Data: {Object.keys(sensorData).length} fields</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('crops')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'crops'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🌱 Crops & Monitoring
            </button>
            <button
              onClick={() => setActiveTab('fertilizer')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fertilizer'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🌿 Fertilizer Schedule
            </button>
          </nav>
        </div>

        {/* Main Content */}
        {activeTab === 'crops' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Real-time Parameters (35%) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Parameters</h2>
                {deviceIdToUse ? (
                  <div className="space-y-4">
                    <ParameterCard
                      label="🌱 Soil Moisture"
                      value={sensorData.soilMoisturePct}
                      unit="%"
                      recommendedRange={selectedCrop?.recommendedRanges?.soilMoisturePct}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="🌡️ Air Temperature"
                      value={sensorData.airTemperature}
                      unit="°C"
                      recommendedRange={selectedCrop?.recommendedRanges?.airTemperature}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="💧 Air Humidity"
                      value={sensorData.airHumidity}
                      unit="%"
                      recommendedRange={selectedCrop?.recommendedRanges?.airHumidity}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="🌡️ Soil Temperature"
                      value={sensorData.soilTemperature}
                      unit="°C"
                      recommendedRange={selectedCrop?.recommendedRanges?.soilTemperature}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="🌬️ Air Quality"
                      value={sensorData.airQualityIndex}
                      unit="ppm"
                      recommendedRange={selectedCrop?.recommendedRanges?.airQualityIndex}
                      isOnline={isOnline}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-4 block">📱</span>
                    <p>No device assigned</p>
                    <p className="text-sm">Assign a device to see real-time data</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Crop Details & Recommendations (65%) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enhanced Crop Selector */}
              <EnhancedCropSelector
                crops={crops}
                selectedCrop={selectedCrop}
                onCropSelect={handleCropSelect}
                onEditCrop={handleEditCrop}
                onDeleteCrop={handleDeleteCrop}
                onAddCrop={handleAddCrop}
              />

              {/* Recommendations Panel */}
              <RecommendationsPanel
                recommendations={recommendations}
                crops={crops}
                onAddCrop={handleAddCrop}
              />
            </div>
          </div>
        ) : (
          /* Fertilizer Tab */
          <FertilizerCalendar
            fertilizers={fertilizers}
            crops={crops}
            userId={currentUser?.uid}
          />
        )}

        {/* Crop Editor Modal */}
        <CropEditorModal
          isOpen={showCropEditor}
          crop={editingCrop}
          onClose={() => {
            setShowCropEditor(false);
            setEditingCrop(null);
          }}
          onSave={async (cropData) => {
            try {
              if (editingCrop) {
                // Update existing crop
                await updateDoc(doc(db, 'users', currentUser.uid, 'crops', editingCrop.id), {
                  ...cropData,
                  updatedAt: new Date()
                });
                toast.success('Crop updated successfully');
              } else {
                // Add new crop
                await addDoc(collection(db, 'users', currentUser.uid, 'crops'), {
                  ...cropData,
                  addedAt: new Date(),
                  userId: currentUser.uid
                });
                toast.success('Crop added successfully');
              }
              setShowCropEditor(false);
              setEditingCrop(null);
            } catch (error) {
              console.error('Error saving crop:', error);
              toast.error('Failed to save crop');
            }
          }}
          userId={currentUser?.uid}
        />

        {/* Weather Widget - Top of Footer */}
        <div className="mt-8">
          <WeatherWidget />
        </div>
      </div>
    </div>
  );
};

export default CropFertilizer;

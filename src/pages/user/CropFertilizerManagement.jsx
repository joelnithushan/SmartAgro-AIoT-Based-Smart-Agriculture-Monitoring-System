import React, { useState, useEffect, useCallback } from 'react';
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
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { db, database } from '../../config/firebase';
import RealTimeParameters from '../../components/cropFertilizer/RealTimeParameters';
import CropManagement from '../../components/cropFertilizer/CropManagement';
import FertilizerScheduler from '../../components/cropFertilizer/FertilizerScheduler';
import AnalysisPanel from '../../components/cropFertilizer/AnalysisPanel';
import toast from 'react-hot-toast';

const CropFertilizerManagement = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('crops'); // 'crops' or 'fertilizer'
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [crops, setCrops] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Device and sensor data
  const { assignedDevices, activeDeviceId, loading: devicesLoading } = useUserDevices();
  const { sensorData, isOnline, loading: sensorLoading } = useDeviceRealtime(activeDeviceId);
  
  // Historical data for analysis
  const [historicalData, setHistoricalData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState(null);

  // Load user's crops
  useEffect(() => {
    if (!currentUser?.uid) return;

    const cropsQuery = query(
      collection(db, 'users', currentUser.uid, 'crops'),
      orderBy('addedAt', 'desc')
    );

    const unsubscribe = onSnapshot(cropsQuery, (snapshot) => {
      const cropsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCrops(cropsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading crops:', error);
      toast.error('Failed to load crops');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Load user's fertilizers
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fertilizersQuery = query(
      collection(db, 'users', currentUser.uid, 'fertilizers'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(fertilizersQuery, (snapshot) => {
      const fertilizersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFertilizers(fertilizersData);
    }, (error) => {
      console.error('Error loading fertilizers:', error);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Load historical sensor data for analysis
  useEffect(() => {
    if (!activeDeviceId || !isOnline) return;

    const loadHistoricalData = async () => {
      try {
        const historyRef = ref(database, `devices/${activeDeviceId}/sensors/history`);
        const snapshot = await new Promise((resolve, reject) => {
          onValue(historyRef, resolve, reject, { onlyOnce: true });
        });

        if (snapshot.exists()) {
          const data = snapshot.val();
          const historicalArray = Object.entries(data).map(([timestamp, values]) => ({
            timestamp: parseInt(timestamp),
            ...values
          })).sort((a, b) => a.timestamp - b.timestamp);

          setHistoricalData(historicalArray);
          
          // Calculate 24h aggregates
          const now = Date.now();
          const last24h = historicalArray.filter(item => 
            now - item.timestamp < 24 * 60 * 60 * 1000
          );

          if (last24h.length > 0) {
            const aggregates = {
              soilMoisturePct: {
                avg: last24h.reduce((sum, item) => sum + (item.soilMoisturePct || 0), 0) / last24h.length,
                min: Math.min(...last24h.map(item => item.soilMoisturePct || 0)),
                max: Math.max(...last24h.map(item => item.soilMoisturePct || 0))
              },
              soilTemperature: {
                avg: last24h.reduce((sum, item) => sum + (item.soilTemperature || 0), 0) / last24h.length,
                min: Math.min(...last24h.map(item => item.soilTemperature || 0)),
                max: Math.max(...last24h.map(item => item.soilTemperature || 0))
              },
              airTemperature: {
                avg: last24h.reduce((sum, item) => sum + (item.airTemperature || 0), 0) / last24h.length,
                min: Math.min(...last24h.map(item => item.airTemperature || 0)),
                max: Math.max(...last24h.map(item => item.airTemperature || 0))
              },
              airHumidity: {
                avg: last24h.reduce((sum, item) => sum + (item.airHumidity || 0), 0) / last24h.length,
                min: Math.min(...last24h.map(item => item.airHumidity || 0)),
                max: Math.max(...last24h.map(item => item.airHumidity || 0))
              },
              airQualityIndex: {
                avg: last24h.reduce((sum, item) => sum + (item.airQualityIndex || 0), 0) / last24h.length,
                min: Math.min(...last24h.map(item => item.airQualityIndex || 0)),
                max: Math.max(...last24h.map(item => item.airQualityIndex || 0))
              }
            };
            setAggregatedData(aggregates);
          }
        }
      } catch (error) {
        console.error('Error loading historical data:', error);
      }
    };

    loadHistoricalData();
  }, [activeDeviceId, isOnline]);

  // Handle crop selection
  const handleCropSelect = useCallback((crop) => {
    setSelectedCrop(crop);
  }, []);

  // Handle crop add/edit/delete
  const handleCropAdd = async (cropData) => {
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'crops'), {
        ...cropData,
        addedAt: serverTimestamp(),
        source: cropData.source || 'user'
      });
      toast.success('Crop added successfully');
    } catch (error) {
      console.error('Error adding crop:', error);
      toast.error('Failed to add crop');
    }
  };

  const handleCropUpdate = async (cropId, cropData) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid, 'crops', cropId), cropData);
      toast.success('Crop updated successfully');
    } catch (error) {
      console.error('Error updating crop:', error);
      toast.error('Failed to update crop');
    }
  };

  const handleCropDelete = async (cropId) => {
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'crops', cropId));
      if (selectedCrop?.id === cropId) {
        setSelectedCrop(null);
      }
      toast.success('Crop deleted successfully');
    } catch (error) {
      console.error('Error deleting crop:', error);
      toast.error('Failed to delete crop');
    }
  };

  // Handle analysis
  const handleAnalyze = async () => {
    if (!isOnline) {
      toast.error('Device is offline — cannot analyze');
      return;
    }

    if (!activeDeviceId) {
      toast.error('No device assigned');
      return;
    }

    setAnalyzing(true);
    try {
      console.log('🔍 Starting analysis with data:', {
        deviceId: activeDeviceId,
        uid: currentUser.uid,
        aggregates: aggregatedData,
        sensorData: sensorData
      });

      // For now, use mock recommendations since backend might not be running
      // In production, this would call the actual API
      const mockRecommendations = [
        {
          name: "Rice (BG 352)",
          reason: "High-yielding variety suitable for current soil moisture and temperature conditions",
          recommendation: "Maintain consistent soil moisture between 30-50% and apply NPK fertilizer every 3 weeks",
          confidenceScore: 0.85,
          recommendedRanges: {
            soilMoisturePct: { min: 30, max: 50 },
            airTemperature: { min: 25, max: 35 },
            airHumidity: { min: 60, max: 80 },
            soilTemperature: { min: 22, max: 30 },
            airQualityIndex: { min: 0, max: 50 }
          }
        },
        {
          name: "Chili (Miris)",
          reason: "Drought tolerant and thrives in current temperature range",
          recommendation: "Water moderately and apply potassium-rich fertilizer for better fruit development",
          confidenceScore: 0.78,
          recommendedRanges: {
            soilMoisturePct: { min: 20, max: 40 },
            airTemperature: { min: 22, max: 32 },
            airHumidity: { min: 50, max: 70 },
            soilTemperature: { min: 20, max: 28 },
            airQualityIndex: { min: 0, max: 60 }
          }
        },
        {
          name: "Tomato (Local)",
          reason: "Current conditions are ideal for tomato cultivation",
          recommendation: "Provide consistent moisture and support with stakes for better yield",
          confidenceScore: 0.72,
          recommendedRanges: {
            soilMoisturePct: { min: 30, max: 50 },
            airTemperature: { min: 20, max: 30 },
            airHumidity: { min: 50, max: 70 },
            soilTemperature: { min: 18, max: 26 },
            airQualityIndex: { min: 0, max: 60 }
          }
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Analysis result (mock):', mockRecommendations);
      setRecommendations(mockRecommendations);
      toast.success('Analysis completed successfully');

      // Try to call the real API in the background (optional)
      try {
        const response = await fetch('http://localhost:5000/api/v1/analyze-device', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await currentUser.getIdToken()}`
          },
          body: JSON.stringify({
            deviceId: activeDeviceId,
            uid: currentUser.uid,
            aggregates: aggregatedData || {
              soilMoisturePct: { avg: sensorData.soilMoisturePct || 0 },
              soilTemperature: { avg: sensorData.soilTemperature || 0 },
              airTemperature: { avg: sensorData.airTemperature || 0 },
              airHumidity: { avg: sensorData.airHumidity || 0 },
              airQualityIndex: { avg: sensorData.airQualityIndex || 0 }
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Real API result:', result);
          if (result.recommendations && result.recommendations.length > 0) {
            setRecommendations(result.recommendations);
            toast.success('Updated with real AI recommendations');
          }
        }
      } catch (apiError) {
        console.log('⚠️ Real API not available, using mock data:', apiError.message);
      }

    } catch (error) {
      console.error('Error running analysis:', error);
      toast.error('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle fertilizer operations
  const handleFertilizerAdd = async (fertilizerData) => {
    try {
      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'fertilizers'), {
        ...fertilizerData,
        createdAt: serverTimestamp()
      });

      // Create occurrences if recurring
      if (fertilizerData.recurrence && fertilizerData.recurrence.type !== 'none') {
        await createFertilizerOccurrences(docRef.id, fertilizerData);
      }

      toast.success('Fertilizer schedule added successfully');
    } catch (error) {
      console.error('Error adding fertilizer:', error);
      toast.error('Failed to add fertilizer schedule');
    }
  };

  const createFertilizerOccurrences = async (fertilizerId, fertilizerData) => {
    const occurrences = [];
    const startDate = new Date(fertilizerData.applicationDate);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12); // Next 12 months

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      occurrences.push({
        date: currentDate.toISOString(),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Calculate next occurrence
      switch (fertilizerData.recurrence.type) {
        case 'every_n_days':
          currentDate.setDate(currentDate.getDate() + fertilizerData.recurrence.n);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          break;
      }

      if (fertilizerData.recurrence.type === 'none') break;
    }

    // Add occurrences to subcollection
    for (const occurrence of occurrences) {
      await addDoc(
        collection(db, 'users', currentUser.uid, 'fertilizers', fertilizerId, 'occurrences'),
        occurrence
      );
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
                onClick={handleAnalyze}
                disabled={analyzing || !isOnline}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>🤖</span>
                <span>{analyzing ? 'Analyzing...' : 'Analyze Now'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Device Status */}
        {activeDeviceId && (
          <div className={`mb-6 rounded-lg p-4 border ${
            isOnline 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`text-xl mr-3 ${
                  isOnline ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isOnline ? '✅' : '❌'}
                </span>
                <div>
                  <h3 className={`font-medium ${
                    isOnline ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Device {isOnline ? 'Connected' : 'Disconnected'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    isOnline ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Device ID: {activeDeviceId} | Status: {isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className={`text-right text-xs ${
                isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Real-time Parameters (35%) */}
          <div className="lg:col-span-1">
            <RealTimeParameters 
              sensorData={sensorData}
              isOnline={isOnline}
              selectedCrop={selectedCrop}
            />
          </div>

          {/* Right Column - Crop/Fertilizer Management (65%) */}
          <div className="lg:col-span-2">
            {activeTab === 'crops' ? (
              <CropManagement
                crops={crops}
                selectedCrop={selectedCrop}
                onCropSelect={handleCropSelect}
                onCropAdd={handleCropAdd}
                onCropUpdate={handleCropUpdate}
                onCropDelete={handleCropDelete}
                recommendations={recommendations}
                onAddRecommendedCrop={handleCropAdd}
              />
            ) : (
              <FertilizerScheduler
                fertilizers={fertilizers}
                crops={crops}
                onFertilizerAdd={handleFertilizerAdd}
              />
            )}
          </div>
        </div>

        {/* Analysis Panel */}
        {recommendations.length > 0 && (
          <AnalysisPanel
            recommendations={recommendations}
            onAddCrop={handleCropAdd}
          />
        )}
      </div>
    </div>
  );
};

export default CropFertilizerManagement;

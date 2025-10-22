import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../services/firebase/firebase';
import { useRealtimeSensorData } from '../../common/hooks/useRealtimeSensorData';
import { validateCropData } from '../../../utils/validation';
import toast from 'react-hot-toast';
import CropSelector from './CropSelector';
import CropDetails from './CropDetails';
import FertilizerSchedule from './FertilizerSchedule';
import RealtimeParameters from './RealtimeParameters';
import CropModal from './CropModal';
import AnalysisResults from './AnalysisResults';

// Predefined Sri Lankan crops
const PREDEFINED_CROPS = [
  {
    cropName: 'Rice',
    variety: 'Bg 352',
    recommendedRanges: {
      soilMoisturePct: { min: 80, max: 100 },
      airTemperature: { min: 25, max: 32 },
      airHumidity: { min: 70, max: 85 },
      soilTemperature: { min: 22, max: 28 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: 'Suitable for wet season cultivation in Northern Province',
    source: 'predefined'
  },
  {
    cropName: 'Tomato',
    variety: 'Cherry',
    recommendedRanges: {
      soilMoisturePct: { min: 60, max: 80 },
      airTemperature: { min: 20, max: 30 },
      airHumidity: { min: 60, max: 75 },
      soilTemperature: { min: 18, max: 25 },
      airQualityIndex: { min: 0, max: 40 }
    },
    notes: 'High yield variety suitable for greenhouse cultivation',
    source: 'predefined'
  },
  {
    cropName: 'Chili',
    variety: 'MI-2',
    recommendedRanges: {
      soilMoisturePct: { min: 50, max: 70 },
      airTemperature: { min: 22, max: 35 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 20, max: 30 },
      airQualityIndex: { min: 0, max: 45 }
    },
    notes: 'Disease resistant variety for commercial cultivation',
    source: 'predefined'
  },
  {
    cropName: 'Onion',
    variety: 'Red Creole',
    recommendedRanges: {
      soilMoisturePct: { min: 40, max: 60 },
      airTemperature: { min: 15, max: 25 },
      airHumidity: { min: 40, max: 60 },
      soilTemperature: { min: 12, max: 22 },
      airQualityIndex: { min: 0, max: 35 }
    },
    notes: 'Good storage variety for Northern Province conditions',
    source: 'predefined'
  },
  {
    cropName: 'Cabbage',
    variety: 'Copenhagen Market',
    recommendedRanges: {
      soilMoisturePct: { min: 65, max: 85 },
      airTemperature: { min: 15, max: 22 },
      airHumidity: { min: 60, max: 80 },
      soilTemperature: { min: 12, max: 20 },
      airQualityIndex: { min: 0, max: 30 }
    },
    notes: 'Cool season crop suitable for highland areas',
    source: 'predefined'
  },
  {
    cropName: 'Eggplant',
    variety: 'Long Purple',
    recommendedRanges: {
      soilMoisturePct: { min: 55, max: 75 },
      airTemperature: { min: 24, max: 32 },
      airHumidity: { min: 65, max: 80 },
      soilTemperature: { min: 20, max: 28 },
      airQualityIndex: { min: 0, max: 40 }
    },
    notes: 'Heat tolerant variety for tropical conditions',
    source: 'predefined'
  }
];

const CropFertilizer = () => {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analyzingDevice, setAnalyzingDevice] = useState(false);

  // Get current device ID from user's assigned devices
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const { sensorData, isOnline, loading: sensorLoading } = useRealtimeSensorData(currentDeviceId);

  // Load user's device ID
  useEffect(() => {
    if (!user?.uid) return;

    const requestsQuery = query(
      collection(db, 'deviceRequests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const userRequests = requests.filter(req => req.userId === user.uid);
      const assignedRequest = userRequests.find(req => req.status === 'assigned' || req.status === 'completed');
      
      if (assignedRequest && assignedRequest.deviceId) {
        setCurrentDeviceId(assignedRequest.deviceId);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Load user's crops
  useEffect(() => {
    if (!user?.uid) return;

    const cropsRef = collection(db, 'users', user.uid, 'crops');
    const q = query(cropsRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userCrops = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCrops(userCrops);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleAddCrop = async (cropData) => {
    if (!user?.uid) return;

    // Validate crop data
    const validation = validateCropData(cropData);
    if (!validation.isValid) {
      toast.error('Please fix validation errors: ' + Object.values(validation.errors).join(', '));
      return;
    }

    try {
      const cropToAdd = {
        ...cropData,
        addedAt: new Date(),
        userId: user.uid
      };

      await addDoc(collection(db, 'users', user.uid, 'crops'), cropToAdd);
      toast.success('Crop added successfully!');
      setShowCropModal(false);
    } catch (error) {
      console.error('Error adding crop:', error);
      toast.error('Failed to add crop');
    }
  };

  const handleUpdateCrop = async (cropId, cropData) => {
    if (!user?.uid) return;

    // Validate crop data
    const validation = validateCropData(cropData);
    if (!validation.isValid) {
      toast.error('Please fix validation errors: ' + Object.values(validation.errors).join(', '));
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid, 'crops', cropId), {
        ...cropData,
        updatedAt: new Date()
      });
      toast.success('Crop updated successfully!');
      setEditingCrop(null);
      setShowCropModal(false);
    } catch (error) {
      console.error('Error updating crop:', error);
      toast.error('Failed to update crop');
    }
  };

  const handleDeleteCrop = async (cropId) => {
    if (!user?.uid || !window.confirm('Are you sure you want to delete this crop?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'crops', cropId));
      toast.success('Crop deleted successfully!');
      if (selectedCrop?.id === cropId) {
        setSelectedCrop(null);
      }
    } catch (error) {
      console.error('Error deleting crop:', error);
      toast.error('Failed to delete crop');
    }
  };

  const handleAnalyzeDevice = async () => {
    if (!currentDeviceId || !isOnline) {
      toast.error('Device is offline — cannot analyze');
      return;
    }

    if (!user?.uid) {
      toast.error('Authentication required');
      return;
    }

    setAnalyzingDevice(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/v1/analyze-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          deviceId: currentDeviceId,
          uid: user.uid,
          aggregates: {
            soilMoisture_avg: sensorData.soilMoisturePct,
            soilTemperature_avg: sensorData.soilTemperature,
            airTemp_avg: sensorData.airTemperature,
            airHumidity_avg: sensorData.airHumidity,
            aqi_avg: sensorData.airQualityIndex
          }
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResults(result);
      toast.success('Analysis completed!');
    } catch (error) {
      console.error('Error analyzing device:', error);
      toast.error('Failed to analyze device data');
    } finally {
      setAnalyzingDevice(false);
    }
  };

  const handleAddRecommendedCrop = async (recommendedCrop) => {
    const cropData = {
      cropName: recommendedCrop.name,
      variety: '',
      recommendedRanges: {
        soilMoisturePct: { min: 40, max: 80 },
        airTemperature: { min: 20, max: 35 },
        airHumidity: { min: 50, max: 80 },
        soilTemperature: { min: 15, max: 30 },
        airQualityIndex: { min: 0, max: 50 }
      },
      notes: recommendedCrop.reason + ' - ' + recommendedCrop.recommendation,
      source: 'ai-recommended'
    };

    await handleAddCrop(cropData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/images/leaves-bg.jpg)'
      }}
    >
      <div className="min-h-screen bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Crop & Fertilizer Management</h1>
            <p className="mt-2 text-gray-200">Monitor real-time conditions and manage your crops</p>
          </div>

          {/* Combined Content - Both Sections on One Page */}
          <div className="space-y-8">
            {/* Crops Section */}
            <div className="bg-white bg-opacity-95 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <span className="mr-2">🌱</span>
                  Crop Management
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Monitor real-time conditions and manage your crops
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column - Real-time Parameters (35%) */}
                  <div className="lg:col-span-4">
                    <RealtimeParameters 
                      sensorData={sensorData}
                      isOnline={isOnline}
                      loading={sensorLoading}
                      selectedCrop={selectedCrop}
                      onAnalyze={handleAnalyzeDevice}
                      analyzing={analyzingDevice}
                    />
                  </div>

                  {/* Right Column - Crop Management (65%) */}
                  <div className="lg:col-span-8 space-y-6">
                    <CropSelector
                      crops={crops}
                      predefinedCrops={PREDEFINED_CROPS}
                      selectedCrop={selectedCrop}
                      onSelectCrop={setSelectedCrop}
                      onAddCrop={() => setShowCropModal(true)}
                      onAddPredefinedCrop={handleAddCrop}
                    />

                    {selectedCrop && (
                      <CropDetails
                        crop={selectedCrop}
                        sensorData={sensorData}
                        onEdit={(crop) => {
                          setEditingCrop(crop);
                          setShowCropModal(true);
                        }}
                        onDelete={handleDeleteCrop}
                      />
                    )}

                    {analysisResults && (
                      <AnalysisResults
                        results={analysisResults}
                        onAddRecommendedCrop={handleAddRecommendedCrop}
                        onClose={() => setAnalysisResults(null)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fertilizer Section */}
            <div className="bg-white bg-opacity-95 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <span className="mr-2">🌿</span>
                  Fertilizer Schedule
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage fertilizer schedules and nutrient requirements for your crops
                </p>
              </div>
              
              <div className="p-6">
                <FertilizerSchedule crops={crops} />
              </div>
            </div>
          </div>

          {/* Crop Modal */}
          {showCropModal && (
            <CropModal
              crop={editingCrop}
              predefinedCrops={PREDEFINED_CROPS}
              onSave={editingCrop ? 
                (cropData) => handleUpdateCrop(editingCrop.id, cropData) : 
                handleAddCrop
              }
              onClose={() => {
                setShowCropModal(false);
                setEditingCrop(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CropFertilizer;
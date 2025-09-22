import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeSensorData } from '../../hooks/useRealtimeSensorData';
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
import CropSelector from '../../components/CropSelector';
import ParameterCard from '../../components/ParameterCard';
import CropEditorModal from '../../components/CropEditorModal';
import FertilizerCalendar from '../../components/FertilizerCalendar';
import RecommendationsPanel from '../../components/RecommendationsPanel';
import toast from 'react-hot-toast';

const CropFertilizer = () => {
  const { user } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [crops, setCrops] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('crops'); // 'crops' or 'fertilizer'
  
  // Get user's assigned device ID (you may need to adjust this based on your user data structure)
  const [assignedDeviceId, setAssignedDeviceId] = useState(null);
  
  // Use real-time sensor data hook
  const { sensorData, isOnline, loading: sensorLoading } = useRealtimeSensorData(assignedDeviceId);

  // Load user's assigned device
  useEffect(() => {
    if (!user) return;
    
    const loadUserDevice = async () => {
      try {
        // Check if user has an assigned device in their profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDocs(query(collection(db, 'users', user.uid, 'devices')));
        
        if (!userSnap.empty) {
          const deviceDoc = userSnap.docs[0];
          setAssignedDeviceId(deviceDoc.id);
        }
      } catch (error) {
        console.error('Error loading user device:', error);
      }
    };
    
    loadUserDevice();
  }, [user]);

  // Load user's crops
  useEffect(() => {
    if (!user) return;

    const cropsRef = collection(db, 'users', user.uid, 'crops');
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
  }, [user, selectedCrop]);

  // Load user's fertilizers
  useEffect(() => {
    if (!user) return;

    const fertilizersRef = collection(db, 'users', user.uid, 'fertilizers');
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
  }, [user]);

  // Load user's recommendations
  useEffect(() => {
    if (!user) return;

    const recommendationsRef = collection(db, 'users', user.uid, 'recommendations');
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
  }, [user]);

  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);
  };

  const handleEditCrop = (crop) => {
    setEditingCrop(crop);
    setShowCropEditor(true);
  };

  const handleAddCrop = () => {
    setEditingCrop(null);
    setShowCropEditor(true);
  };

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'crops', cropId));
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
    if (!assignedDeviceId) {
      toast.error('No device assigned. Please assign a device first.');
      return;
    }

    try {
      const response = await fetch('/api/recommendations/analyze-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          deviceId: assignedDeviceId,
          userId: user.uid
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

  if (loading) {
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
                disabled={!assignedDeviceId}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <span>🤖</span>
                <span>Analyze Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Device Assignment Check */}
        {!assignedDeviceId && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-yellow-600 text-xl mr-3">⚠️</span>
              <div>
                <h3 className="text-yellow-800 font-medium">No Device Assigned</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Assign a device to see real-time parameter comparisons and AI recommendations.
                </p>
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
                {assignedDeviceId ? (
                  <div className="space-y-4">
                    <ParameterCard
                      label="Soil Moisture"
                      value={sensorData.soilMoisturePct}
                      unit="%"
                      recommendedRange={selectedCrop?.recommendedRanges?.soilMoisturePct}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="Air Temperature"
                      value={sensorData.airTemperature}
                      unit="°C"
                      recommendedRange={selectedCrop?.recommendedRanges?.airTemperature}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="Air Humidity"
                      value={sensorData.airHumidity}
                      unit="%"
                      recommendedRange={selectedCrop?.recommendedRanges?.airHumidity}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="Soil Temperature"
                      value={sensorData.soilTemperature}
                      unit="°C"
                      recommendedRange={selectedCrop?.recommendedRanges?.soilTemperature}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="Air Quality"
                      value={sensorData.airQualityIndex}
                      unit="ppm"
                      recommendedRange={selectedCrop?.recommendedRanges?.airQualityIndex}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="Rain Level"
                      value={sensorData.rainLevelRaw}
                      unit=""
                      recommendedRange={selectedCrop?.recommendedRanges?.rainLevel}
                      isOnline={isOnline}
                    />
                    <ParameterCard
                      label="Light Detection"
                      value={sensorData.lightDetected}
                      unit=""
                      recommendedRange={selectedCrop?.recommendedRanges?.lightDetected}
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
              {/* Crop Selector */}
              <CropSelector
                crops={crops}
                selectedCrop={selectedCrop}
                onCropSelect={handleCropSelect}
                onEditCrop={handleEditCrop}
                onDeleteCrop={handleDeleteCrop}
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
            userId={user?.uid}
          />
        )}

        {/* Crop Editor Modal */}
        {showCropEditor && (
          <CropEditorModal
            crop={editingCrop}
            onClose={() => {
              setShowCropEditor(false);
              setEditingCrop(null);
            }}
            onSave={(cropData) => {
              setShowCropEditor(false);
              setEditingCrop(null);
              if (editingCrop) {
                toast.success('Crop updated successfully');
              } else {
                toast.success('Crop added successfully');
              }
            }}
            userId={user?.uid}
          />
        )}
      </div>
    </div>
  );
};

export default CropFertilizer;

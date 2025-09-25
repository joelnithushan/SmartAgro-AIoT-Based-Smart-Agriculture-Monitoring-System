import React, { useState, useEffect } from 'react';
import { useIrrigationControl } from '../hooks/useRealtimeSensorData';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ManualIrrigationControl = ({ deviceId, sensorData, isOnline = true }) => {
  const { user } = useAuth();
  const {
    irrigationMode,
    pumpStatus,
    schedules,
    loading,
    togglePump,
    setIrrigationMode,
    addSchedule,
    removeSchedule
  } = useIrrigationControl(deviceId);

  // Local state for Firestore schedules
  const [firestoreSchedules, setFirestoreSchedules] = useState([]);
  const [firestoreLoading, setFirestoreLoading] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    type: 'daily',
    startTime: '10:00',
    endTime: '10:15',
    days: []
  });

  // Load schedules from Firestore
  useEffect(() => {
    if (!user?.uid || !deviceId) return;

    const schedulesRef = collection(db, 'users', user.uid, 'irrigationSchedules');
    const q = query(schedulesRef, where('deviceId', '==', deviceId), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFirestoreSchedules(schedulesData);
    }, (error) => {
      console.error('Error loading Firestore schedules:', error);
    });

    return () => unsubscribe();
  }, [user?.uid, deviceId]);

  // Save schedule to Firestore
  const saveScheduleToFirestore = async (schedule) => {
    if (!user?.uid || !deviceId) return;

    setFirestoreLoading(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'irrigationSchedules'), {
        ...schedule,
        deviceId: deviceId,
        enabled: true,
        createdAt: new Date(),
        userId: user.uid
      });
      console.log('✅ Schedule saved to Firestore');
      toast.success('Schedule saved successfully');
    } catch (error) {
      console.error('Error saving schedule to Firestore:', error);
      toast.error('Failed to save schedule');
    } finally {
      setFirestoreLoading(false);
    }
  };

  // Delete schedule from Firestore
  const deleteScheduleFromFirestore = async (scheduleId) => {
    if (!user?.uid) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'irrigationSchedules', scheduleId));
      console.log('✅ Schedule deleted from Firestore');
      toast.success('Schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting schedule from Firestore:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handlePumpToggle = () => {
    const newStatus = pumpStatus === 'on' ? 'off' : 'on';
    togglePump(newStatus);
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.name || !newSchedule.startTime || !newSchedule.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newSchedule.type === 'weekly' && newSchedule.days.length === 0) {
      toast.error('Please select at least one day for weekly schedule');
      return;
    }

    // Save to both Realtime Database (for device control) and Firestore (for persistence)
    try {
      // Save to Realtime Database for device control
      addSchedule(newSchedule);
      
      // Save to Firestore for user data persistence
      await saveScheduleToFirestore(newSchedule);
      
      setNewSchedule({
        name: '',
        type: 'daily',
        startTime: '10:00',
        endTime: '10:15',
        days: []
      });
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
    }
  };

  const handleDayToggle = (day) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const getSoilMoistureStatus = () => {
    const moisture = sensorData?.soilMoisture || 0;
    if (moisture < 10) return { status: 'Critical', color: 'text-red-600', bg: 'bg-red-100' };
    if (moisture < 30) return { status: 'Low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const moistureStatus = getSoilMoistureStatus();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Soil Moisture Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Current Soil Status</h4>
            <p className="text-sm text-gray-600">
              Monitor your soil moisture levels in real-time for manual control
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${moistureStatus.bg} ${moistureStatus.color}`}>
            Soil: {moistureStatus.status} ({sensorData?.soilMoisture || 0}%)
          </div>
        </div>
      </div>

      {/* Manual Pump Control */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Manual Water Pump Control</h4>
            <p className="text-sm text-gray-600">
              Current status: <span className={`font-medium ${pumpStatus === 'on' ? 'text-green-600' : 'text-gray-600'}`}>
                {pumpStatus === 'on' ? 'Running' : 'Stopped'}
              </span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              💡 Manual control - Pump starts in OFF state for safety
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePumpToggle}
              disabled={!isOnline}
              className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                !isOnline
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : pumpStatus === 'on'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {!isOnline ? 'Device Offline' : (pumpStatus === 'on' ? 'Turn OFF' : 'Turn ON')}
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Management */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-medium text-gray-900">Irrigation Schedules</h4>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Schedule
          </button>
        </div>

        {(schedules.length > 0 || firestoreSchedules.length > 0) ? (
          <div className="space-y-2">
            {/* Show Firestore schedules (user's saved schedules) */}
            {firestoreSchedules.map((schedule) => (
              <div key={`firestore-${schedule.id}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium text-gray-900">{schedule.name}</p>
                  <p className="text-sm text-gray-600">
                    {schedule.type === 'daily' ? 'Daily' : 'Weekly'} • {schedule.startTime} - {schedule.endTime}
                    {schedule.type === 'weekly' && schedule.days && (
                      <span> • {schedule.days.join(', ')}</span>
                    )}
                  </p>
                  <p className="text-xs text-blue-600">💾 Saved in database</p>
                </div>
                <button
                  onClick={() => deleteScheduleFromFirestore(schedule.id)}
                  className="px-3 py-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
            
            {/* Show Realtime Database schedules (active device schedules) */}
            {schedules.map((schedule) => (
              <div key={`realtime-${schedule.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{schedule.name}</p>
                  <p className="text-sm text-gray-600">
                    {schedule.type === 'daily' ? 'Daily' : 'Weekly'} • {schedule.startTime} - {schedule.endTime}
                    {schedule.type === 'weekly' && schedule.days && (
                      <span> • {schedule.days.join(', ')}</span>
                    )}
                  </p>
                  <p className="text-xs text-green-600">⚡ Active on device</p>
                </div>
                <button
                  onClick={() => removeSchedule(schedule.id)}
                  className="px-3 py-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No schedules configured</p>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Irrigation Schedule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Morning Watering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
                <select
                  value={newSchedule.type}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {newSchedule.type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days of Week</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <button
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-2 py-1 text-xs rounded ${
                          newSchedule.days.includes(day)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddSchedule}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Schedule
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualIrrigationControl;

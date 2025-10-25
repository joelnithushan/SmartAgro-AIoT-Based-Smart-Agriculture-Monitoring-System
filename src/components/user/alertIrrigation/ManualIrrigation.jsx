import React, { useState, useEffect } from 'react';
import { db } from '../../../services/firebase/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useDeviceRealtime } from '../../common/hooks/useDeviceRealtime';
import { useUserDevices } from '../../common/hooks/useUserDevices';
import irrigationApi from '../../../services/api/irrigationApi';
import toast from 'react-hot-toast';

const ManualIrrigation = () => {
  const { user } = useAuth();
  const { activeDeviceId, getActiveDevice } = useUserDevices();
  const { isOnline, sensorData } = useDeviceRealtime(activeDeviceId);
  const activeDevice = getActiveDevice();
  
  const [irrigationData, setIrrigationData] = useState({
    mode: 'manual',
    pumpStatus: 'off',
    schedules: [],
    autoIrrigationEnabled: false,
    autoIrrigationSettings: {
      turnOnThreshold: 10,
      turnOffThreshold: 30
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    frequency: 'daily'
  });
  const [editingSchedule, setEditingSchedule] = useState(null);

  const loadSchedules = () => {
    if (!user?.uid) return;

    const schedulesQuery = query(
      collection(db, 'users', user.uid, 'irrigation', 'settings', 'schedules'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(schedulesQuery, (snapshot) => {
      const schedules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIrrigationData(prev => ({ ...prev, schedules }));
    });

    return unsubscribe;
  };

  // Load irrigation data
  useEffect(() => {
    if (!user?.uid) return;

    const loadIrrigationData = async () => {
      try {
        const data = await irrigationApi.getIrrigationStatus(user.uid);
        setIrrigationData(data);
      } catch (error) {
        console.error('Error loading irrigation data:', error);
        // Load schedules from Firestore directly
        loadSchedules();
      }
    };

    loadIrrigationData();
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Check if device is online (last seen within 60 seconds)
  const isDeviceOnline = () => {
    // Use the isOnline state from useDeviceRealtime hook instead of calculating locally
    return isOnline;
  };

  const handlePumpToggle = async () => {
    if (!isDeviceOnline()) {
      toast.error('Device is offline. Cannot control pump.');
      return;
    }

    if (!user?.uid || !activeDeviceId) return;

    try {
      setLoading(true);
      const action = irrigationData.pumpStatus === 'off' ? 'on' : 'off';
      
      await irrigationApi.controlWaterPump(user.uid, action, activeDeviceId);
      
      setIrrigationData(prev => ({
        ...prev,
        pumpStatus: action
      }));
      
      toast.success(`Water pump turned ${action}`);
    } catch (error) {
      console.error('Error controlling pump:', error);
      toast.error('Failed to control water pump');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!scheduleFormData.name.trim()) {
      toast.error('Please enter a schedule name');
      return;
    }

    if (!scheduleFormData.startTime || !scheduleFormData.endTime) {
      toast.error('Please enter both start and end times');
      return;
    }

    if (scheduleFormData.startTime >= scheduleFormData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    // Check for overlapping schedules
    const startTime = new Date(`2000-01-01T${scheduleFormData.startTime}`);
    const endTime = new Date(`2000-01-01T${scheduleFormData.endTime}`);

    const hasOverlap = irrigationData.schedules.some(schedule => {
      if (editingSchedule && schedule.id === editingSchedule.id) return false;
      
      const existingStart = new Date(`2000-01-01T${schedule.startTime}`);
      const existingEnd = new Date(`2000-01-01T${schedule.endTime}`);
      
      return (startTime < existingEnd && endTime > existingStart);
    });

    if (hasOverlap) {
      toast.error('This schedule overlaps with an existing schedule');
      return;
    }

    try {
      setLoading(true);

      if (editingSchedule) {
        // Update existing schedule
        await irrigationApi.addIrrigationSchedule(user.uid, {
          ...scheduleFormData,
          id: editingSchedule.id
        });
        toast.success('Schedule updated successfully');
      } else {
        // Create new schedule
        await irrigationApi.addIrrigationSchedule(user.uid, scheduleFormData);
        toast.success('Schedule created successfully');
      }

      setShowScheduleModal(false);
      setEditingSchedule(null);
      setScheduleFormData({
        name: '',
        startTime: '',
        endTime: '',
        frequency: 'daily'
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleFormData({
      name: schedule.name,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      frequency: schedule.frequency || 'daily'
    });
    setShowScheduleModal(true);
  };

  const handleDeleteSchedule = async (schedule) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await irrigationApi.removeIrrigationSchedule(user.uid, schedule.id);
        toast.success('Schedule deleted successfully');
      } catch (error) {
        console.error('Error deleting schedule:', error);
        toast.error('Failed to delete schedule');
      }
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${parseInt(hours) % 12 || 12}:${minutes.padStart(2, '0')} ${parseInt(hours) >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="space-y-6">
      {/* Device Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Device Status</h3>
        
        {activeDevice ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Device:</span> {activeDevice.name || activeDeviceId}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  isDeviceOnline() 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isDeviceOnline() ? 'Online' : 'Offline'}
                </span>
              </p>
              {sensorData.soilMoisturePct !== undefined && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Current Soil Moisture:</span> {sensorData.soilMoisturePct.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No active device selected</p>
        )}
      </div>

      {/* Manual Pump Control */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Irrigation Control</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Turn the water pump on or off manually
            </p>
            <p className="text-xs text-gray-500">
              {!isDeviceOnline() && '⚠️ Device must be online to control the pump'}
            </p>
          </div>
          
          <button
            onClick={handlePumpToggle}
            disabled={loading || !isDeviceOnline()}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              irrigationData.pumpStatus === 'on'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <>
                {irrigationData.pumpStatus === 'on' ? '🛑 Turn OFF' : '▶️ Turn ON'}
              </>
            )}
          </button>
        </div>

        {irrigationData.pumpStatus === 'on' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              ⚠️ Water pump is currently ON. Remember to turn it off when done.
            </p>
          </div>
        )}
      </div>

      {/* Irrigation Schedules */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Irrigation Schedules</h3>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
          >
            + Add Schedule
          </button>
        </div>

        {irrigationData.schedules.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📅</div>
            <p className="text-gray-500">No irrigation schedules configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {irrigationData.schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    Frequency: {schedule.frequency}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    schedule.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {schedule.enabled ? 'Active' : 'Inactive'}
                  </span>
                  
                  <button
                    onClick={() => handleEditSchedule(schedule)}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteSchedule(schedule)}
                    className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
                </h3>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setEditingSchedule(null);
                    setScheduleFormData({
                      name: '',
                      startTime: '',
                      endTime: '',
                      frequency: 'daily'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Name
                  </label>
                  <input
                    type="text"
                    value={scheduleFormData.name}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, name: e.target.value })}
                    placeholder="Morning Irrigation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={scheduleFormData.startTime}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={scheduleFormData.endTime}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={scheduleFormData.frequency}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      editingSchedule ? 'Update Schedule' : 'Create Schedule'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowScheduleModal(false);
                      setEditingSchedule(null);
                      setScheduleFormData({
                        name: '',
                        startTime: '',
                        endTime: '',
                        frequency: 'daily'
                      });
                    }}
                    disabled={loading}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualIrrigation;

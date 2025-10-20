import React, { useState } from 'react';
import { useDeviceRealtime } from '../../common/hooks/useDeviceRealtime';
import toast from 'react-hot-toast';

const RelayControl = ({ deviceId, isOnline, sensorData }) => {
  const {
    relayStatus,
    irrigationMode,
    schedules,
    thresholds,
    togglePump,
    setIrrigationMode,
    setThresholds,
    addSchedule,
    removeSchedule
  } = useDeviceRealtime(deviceId);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    type: 'daily',
    startTime: '10:00',
    endTime: '10:15',
    days: [],
    enabled: true
  });

  const handlePumpToggle = () => {
    if (!isOnline) {
      toast.error('Device is offline. Cannot control pump.');
      return;
    }
    
    const newStatus = relayStatus === 'on' ? 'off' : 'on';
    togglePump(newStatus);
  };

  const handleModeChange = (mode) => {
    setIrrigationMode(mode);
  };

  const handleAddSchedule = () => {
    if (!newSchedule.name || !newSchedule.startTime || !newSchedule.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newSchedule.type === 'weekly' && newSchedule.days.length === 0) {
      toast.error('Please select at least one day for weekly schedule');
      return;
    }

    addSchedule(newSchedule);
    setNewSchedule({
      name: '',
      type: 'daily',
      startTime: '10:00',
      endTime: '10:15',
      days: [],
      enabled: true
    });
    setShowScheduleModal(false);
  };

  const handleDayToggle = (day) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleThresholdsUpdate = () => {
    setThresholds(thresholds);
    setShowThresholdsModal(false);
  };

  const getSoilMoistureStatus = () => {
    if (!isOnline) return { status: 'offline', color: 'text-gray-500' };
    
    // Get actual soil moisture from sensor data
    const moisture = sensorData?.soilMoisturePct || 0;
    
    if (moisture < thresholds.soilMoistureLow) {
      return { status: 'Low', color: 'text-red-600' };
    } else if (moisture > thresholds.soilMoistureHigh) {
      return { status: 'High', color: 'text-green-600' };
    } else {
      return { status: 'Normal', color: 'text-blue-600' };
    }
  };

  const moistureStatus = getSoilMoistureStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Pump Control</h3>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Irrigation Mode</label>
        <div className="flex space-x-4">
          <button
            onClick={() => handleModeChange('manual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              irrigationMode === 'manual'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Manual Control
          </button>
          <button
            onClick={() => handleModeChange('auto')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              irrigationMode === 'auto'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Automatic
          </button>
        </div>
      </div>

      {/* Manual Control Section */}
      {irrigationMode === 'manual' && (
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Water Pump Control</h4>
              <p className="text-sm text-gray-600">
                Current status: <span className={`font-medium ${relayStatus === 'on' ? 'text-green-600' : 'text-gray-600'}`}>
                  {relayStatus === 'on' ? 'Running' : 'Stopped'}
                </span>
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePumpToggle}
                disabled={!isOnline}
                className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                  !isOnline
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : relayStatus === 'on'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {!isOnline ? 'Device Offline' : (relayStatus === 'on' ? 'Turn OFF' : 'Turn ON')}
              </button>
            </div>
          </div>

          {/* Schedule Management */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-gray-900">Irrigation Schedules</h4>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Schedule
              </button>
            </div>

            {schedules.length > 0 ? (
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">{schedule.name}</h5>
                      <p className="text-sm text-gray-600">
                        {schedule.type === 'daily' ? 'Daily' : 'Weekly'} • {schedule.startTime} - {schedule.endTime}
                        {schedule.type === 'weekly' && schedule.days && (
                          <span> • {schedule.days.join(', ')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.enabled ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => removeSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No schedules configured</p>
            )}
          </div>
        </div>
      )}

      {/* Automatic Control Section */}
      {irrigationMode === 'auto' && (
        <div className="mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Automatic Irrigation</h4>
            <p className="text-sm text-gray-600 mb-4">
              Pump will automatically turn on when soil moisture is below {thresholds.soilMoistureLow}% 
              and turn off when it reaches {thresholds.soilMoistureHigh}%.
            </p>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current soil moisture status:</p>
                <p className={`font-medium ${moistureStatus.color}`}>
                  {moistureStatus.status}
                </p>
              </div>
              <button
                onClick={() => setShowThresholdsModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adjust Thresholds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Irrigation Schedule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Morning Irrigation"
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

              {newSchedule.type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <button
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          newSchedule.days.includes(day)
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

      {/* Thresholds Modal */}
      {showThresholdsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Adjust Thresholds</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turn ON when soil moisture is below (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholds.soilMoistureLow}
                  onChange={(e) => setThresholds(prev => ({ ...prev, soilMoistureLow: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turn OFF when soil moisture reaches (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholds.soilMoistureHigh}
                  onChange={(e) => setThresholds(prev => ({ ...prev, soilMoistureHigh: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleThresholdsUpdate}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Update Thresholds
              </button>
              <button
                onClick={() => setShowThresholdsModal(false)}
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

export default RelayControl;

import React, { useState } from 'react';
import { useIrrigationControl } from '../hooks/useRealtimeSensorData';
import toast from 'react-hot-toast';

const SmartIrrigationSystem = ({ deviceId, sensorData, isOnline = true }) => {
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

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    type: 'daily',
    startTime: '10:00',
    endTime: '10:15',
    days: []
  });

  const handleModeChange = (mode) => {
    setIrrigationMode(mode);
  };

  const handlePumpToggle = () => {
    const newStatus = pumpStatus === 'on' ? 'off' : 'on';
    togglePump(newStatus);
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
      days: []
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

  const getSoilMoistureStatus = () => {
    const moisture = sensorData.soilMoisture;
    if (moisture < 10) return { status: 'Critical', color: 'text-red-600', bg: 'bg-red-100' };
    if (moisture < 30) return { status: 'Low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const moistureStatus = getSoilMoistureStatus();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Smart Irrigation System</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${moistureStatus.bg} ${moistureStatus.color}`}>
          Soil: {moistureStatus.status} ({sensorData.soilMoisture}%)
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
                Current status: <span className={`font-medium ${pumpStatus === 'on' ? 'text-green-600' : 'text-gray-600'}`}>
                  {pumpStatus === 'on' ? 'Running' : 'Stopped'}
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
                    : pumpStatus === 'on'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {!isOnline ? 'Device Offline' : (pumpStatus === 'on' ? 'Turn OFF' : 'Turn ON')}
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
                      <p className="font-medium text-gray-900">{schedule.name}</p>
                      <p className="text-sm text-gray-600">
                        {schedule.type === 'daily' ? 'Daily' : 'Weekly'} • {schedule.startTime} - {schedule.endTime}
                        {schedule.type === 'weekly' && schedule.days && (
                          <span> • {schedule.days.join(', ')}</span>
                        )}
                      </p>
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
        </div>
      )}

      {/* Automatic Mode Section */}
      {irrigationMode === 'auto' && (
        <div className="mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-lg font-medium text-blue-900 mb-2">Automatic Irrigation</h4>
            <p className="text-sm text-blue-700 mb-3">
              The system will automatically control the water pump based on soil moisture levels:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Pump ON:</strong> When soil moisture drops below 10%</li>
              <li>• <strong>Pump OFF:</strong> When soil moisture reaches 30% or higher</li>
            </ul>
            <div className="mt-3 p-3 bg-white rounded border">
              <p className="text-sm text-gray-600">
                Current soil moisture: <span className="font-medium">{sensorData.soilMoisture}%</span>
              </p>
              <p className="text-sm text-gray-600">
                Pump will turn {sensorData.soilMoisture < 10 ? 'ON' : sensorData.soilMoisture > 30 ? 'OFF' : 'stay as is'} automatically
              </p>
            </div>
          </div>
        </div>
      )}

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

export default SmartIrrigationSystem;

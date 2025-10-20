import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useDeviceRealtime } from '../../../common/hooks/useDeviceRealtime';
import { useUserDevices } from '../../hooks/useUserDevices';
import irrigationApi from '../../../services/api/irrigationApi';
import toast from 'react-hot-toast';

const AutoIrrigationSwitch = () => {
  const { user } = useAuth();
  const { activeDeviceId } = useUserDevices();
  const { sensorData } = useDeviceRealtime(activeDeviceId);
  
  const [autoIrrigationEnabled, setAutoIrrigationEnabled] = useState(false);
  const [settings, setSettings] = useState({
    turnOnThreshold: 10,
    turnOffThreshold: 30
  });
  const [saving, setSaving] = useState(false);

  // Load auto irrigation settings
  useEffect(() => {
    if (!user?.uid) return;

    const loadAutoIrrigationSettings = async () => {
      try {
        const data = await irrigationApi.getIrrigationStatus(user.uid);
        setAutoIrrigationEnabled(data.autoIrrigationEnabled || false);
        setSettings(data.autoIrrigationSettings || {
          turnOnThreshold: 10,
          turnOffThreshold: 30
        });
      } catch (error) {
        console.error('Error loading auto irrigation settings:', error);
      }
    };

    loadAutoIrrigationSettings();
  }, [user?.uid]);

  // Check if device is online (last seen within 60 seconds)
  const isDeviceOnline = () => {
    if (!sensorData.timestamp) return false;
    const lastSeen = new Date(sensorData.timestamp);
    const now = new Date();
    const diffInSeconds = (now - lastSeen) / 1000;
    return diffInSeconds < 60;
  };

  const handleToggleAutoIrrigation = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);
      
      const newEnabled = !autoIrrigationEnabled;
      await irrigationApi.updateAutoIrrigationSettings(user.uid, {
        enabled: newEnabled,
        turnOnThreshold: settings.turnOnThreshold,
        turnOffThreshold: settings.turnOffThreshold
      });
      
      setAutoIrrigationEnabled(newEnabled);
      
      if (newEnabled && !isDeviceOnline()) {
        toast.warning('Auto irrigation enabled, but device is currently offline');
      } else {
        toast.success(`Auto irrigation ${newEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Error toggling auto irrigation:', error);
      toast.error('Failed to update auto irrigation settings');
    } finally {
      setSaving(false);
    }
  };

  const handleThresholdChange = async (thresholdType, value) => {
    // Validation
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      toast.error('Threshold must be a number between 0 and 100');
      return;
    }

    if (thresholdType === 'turnOnThreshold' && numValue >= settings.turnOffThreshold) {
      toast.error('Turn ON threshold must be less than turn OFF threshold');
      return;
    }

    if (thresholdType === 'turnOffThreshold' && numValue <= settings.turnOnThreshold) {
      toast.error('Turn OFF threshold must be greater than turn ON threshold');
      return;
    }

    const newSettings = {
      ...settings,
      [thresholdType]: numValue
    };

    setSettings(newSettings);

    // Save immediately if auto irrigation is enabled
    if (autoIrrigationEnabled) {
      try {
        await irrigationApi.updateAutoIrrigationSettings(user.uid, {
          enabled: autoIrrigationEnabled,
          ...newSettings
        });
        toast.success('Threshold updated successfully');
      } catch (error) {
        console.error('Error updating threshold:', error);
        toast.error('Failed to update threshold');
        // Revert on error
        setSettings(settings);
      }
    }
  };

  // Determine pump action based on soil moisture and thresholds
  const getPumpAction = () => {
    if (!autoIrrigationEnabled || !isDeviceOnline() || sensorData.soilMoisturePct === undefined) {
      return null;
    }

    const moisture = sensorData.soilMoisturePct;
    
    if (moisture < settings.turnOnThreshold) {
      return { action: 'ON', reason: `Soil moisture (${moisture.toFixed(1)}%) is below turn-on threshold (${settings.turnOnThreshold}%)` };
    } else if (moisture > settings.turnOffThreshold) {
      return { action: 'OFF', reason: `Soil moisture (${moisture.toFixed(1)}%) is above turn-off threshold (${settings.turnOffThreshold}%)` };
    }
    
    return { action: 'MAINTAIN', reason: `Soil moisture (${moisture.toFixed(1)}%) is within optimal range` };
  };

  const pumpAction = getPumpAction();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Auto Irrigation Control</h3>
      
      {/* Auto Irrigation Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Auto Irrigation</h4>
          <p className="text-sm text-gray-600">
            Automatically control the water pump based on soil moisture levels
          </p>
        </div>
        
        <button
          onClick={handleToggleAutoIrrigation}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            autoIrrigationEnabled ? 'bg-green-600' : 'bg-gray-200'
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              autoIrrigationEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Threshold Settings */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Turn ON Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={settings.turnOnThreshold}
              onChange={(e) => handleThresholdChange('turnOnThreshold', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={!autoIrrigationEnabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              Pump turns ON when soil moisture drops below this level
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Turn OFF Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={settings.turnOffThreshold}
              onChange={(e) => handleThresholdChange('turnOffThreshold', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={!autoIrrigationEnabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              Pump turns OFF when soil moisture reaches this level
            </p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Current Status</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Device Status:</span>
            <span className={`font-medium ${
              isDeviceOnline() ? 'text-green-600' : 'text-red-600'
            }`}>
              {isDeviceOnline() ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {sensorData.soilMoisturePct !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Soil Moisture:</span>
              <span className="font-medium">{sensorData.soilMoisturePct.toFixed(1)}%</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Auto Irrigation:</span>
            <span className={`font-medium ${
              autoIrrigationEnabled ? 'text-green-600' : 'text-gray-600'
            }`}>
              {autoIrrigationEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Pump Action Indicator */}
        {autoIrrigationEnabled && pumpAction && (
          <div className="mt-3 p-3 rounded-md border-l-4 border-blue-400 bg-blue-50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {pumpAction.action === 'ON' && <span className="text-green-600">🟢</span>}
                {pumpAction.action === 'OFF' && <span className="text-red-600">🔴</span>}
                {pumpAction.action === 'MAINTAIN' && <span className="text-blue-600">🔵</span>}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  pumpAction.action === 'ON' ? 'text-green-800' :
                  pumpAction.action === 'OFF' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {pumpAction.action === 'ON' && 'Pump should be ON'}
                  {pumpAction.action === 'OFF' && 'Pump should be OFF'}
                  {pumpAction.action === 'MAINTAIN' && 'Pump status maintained'}
                </p>
                <p className="text-xs text-gray-600">{pumpAction.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {!isDeviceOnline() && autoIrrigationEnabled && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Device is offline. Auto irrigation cannot function until the device comes back online.
            </p>
          </div>
        )}

        {autoIrrigationEnabled && sensorData.soilMoisturePct === undefined && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ No soil moisture data available. Auto irrigation cannot function without sensor data.
            </p>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="text-sm font-medium text-green-900 mb-2">How Auto Irrigation Works</h4>
        <ul className="text-xs text-green-800 space-y-1">
          <li>• When soil moisture drops below the "Turn ON" threshold, the pump automatically turns ON</li>
          <li>• When soil moisture reaches the "Turn OFF" threshold, the pump automatically turns OFF</li>
          <li>• The device must be online for auto irrigation to function</li>
          <li>• You can still manually control the pump even when auto irrigation is enabled</li>
        </ul>
      </div>
    </div>
  );
};

export default AutoIrrigationSwitch;

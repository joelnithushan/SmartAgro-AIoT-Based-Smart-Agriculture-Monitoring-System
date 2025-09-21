import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import DeviceShareModal from './DeviceShareModal';

const DeviceCard = ({ device, onDeviceClick, isSelected }) => {
  const [latestData, setLatestData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const { deviceId, accessType, ownerName } = device;
  const isOwner = accessType === 'owner';

  // Subscribe to real-time sensor data
  useEffect(() => {
    if (!deviceId) return;

    const latestRef = ref(database, `devices/${deviceId}/sensors/latest`);

    const unsubscribe = onValue(latestRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLatestData(data);
        setLastUpdate(new Date());
      }
    });

    return () => {
      off(latestRef, 'value', unsubscribe);
    };
  }, [deviceId]);

  // Get status color based on data freshness
  const getStatusColor = () => {
    if (!latestData) return 'bg-gray-100 text-gray-800';
    
    const lastUpdateTime = new Date(latestData.timestamp?.toDate?.() || latestData.timestamp);
    const now = new Date();
    const timeDiff = (now - lastUpdateTime) / (1000 * 60); // minutes
    
    if (timeDiff > 60) return 'bg-red-100 text-red-800'; // No data for 1+ hours
    if (timeDiff > 30) return 'bg-yellow-100 text-yellow-800'; // No data for 30+ minutes
    return 'bg-green-100 text-green-800'; // Recent data
  };

  const getStatusText = () => {
    if (!latestData) return 'No Data';
    
    const lastUpdateTime = new Date(latestData.timestamp?.toDate?.() || latestData.timestamp);
    const now = new Date();
    const timeDiff = (now - lastUpdateTime) / (1000 * 60); // minutes
    
    if (timeDiff > 60) return 'Offline';
    if (timeDiff > 30) return 'Delayed';
    return 'Online';
  };

  const handleCardClick = () => {
    if (onDeviceClick) {
      onDeviceClick(device);
    }
  };

  const handleShareClick = (e) => {
    e.stopPropagation(); // Prevent card click
    setShowShareModal(true);
  };

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
          isSelected ? 'border-green-500 shadow-md' : 'border-gray-200'
        }`}
        onClick={handleCardClick}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📱</span>
              <div>
                <h3 className="font-medium text-gray-900">{deviceId}</h3>
                {!isOwner && (
                  <p className="text-xs text-blue-600">
                    Shared by {ownerName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              {isOwner && (
                <button
                  onClick={handleShareClick}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Share Device"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Access Type Badge */}
          <div className="mb-3">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isOwner 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {isOwner ? '👑 Owner' : '👥 Shared'}
            </span>
          </div>

          {/* Sensor Data Preview */}
          {latestData ? (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Soil Moisture</div>
                <div className="text-sm font-medium">{latestData.soilMoisture?.toFixed(1) || 'N/A'}%</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Temperature</div>
                <div className="text-sm font-medium">{latestData.temperature?.toFixed(1) || 'N/A'}°C</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Humidity</div>
                <div className="text-sm font-medium">{latestData.humidity?.toFixed(1) || 'N/A'}%</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Air Quality</div>
                <div className="text-sm font-medium">{latestData.airQuality?.toFixed(0) || 'N/A'}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <div className="text-sm">No sensor data available</div>
              <div className="text-xs">Device may be offline</div>
            </div>
          )}

          {/* Last Update */}
          <div className="text-xs text-gray-500 text-center border-t border-gray-100 pt-2">
            {latestData ? (
              <>
                Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Unknown'}
              </>
            ) : (
              'Waiting for data...'
            )}
          </div>

          {/* Permissions Notice for Shared Devices */}
          {!isOwner && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              ℹ️ View-only access • Cannot control device
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <DeviceShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          deviceId={deviceId}
          onShareSuccess={() => {
            // Could refresh shared users list if needed
          }}
        />
      )}
    </>
  );
};

export default DeviceCard;

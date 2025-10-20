import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

const FarmDataManagement = () => {
  const [farmData, setFarmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [devices, setDevices] = useState([]);

  // Removed mock data generation - use real Firebase data only

  const fetchDevices = async () => {
    try {
      const devicesQuery = query(collection(db, 'devices'));
      const devicesSnapshot = await getDocs(devicesQuery);
      const devicesData = devicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevices(devicesData);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchFarmData = useCallback(async () => {
    try {
      setLoading(true);
      
      // TODO: Implement real Firebase queries for farm data
      // For now, set empty data to avoid mock data
      setFarmData([]);
      
    } catch (error) {
      console.error('Error fetching farm data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchFarmData();
  }, [fetchFarmData]);

  const getTimeRangeData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return farmData.slice(-days);
  };

  const getAverageValue = (key) => {
    const data = getTimeRangeData();
    const sum = data.reduce((acc, item) => acc + item[key], 0);
    return (sum / data.length).toFixed(1);
  };

  const getMaxValue = (key) => {
    const data = getTimeRangeData();
    return Math.max(...data.map(item => item[key]));
  };

  const getMinValue = (key) => {
    const data = getTimeRangeData();
    return Math.min(...data.map(item => item[key]));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const chartData = getTimeRangeData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farm Data Management</h1>
          <p className="text-white">Monitor and analyze farm sensor data</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Devices</option>
            {devices.map(device => (
              <option key={device.id} value={device.id}>
                {device.id}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">💧</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Soil Moisture</p>
              <p className="text-2xl font-bold text-blue-600">{getAverageValue('soilMoisture')}%</p>
              <p className="text-xs text-gray-500">
                Range: {getMinValue('soilMoisture')}% - {getMaxValue('soilMoisture')}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <span className="text-2xl">🌡️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Temperature</p>
              <p className="text-2xl font-bold text-red-600">{getAverageValue('temperature')}°C</p>
              <p className="text-xs text-gray-500">
                Range: {getMinValue('temperature')}°C - {getMaxValue('temperature')}°C
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">💨</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Humidity</p>
              <p className="text-2xl font-bold text-green-600">{getAverageValue('humidity')}%</p>
              <p className="text-xs text-gray-500">
                Range: {getMinValue('humidity')}% - {getMaxValue('humidity')}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-2xl">🧪</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg pH Level</p>
              <p className="text-2xl font-bold text-yellow-600">{getAverageValue('ph')}</p>
              <p className="text-xs text-gray-500">
                Range: {getMinValue('ph')} - {getMaxValue('ph')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Moisture Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Soil Moisture Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="soilMoisture" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Temperature & Humidity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature & Humidity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="humidity" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* pH Levels */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">pH Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[5, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="ph" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Irrigation Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Irrigation Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="irrigation" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
        <div className="flex space-x-4">
          <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium">
            Export CSV
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium">
            Export PDF Report
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium">
            Download Raw Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmDataManagement;

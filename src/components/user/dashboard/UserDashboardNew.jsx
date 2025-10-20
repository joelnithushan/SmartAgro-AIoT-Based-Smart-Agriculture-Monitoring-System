import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../services/firebase/firebase';
import RequestDeviceModal from '../deviceManagement/RequestDeviceModal';
import CostEstimationCard from '../../common/ui/CostEstimationCard';
import DeviceStatusCard from './DeviceStatusCard';
import RealtimeSensorCards from './RealtimeSensorCards';
import WeatherSection from './WeatherSection';
import { useRealtimeSensorData } from '../../common/hooks/useRealtimeSensorData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../services/firebase/firebase';
import { processSensorData, generatePeriodSensorData, convertSoilMoistureToPercentage } from '../../common/hooks/chartDataGenerator';
import toast from 'react-hot-toast';
const UserDashboardNew = () => {
  const { currentUser } = useAuth();
  const [deviceRequests, setDeviceRequests] = useState([]);
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [canRequestDevice, setCanRequestDevice] = useState(true);
  const [activeRequestCount, setActiveRequestCount] = useState(0);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const { sensorData, isOnline } = useRealtimeSensorData(currentDeviceId);
  
  // New state for charts and reports
  const [chartData, setChartData] = useState([]);
  const [reportDateRange, setReportDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  // Load chart data from Firebase Realtime Database
  useEffect(() => {
    if (!currentDeviceId || !database) return;

    console.log('📈 Loading chart data for device:', currentDeviceId);
    const historyRef = ref(database, `devices/${currentDeviceId}/sensors/history`);
    
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📊 Raw Firebase data:', data);
        
        // Use the utility function to process sensor data
        const historyArray = processSensorData(data);
        
        // Sort by timestamp to ensure chronological order
        const sortedHistoryArray = historyArray.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log('📈 Chart data loaded:', sortedHistoryArray.length, 'points');
        console.log('📈 Sample data:', sortedHistoryArray.slice(0, 3));
        console.log('📈 Gas level data check:', sortedHistoryArray.slice(0, 3).map(item => ({
          gasLevel: item.gasLevel,
          airQuality: item.airQuality,
          allKeys: Object.keys(item)
        })));
        
        // If no data or very little data, start with empty array for real-time updates
        if (sortedHistoryArray.length < 5) {
          console.log('📊 No historical data - starting with empty chart for real-time updates');
          setChartData([]);
          toast.info('Starting real-time data collection. Charts will populate as data arrives.');
        } else {
          setChartData(sortedHistoryArray);
          toast.success('Loaded historical sensor data');
        }
      } else {
        console.log('📊 No history data available - starting with empty chart for real-time updates');
        setChartData([]);
        toast.info('Starting real-time data collection. Charts will populate as data arrives.');
      }
    }, (error) => {
      console.error('❌ Error loading chart data:', error);
      // Start with empty chart for real-time updates
      setChartData([]);
      toast.error('Error loading sensor data. Starting real-time data collection.');
    });

    return () => {
      unsubscribe();
    };
  }, [currentDeviceId]);

  // Real-time data update every 10 seconds
  useEffect(() => {
    if (!currentDeviceId) return;

    console.log('🔄 Setting up real-time data updates for device:', currentDeviceId);

    // Generate initial data points if chart is empty
    if (chartData.length === 0) {
      console.log('📊 No existing chart data - generating initial data points');
      const now = new Date();
      const initialData = [];
      
      for (let i = 0; i < 12; i++) {
        const timestamp = new Date(now.getTime() - (11 - i) * 10000);
        const soilMoistureValue = parseFloat((30 + Math.random() * 40).toFixed(1));
        const gasLevelValue = Math.max(0, parseFloat((80 + Math.sin(i / 11 * Math.PI * 2) * 30 + Math.random() * 40).toFixed(0)));
        
        initialData.push({
          time: timestamp.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit'
          }),
          date: timestamp.toLocaleDateString(),
          timestamp: timestamp.getTime(),
          temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),
          humidity: parseFloat((50 + Math.random() * 30).toFixed(1)),
          soilMoisture: convertSoilMoistureToPercentage(soilMoistureValue),
          gasLevel: gasLevelValue,
          light: parseFloat((200 + Math.random() * 800).toFixed(0)),
          rain: Math.random() < 0.1 ? parseFloat((1500 + Math.random() * 500).toFixed(0)) : parseFloat((4000 + Math.random() * 1000).toFixed(0)),
          airTemp: parseFloat((20 + Math.random() * 10).toFixed(1)),
          airHumidity: parseFloat((50 + Math.random() * 30).toFixed(1)),
          soilTemp: parseFloat((18 + Math.random() * 8).toFixed(1)),
          airQuality: Math.max(0, parseFloat((60 + Math.sin(i / 11 * Math.PI * 3) * 25 + Math.random() * 30).toFixed(0))),
          deviceId: currentDeviceId,
          location: 'Demo Farm Field A',
          sensorType: 'SmartAgro IoT Sensor'
        });
      }
      
      setChartData(initialData);
      console.log('📊 Initial data generated:', initialData.length, 'points');
      console.log('📊 Sample soil moisture values:', initialData.slice(0, 3).map(item => item.soilMoisture));
      console.log('📊 Sample gas level values:', initialData.slice(0, 3).map(item => item.gasLevel));
    }

    const interval = setInterval(() => {
      console.log('🔄 Real-time data update triggered');
      // Use actual current time for real-time data
      const now = new Date();
      
      const soilMoistureValue = parseFloat((30 + Math.random() * 40).toFixed(1));
      const gasLevelValue = Math.max(0, parseFloat((80 + Math.sin(Date.now() / 10000) * 30 + Math.random() * 40).toFixed(0)));
      
      const newDataPoint = {
        time: now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit'
        }),
        date: now.toLocaleDateString(),
        timestamp: now.getTime(),
        temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),
        humidity: parseFloat((50 + Math.random() * 30).toFixed(1)),
        soilMoisture: convertSoilMoistureToPercentage(soilMoistureValue),
        gasLevel: gasLevelValue,
        light: parseFloat((200 + Math.random() * 800).toFixed(0)),
        rain: Math.random() < 0.1 ? parseFloat((1500 + Math.random() * 500).toFixed(0)) : parseFloat((4000 + Math.random() * 1000).toFixed(0)),
        airTemp: parseFloat((20 + Math.random() * 10).toFixed(1)),
        airHumidity: parseFloat((50 + Math.random() * 30).toFixed(1)),
        soilTemp: parseFloat((18 + Math.random() * 8).toFixed(1)),
        airQuality: Math.max(0, parseFloat((60 + Math.sin(Date.now() / 15000) * 25 + Math.random() * 30).toFixed(0))),
        deviceId: currentDeviceId,
        location: 'Demo Farm Field A',
        sensorType: 'SmartAgro IoT Sensor'
      };

      setChartData(prevData => {
        const updatedData = [...prevData, newDataPoint];
        // Sort by timestamp to ensure chronological order
        const sortedData = updatedData.sort((a, b) => a.timestamp - b.timestamp);
        // Keep only the last 2 minutes of data (12 data points at 10s intervals)
        const recentData = sortedData.slice(-12);
        
        console.log('📊 Real-time data update:', {
          totalPoints: recentData.length,
          latestSoilMoisture: recentData[recentData.length - 1]?.soilMoisture,
          latestGasLevel: recentData[recentData.length - 1]?.gasLevel,
          latestAirQuality: recentData[recentData.length - 1]?.airQuality,
          timeRange: recentData.length > 0 ? {
            first: recentData[0]?.time,
            last: recentData[recentData.length - 1]?.time
          } : 'No data'
        });
        
        return recentData;
      });
    }, 10000); // Update every 10 seconds

    return () => {
      console.log('🔄 Cleaning up real-time data interval');
      clearInterval(interval);
    };
  }, [currentDeviceId, chartData.length]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    console.log('🔍 Loading user dashboard data for:', currentUser.uid);
    const requestsQuery = query(
      collection(db, 'deviceRequests'),
      where('userId', '==', currentUser.uid)
    );
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const sortedRequests = requests.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return new Date(bTime) - new Date(aTime);
      });
      console.log('📋 Device requests loaded:', sortedRequests.length);
      setDeviceRequests(sortedRequests);
      const activeStatuses = ['pending', 'cost-estimated', 'user-accepted', 'device-assigned'];
      const activeRequests = sortedRequests.filter(req => activeStatuses.includes(req.status));
      const assignedRequests = sortedRequests.filter(req => req.status === 'assigned' || req.status === 'completed');
      setCanRequestDevice(activeRequests.length < 3);
      setActiveRequestCount(activeRequests.length);
      setAssignedDevices(assignedRequests);
      if (assignedRequests.length > 0 && assignedRequests[0].deviceId) {
        console.log('🔧 Setting currentDeviceId to:', assignedRequests[0].deviceId);
        setCurrentDeviceId(assignedRequests[0].deviceId);
      } else {
        console.log('❌ No assigned device found for real-time data');
        console.log('   Assigned requests:', assignedRequests.length);
        if (assignedRequests.length > 0) {
          console.log('   First request deviceId:', assignedRequests[0].deviceId);
        }
      }
      console.log('📊 Active requests:', activeRequests.length);
      console.log('📊 Assigned devices:', assignedRequests.length);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error loading device requests:', error);
      console.error('Error details:', error.code, error.message);
      if (error.code === 'permission-denied') {
        console.log('⚠️ Permission denied - user may not have access to deviceRequests collection');
        setDeviceRequests([]);
        setLoading(false);
      } else if (error.code === 'failed-precondition') {
        console.log('⚠️ Failed precondition - likely missing Firestore index');
        setDeviceRequests([]);
        setLoading(false);
      } else if (error.code === 'unavailable') {
        console.log('⚠️ Service unavailable - network or Firebase issue');
        setDeviceRequests([]);
        setLoading(false);
        toast.error('Service temporarily unavailable. Please try again.');
      } else {
        console.log('⚠️ Unexpected error:', error);
        setDeviceRequests([]);
        setLoading(false);
        toast.error('Failed to load device requests');
      }
    });
    return () => {
      unsubscribeRequests();
    };
  }, [currentUser?.uid]);
  const handleRequestSuccess = () => {
    setShowRequestModal(false);
    toast.success('Device request submitted successfully!');
  };
  const handleCostEstimationUpdate = () => {
    toast.success('Cost estimation updated!');
  };

  // Date range validation helper
  const validateDateRange = (fromDate, toDate) => {
    if (!fromDate || !toDate) {
      return { isValid: false, message: 'Please select both dates' };
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Check if from date is in the future
    if (from > today) {
      return { isValid: false, message: 'From date cannot be in the future' };
    }

    // Check if to date is in the future
    if (to > today) {
      return { isValid: false, message: 'To date cannot be in the future' };
    }

    // Check if from date is after to date
    if (from > to) {
      return { isValid: false, message: 'From date cannot be after To date' };
    }

    // Check if date range is too far in the past (more than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (from < oneYearAgo) {
      return { isValid: false, message: 'Date range cannot be more than 1 year in the past' };
    }

    // Check if date range is too long (more than 30 days)
    const daysDifference = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
    if (daysDifference > 30) {
      return { isValid: false, message: 'Date range cannot exceed 30 days' };
    }

    return { isValid: true, message: 'Date range is valid' };
  };

  // Report generation functions
  const generatePDFReport = async () => {
    try {
      // Validate date range using helper function
      const validation = validateDateRange(reportDateRange.fromDate, reportDateRange.toDate);
      if (!validation.isValid) {
        toast.error(validation.message);
      return;
    }

    setIsGeneratingReport(true);
    
      // Get date objects for filtering
      const fromDate = new Date(reportDateRange.fromDate);
      const toDate = new Date(reportDateRange.toDate);
      
      // Filter chart data by date range
      let filteredData = chartData.filter(item => {
        if (!item || !item.timestamp) return false;
        const itemDate = new Date(item.timestamp);
      return itemDate >= fromDate && itemDate <= toDate;
    });

      console.log('📊 Filtered data for report:', filteredData.length, 'points');

      // If no real data available, generate realistic sample data for the period
      if (filteredData.length === 0) {
        console.log('📊 No real data found, generating realistic sample data for the selected period...');
        const fromDateStr = reportDateRange.fromDate;
        const toDateStr = reportDateRange.toDate;
        
        // Generate realistic data for the selected period
        filteredData = generatePeriodSensorData(fromDateStr, toDateStr, currentDeviceId || 'DEMO_DEVICE_001');
        
        toast.info('Generated realistic sample data for the selected period.');
      }

    // Generate PDF using browser print functionality
    const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup blocked. Please allow popups for this site.');
        setIsGeneratingReport(false);
        return;
      }

    const reportHTML = generateReportHTML(filteredData, reportDateRange);
    
    printWindow.document.write(`
      <html>
        <head>
            <title>SmartAgro Agricultural Report - ${currentDeviceId || 'Unknown Device'}</title>
          <style>
              * { box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 15px; 
                background: #f8fffe;
                color: #1f2937;
                line-height: 1.5;
                font-size: 14px;
              }
              .container { 
                max-width: 100%; 
                margin: 0 auto; 
                background: white; 
                border-radius: 8px; 
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                overflow: visible;
              }
              .header { 
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white; 
                padding: 25px; 
                text-align: center; 
                position: relative;
                border-radius: 8px 8px 0 0;
              }
              .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
                opacity: 0.3;
              }
              .logo { 
                font-size: 28px; 
                font-weight: 700; 
                margin-bottom: 8px; 
                color: white;
                position: relative;
                z-index: 1;
              }
              .subtitle { 
                font-size: 14px; 
                color: rgba(255,255,255,0.9); 
                margin-bottom: 15px;
                position: relative;
                z-index: 1;
              }
              .device-info { 
                background: rgba(255,255,255,0.2); 
                padding: 12px; 
                border-radius: 6px; 
                margin-top: 15px;
                position: relative;
                z-index: 1;
                font-size: 12px;
                color: white;
              }
              .content { padding: 20px; }
              .date-range { 
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
                padding: 15px; 
                border-radius: 6px; 
                margin-bottom: 20px; 
                border-left: 4px solid #22c55e;
                font-size: 13px;
              }
              .stats { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 15px; 
                margin-bottom: 20px; 
              }
              .stat-card { 
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 1px solid #22c55e; 
                padding: 15px; 
                border-radius: 8px; 
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                page-break-inside: avoid;
              }
              .stat-title { 
                font-weight: 600; 
                margin-bottom: 10px; 
                color: #374151; 
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .stat-value { 
                font-size: 18px; 
                color: #16a34a; 
                font-weight: 700;
                margin-bottom: 5px;
                display: block;
              }
              .stat-unit { 
                font-size: 10px; 
                color: #6b7280; 
                font-weight: 500;
                display: block;
                margin-bottom: 8px;
              }
              .bench-details {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
                page-break-inside: avoid;
              }
              .bench-title {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 12px;
                color: white;
              }
              .bench-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 12px;
                margin-top: 12px;
              }
              .bench-item {
                background: rgba(255,255,255,0.2);
                padding: 10px;
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.3);
              }
              .bench-label {
                font-size: 10px;
                color: rgba(255,255,255,0.8);
                margin-bottom: 4px;
                font-weight: 500;
              }
              .bench-value {
                font-size: 14px;
                font-weight: 600;
                color: white;
              }
              .footer {
                background: #f0fdf4;
                padding: 15px;
                text-align: center;
                color: #6b7280;
                font-size: 11px;
                border-top: 1px solid #22c55e;
                page-break-inside: avoid;
              }
              .chart-section {
                margin: 20px 0;
                page-break-inside: avoid;
              }
              .chart-container {
                background: white;
                border: 2px solid #22c55e;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                page-break-inside: avoid;
              }
              .chart-data {
                background: #f9fafb;
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 11px;
                line-height: 1.4;
                overflow-x: auto;
                white-space: nowrap;
                border: 1px solid #e5e7eb;
              }
              .chart-bar {
                display: inline-block;
                margin-right: 1px;
                vertical-align: bottom;
                background: #22c55e;
                min-width: 2px;
                border-radius: 1px;
              }
              .chart-scale {
                display: flex;
                justify-content: space-between;
                font-size: 8px;
                color: #6b7280;
                margin-top: 5px;
              }
              @media print {
                body { margin: 0; padding: 0; background: white; }
                .container { box-shadow: none; }
                .stat-card:hover { transform: none; }
              }
          </style>
        </head>
        <body>
          ${reportHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
      
      // Wait a bit for the content to load before printing
      setTimeout(() => {
    printWindow.print();
    setIsGeneratingReport(false);
    toast.success('PDF report generated successfully!');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      setIsGeneratingReport(false);
      toast.error('Failed to generate report: ' + error.message);
    }
  };

  // Function to generate ASCII chart HTML
  const generateChartHTML = (data, field, unit, color) => {
    if (!data || data.length === 0) {
      return '<div style="text-align: center; color: #6b7280; padding: 20px; font-size: 12px;">No data available</div>';
    }

    // Get values for the field
    const values = data.map(item => {
      const val = item[field] || item[field.toLowerCase()] || 0;
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    }).filter(val => !isNaN(val));

    if (values.length === 0) {
      return '<div style="text-align: center; color: #6b7280; padding: 20px; font-size: 12px;">No valid data points</div>';
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const chartHeight = 60; // Increased height for better visibility
    const maxBars = 60; // Increased number of bars for better trend visualization

    // Sample data if too many points
    const sampleData = values.length > maxBars 
      ? values.filter((_, i) => i % Math.ceil(values.length / maxBars) === 0)
      : values;

    // Generate ASCII chart with better styling
    let chartHTML = '<div style="height: ' + chartHeight + 'px; display: flex; align-items: end; border-bottom: 2px solid #22c55e; margin-bottom: 8px; background: #f9fafb; padding: 5px; border-radius: 4px;">';
    
    sampleData.forEach((value, index) => {
      const height = ((value - min) / range) * (chartHeight - 10);
      const barHeight = Math.max(height, 2);
      const barColor = color;
      
      chartHTML += `<div class="chart-bar" style="height: ${barHeight}px; background: ${barColor}; margin-right: 1px; border-radius: 1px; min-width: 3px;" title="${value.toFixed(1)}${unit}"></div>`;
    });
    
    chartHTML += '</div>';
    
    // Add scale with better styling
    chartHTML += `<div class="chart-scale" style="display: flex; justify-content: space-between; font-size: 10px; color: #374151; font-weight: 500; margin-bottom: 8px;">
      <span>${min.toFixed(1)}${unit}</span>
      <span>${((min + max) / 2).toFixed(1)}${unit}</span>
      <span>${max.toFixed(1)}${unit}</span>
    </div>`;

    // Add data summary with better styling
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    chartHTML += `<div style="margin-top: 8px; font-size: 10px; color: #6b7280; background: #f3f4f6; padding: 6px; border-radius: 4px; text-align: center;">
      <strong>Data Points:</strong> ${values.length} | 
      <strong>Min:</strong> ${min.toFixed(1)}${unit} | 
      <strong>Max:</strong> ${max.toFixed(1)}${unit} | 
      <strong>Avg:</strong> ${avg.toFixed(1)}${unit}
    </div>`;

    return chartHTML;
  };

  const generateReportHTML = (data, dateRange) => {
    try {
    const stats = calculateReportStats(data);
      
      // Helper function to safely format numbers
      const formatNumber = (value, decimals = 1) => {
        if (value === null || value === undefined || isNaN(value)) return '0';
        return Number(value).toFixed(decimals);
      };
    
    return `
        <div class="container">
      <div class="header">
            <div class="logo">🌱 SmartAgro</div>
            <div class="subtitle">Agricultural Intelligence Platform</div>
            <div class="device-info">
              <strong>Device ID:</strong> ${currentDeviceId || 'DEMO_DEVICE_001'}<br>
              <strong>Report Generated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Location:</strong> Smart Farm Field A
            </div>
      </div>

          <div class="content">
            <div class="date-range">
              <strong>📅 Report Period:</strong> ${new Date(dateRange.fromDate).toLocaleDateString()} to ${new Date(dateRange.toDate).toLocaleDateString()}
              <br><strong>📊 Data Points:</strong> 144 readings over ${Math.ceil((new Date(dateRange.toDate) - new Date(dateRange.fromDate)) / (1000 * 60 * 60 * 24))} days
            </div>

            <div class="bench-details">
              <div class="bench-title">🏢 Bench Details</div>
              <div class="bench-info">
                <div class="bench-item">
                  <div class="bench-label">Bench Name</div>
                  <div class="bench-value">SmartAgro Development Lab</div>
                </div>
                <div class="bench-item">
                  <div class="bench-label">Location</div>
                  <div class="bench-value">Agricultural Research Center</div>
                </div>
                <div class="bench-item">
                  <div class="bench-label">Supervisor</div>
                  <div class="bench-value">Dr. Agricultural Sciences</div>
                </div>
                <div class="bench-item">
                  <div class="bench-label">Project</div>
                  <div class="bench-value">IoT Smart Farming System</div>
                </div>
              </div>
      </div>

      <div class="stats">
        <div class="stat-card">
                <div class="stat-title">🌡️ Temperature Analysis</div>
                <div style="margin-bottom: 8px;">
                  <div class="stat-value">${formatNumber(stats.temperature.min)}°C</div>
                  <div class="stat-unit">Minimum</div>
                </div>
                <div style="margin-bottom: 8px;">
                  <div class="stat-value">${formatNumber(stats.temperature.max)}°C</div>
                  <div class="stat-unit">Maximum</div>
                </div>
                <div>
                  <div class="stat-value">${formatNumber(stats.temperature.avg)}°C</div>
                  <div class="stat-unit">Average</div>
                </div>
        </div>

        <div class="stat-card">
                <div class="stat-title">💧 Humidity Analysis</div>
                <div style="margin-bottom: 8px;">
                  <div class="stat-value">${formatNumber(stats.humidity.min)}%</div>
                  <div class="stat-unit">Minimum</div>
                </div>
                <div style="margin-bottom: 8px;">
                  <div class="stat-value">${formatNumber(stats.humidity.max)}%</div>
                  <div class="stat-unit">Maximum</div>
                </div>
                <div>
                  <div class="stat-value">${formatNumber(stats.humidity.avg)}%</div>
                  <div class="stat-unit">Average</div>
                </div>
        </div>

        <div class="stat-card">
                <div class="stat-title">🌱 Soil Moisture Analysis</div>
                <div style="margin-bottom: 8px;">
                  <div class="stat-value">${formatNumber(stats.soilMoisture.min)}%</div>
                  <div class="stat-unit">Minimum</div>
                </div>
                <div style="margin-bottom: 8px;">
                  <div class="stat-value">${formatNumber(stats.soilMoisture.max)}%</div>
                  <div class="stat-unit">Maximum</div>
                </div>
                <div>
                  <div class="stat-value">${formatNumber(stats.soilMoisture.avg)}%</div>
                  <div class="stat-unit">Average</div>
                </div>
        </div>

        <div class="stat-card">
                <div class="stat-title">🌬️ Air Quality Analysis</div>
                <div style="margin-bottom: 8px;">
                  <div class="stat-value">${formatNumber(stats.gasLevel.min, 0)}</div>
                  <div class="stat-unit">Min ppm</div>
                </div>
                <div style="margin-bottom: 8px;">
                  <div class="stat-value">${formatNumber(stats.gasLevel.max, 0)}</div>
                  <div class="stat-unit">Max ppm</div>
                </div>
                <div>
                  <div class="stat-value">${formatNumber(stats.gasLevel.avg, 0)}</div>
                  <div class="stat-unit">Avg ppm</div>
                </div>
              </div>
        </div>

            <div class="chart-section">
              <h3 style="color: #16a34a; margin: 0 0 15px 0; font-size: 16px; text-align: center;">📈 Sensor Data Trends</h3>
              
              <!-- Temperature Chart -->
              <div class="chart-container">
                <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">🌡️ Temperature Trend</h4>
                <div class="chart-data">
                  ${generateChartHTML(data, 'temperature', '°C', '#22c55e')}
                </div>
              </div>

              <!-- Humidity Chart -->
              <div class="chart-container">
                <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">💧 Humidity Trend</h4>
                <div class="chart-data">
                  ${generateChartHTML(data, 'humidity', '%', '#3b82f6')}
                </div>
              </div>

              <!-- Soil Moisture Chart -->
              <div class="chart-container">
                <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">🌱 Soil Moisture Trend</h4>
                <div class="chart-data">
                  ${generateChartHTML(data, 'soilMoisture', '%', '#8b5cf6')}
                </div>
              </div>

              <!-- Gas Level Chart -->
              <div class="chart-container">
                <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">🌬️ Air Quality Trend</h4>
                <div class="chart-data">
                  ${generateChartHTML(data, 'gasLevel', 'ppm', '#f59e0b')}
                </div>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #22c55e; page-break-inside: avoid;">
              <h3 style="color: #16a34a; margin: 0 0 8px 0; font-size: 14px;">📋 Analysis Summary</h3>
              <p style="margin: 0; color: #374151; font-size: 12px; line-height: 1.4;">
                This report contains 144 sensor readings collected over ${Math.ceil((new Date(dateRange.toDate) - new Date(dateRange.fromDate)) / (1000 * 60 * 60 * 24))} days. 
                The data shows environmental conditions including temperature, humidity, soil moisture, and air quality metrics. 
                This information is crucial for optimizing agricultural practices and ensuring optimal crop growth conditions.
              </p>
            </div>
          </div>

          <div class="footer">
            <p><strong>SmartAgro Agricultural Intelligence Platform</strong></p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>© 2024 SmartAgro - Revolutionizing Agriculture with IoT Technology</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('❌ Error generating report HTML:', error);
      return `
        <div class="container">
          <div class="header">
            <div class="logo">🌱 SmartAgro</div>
            <div class="subtitle">Agricultural Intelligence Platform</div>
          </div>
          <div class="content">
            <div class="date-range">
              <strong>Report Period:</strong> ${new Date(dateRange.fromDate).toLocaleDateString()} to ${new Date(dateRange.toDate).toLocaleDateString()}
            </div>
            <div class="stats">
        <div class="stat-card">
                <div class="stat-title">Error</div>
                <div class="stat-value">Unable to generate statistics</div>
                <div class="stat-unit">Data points: ${data.length}</div>
              </div>
            </div>
        </div>
      </div>
    `;
    }
  };

  const calculateReportStats = (data) => {
    if (!data || data.length === 0) {
      return {
        temperature: { min: 0, max: 0, avg: 0 },
        humidity: { min: 0, max: 0, avg: 0 },
        soilMoisture: { min: 0, max: 0, avg: 0 },
        gasLevel: { min: 0, max: 0, avg: 0 }
      };
    }

    const stats = {
      temperature: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
      humidity: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
      soilMoisture: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
      gasLevel: { min: Infinity, max: -Infinity, sum: 0, count: 0 }
    };

    data.forEach(item => {
      // Temperature
      if (item.temperature !== undefined && item.temperature !== null && !isNaN(item.temperature)) {
        stats.temperature.min = Math.min(stats.temperature.min, item.temperature);
        stats.temperature.max = Math.max(stats.temperature.max, item.temperature);
        stats.temperature.sum += item.temperature;
        stats.temperature.count++;
      }
      // Humidity
      if (item.humidity !== undefined && item.humidity !== null && !isNaN(item.humidity)) {
        stats.humidity.min = Math.min(stats.humidity.min, item.humidity);
        stats.humidity.max = Math.max(stats.humidity.max, item.humidity);
        stats.humidity.sum += item.humidity;
        stats.humidity.count++;
      }
      // Soil Moisture
      if (item.soilMoisture !== undefined && item.soilMoisture !== null && !isNaN(item.soilMoisture)) {
        stats.soilMoisture.min = Math.min(stats.soilMoisture.min, item.soilMoisture);
        stats.soilMoisture.max = Math.max(stats.soilMoisture.max, item.soilMoisture);
        stats.soilMoisture.sum += item.soilMoisture;
        stats.soilMoisture.count++;
      }
      // Gas Level
      if (item.gasLevel !== undefined && item.gasLevel !== null && !isNaN(item.gasLevel)) {
        stats.gasLevel.min = Math.min(stats.gasLevel.min, item.gasLevel);
        stats.gasLevel.max = Math.max(stats.gasLevel.max, item.gasLevel);
        stats.gasLevel.sum += item.gasLevel;
        stats.gasLevel.count++;
      }
    });

    // Calculate averages and handle edge cases
    Object.keys(stats).forEach(key => {
      if (stats[key].count > 0) {
        stats[key].avg = stats[key].sum / stats[key].count;
      } else {
        // If no valid data, set default values
        stats[key] = { min: 0, max: 0, avg: 0 };
      }
    });

    // Handle Infinity values
    Object.keys(stats).forEach(key => {
      if (stats[key].min === Infinity) stats[key].min = 0;
      if (stats[key].max === -Infinity) stats[key].max = 0;
    });

    return stats;
  };
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  const pendingCostEstimations = deviceRequests.filter(req => req.status === 'cost-estimated');
  
  return (
    <div 
      className="min-h-screen relative bg-gradient-to-br from-green-50 via-green-100 to-green-200"
      style={{
        backgroundImage: 'url(/images/leaves-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Enhanced overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/20 to-white/30 backdrop-blur-sm"></div>
      
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-white drop-shadow-lg">Smart Agriculture Dashboard</h1>
                {currentDeviceId && (
                  <div className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md ${
                    isOnline 
                      ? 'bg-green-500/80 text-white border border-green-300' 
                      : 'bg-red-500/80 text-white border border-red-300'
                  }`}>
                    {isOnline ? '🟢 Device Online' : '🔴 Device Offline'}
                  </div>
                )}
              </div>
              <p className="mt-2 text-lg text-white/90 drop-shadow-md">
                Welcome back, {currentUser?.displayName || currentUser?.email}!
              </p>
            </div>
          </div>
        </div>


        {/* Main Dashboard Content */}
        {currentDeviceId ? (
          <div className="space-y-8">
            {/* Real-time Sensor Cards */}
            <div className="bg-white/80 backdrop-blur-md border border-green-200 shadow-md rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Real-time Farm Monitoring</h2>
            <RealtimeSensorCards 
              sensorData={sensorData} 
              isOnline={isOnline} 
              deviceId={currentDeviceId} 
            />
            </div>

            {/* Real-time Charts */}
            <div className="bg-white/80 backdrop-blur-md border border-green-200 shadow-md rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Live Sensor Trends</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live updating every 10s</span>
                </div>
              </div>
              {chartData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Temperature Chart */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Temperature (°C)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData.slice(-12)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#6B7280" 
                          tick={{ fontSize: 10 }} 
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="#6B7280" label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${value}°C`, 'Temperature']} />
                        <Line type="monotone" dataKey="temperature" stroke="#F59E0B" strokeWidth={2} dot={false} name="Temperature (°C)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Humidity Chart */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Humidity (%)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData.slice(-12)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#6B7280" 
                          tick={{ fontSize: 10 }} 
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="#6B7280" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Humidity']} />
                        <Line type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2} dot={false} name="Humidity (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Soil Moisture Chart */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Soil Moisture (%)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData.slice(-12)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#6B7280" 
                          tick={{ fontSize: 10 }} 
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="#6B7280" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Soil Moisture']} />
                        <Line type="monotone" dataKey="soilMoisture" stroke="#10B981" strokeWidth={2} dot={false} name="Soil Moisture (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gas Levels Chart */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Gas Level Trends (ppm)</h3>
                      <div className="text-xs text-gray-500">
                        Gas: {chartData.slice(-1)[0]?.gasLevel || 0} ppm | 
                        Air: {chartData.slice(-1)[0]?.airQuality || 0} | 
                        Points: {chartData.length}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData.slice(-12).map(item => ({
                        ...item,
                        gasLevel: item.gasLevel || 0,
                        airQuality: item.airQuality || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#6B7280" 
                          tick={{ fontSize: 10 }} 
                          interval="preserveStartEnd"
                        />
                        <YAxis stroke="#6B7280" domain={[0, 300]} label={{ value: 'ppm', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value, name) => [`${value} ppm`, name]}
                          labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="gasLevel" 
                          stroke="#8B5CF6" 
                          strokeWidth={3} 
                          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }} 
                          name="Gas Level (ppm)" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="airQuality" 
                          stroke="#F59E0B" 
                          strokeWidth={3} 
                          dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }} 
                          name="Air Quality (ppm)" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-500 mb-2">Loading real-time sensor data...</p>
                <p className="text-sm text-gray-400">Charts will update every 10 seconds with live sensor readings</p>
                  <div className="mt-4">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600">Waiting for sensor data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>



            {/* Dynamic Report Generation */}
            <div className="bg-white/80 backdrop-blur-md border border-green-200 shadow-md rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Custom Reports</h2>
              <div className="space-y-6">
                {/* Date Range Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <input
                      type="date"
                      value={reportDateRange.fromDate}
                      max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                      onChange={(e) => {
                        const selectedFromDate = e.target.value;
                        setReportDateRange(prev => {
                          const newRange = { ...prev, fromDate: selectedFromDate };
                          
                          // If to date is before the new from date, clear it
                          if (prev.toDate && selectedFromDate && new Date(selectedFromDate) > new Date(prev.toDate)) {
                            newRange.toDate = '';
                          }
                          
                          return newRange;
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Select start date (cannot be in the future)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <input
                      type="date"
                      value={reportDateRange.toDate}
                      min={reportDateRange.fromDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Cannot be before from date or more than 1 year ago
                      max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                      onChange={(e) => {
                        const selectedToDate = e.target.value;
                        setReportDateRange(prev => ({ ...prev, toDate: selectedToDate }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Select end date (cannot be in the future or before from date)</p>
                  </div>
                </div>

                {/* Date Range Validation Summary */}
                {reportDateRange.fromDate && reportDateRange.toDate && (
                  <div className={`border rounded-lg p-4 ${
                    validateDateRange(reportDateRange.fromDate, reportDateRange.toDate).isValid 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Date Range Summary</h4>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        validateDateRange(reportDateRange.fromDate, reportDateRange.toDate).isValid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {validateDateRange(reportDateRange.fromDate, reportDateRange.toDate).isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>From:</strong> {new Date(reportDateRange.fromDate).toLocaleDateString()}</p>
                      <p><strong>To:</strong> {new Date(reportDateRange.toDate).toLocaleDateString()}</p>
                      <p><strong>Duration:</strong> {Math.ceil((new Date(reportDateRange.toDate) - new Date(reportDateRange.fromDate)) / (1000 * 60 * 60 * 24)) + 1} days</p>
                      <p><strong>Data Points Available:</strong> {
                        chartData.filter(item => {
                          if (!item || !item.timestamp) return false;
                          const itemDate = new Date(item.timestamp);
                          const fromDate = new Date(reportDateRange.fromDate);
                          const toDate = new Date(reportDateRange.toDate);
                          return itemDate >= fromDate && itemDate <= toDate;
                        }).length
                      }</p>
                      {!validateDateRange(reportDateRange.fromDate, reportDateRange.toDate).isValid && (
                        <p className="text-red-600 font-medium">
                          ⚠️ {validateDateRange(reportDateRange.fromDate, reportDateRange.toDate).message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Generate Report Button */}
                <div className="flex justify-center">
                  <button
                    onClick={generatePDFReport}
                    disabled={
                      !reportDateRange.fromDate || 
                      !reportDateRange.toDate || 
                      isGeneratingReport ||
                      !validateDateRange(reportDateRange.fromDate, reportDateRange.toDate).isValid
                    }
                    className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                      !reportDateRange.fromDate || 
                      !reportDateRange.toDate || 
                      isGeneratingReport ||
                      !validateDateRange(reportDateRange.fromDate, reportDateRange.toDate).isValid
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isGeneratingReport ? 'Generating Report...' : '📄 Generate PDF Report'}
                  </button>
                </div>

                {(!reportDateRange.fromDate || !reportDateRange.toDate) && (
                  <div className="text-sm text-gray-600 text-center space-y-2">
                    <p>Please select both from and to dates to generate a report</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• From date cannot be in the future</p>
                      <p>• To date cannot be in the future or before from date</p>
                      <p>• Date range cannot exceed 30 days</p>
                      <p>• Date range cannot be more than 1 year in the past</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Pending Cost Estimations */}
        {pendingCostEstimations.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md border border-green-200 shadow-md rounded-xl p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Cost Estimations</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingCostEstimations.map((request) => (
                <CostEstimationCard
                  key={request.id}
                  request={request}
                  onUpdate={handleCostEstimationUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* My Devices */}
        {assignedDevices.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md border border-green-200 shadow-md rounded-xl p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Devices</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {assignedDevices.map((device) => (
                <DeviceStatusCard
                  key={device.id}
                  device={device}
                />
              ))}
            </div>
          </div>
        )}


        {/* Weather Section */}
        <div className="mt-8">
          <WeatherSection />
        </div>

        {/* Recent Requests */}
        {deviceRequests.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md border border-green-200 shadow-md rounded-xl p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Requests</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farm Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deviceRequests.slice(0, 5).map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{request.id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.farmName || request.farmInfo?.farmName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'cost-estimated' ? 'bg-blue-100 text-blue-800' :
                            request.status === 'user-accepted' ? 'bg-green-100 text-green-800' :
                            request.status === 'user-rejected' ? 'bg-red-100 text-red-800' :
                            request.status === 'device-assigned' ? 'bg-purple-100 text-purple-800' :
                            request.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            request.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status === 'user-accepted' ? 'User Accepted' :
                             request.status === 'user-rejected' ? 'User Rejected' :
                             request.status === 'cost-estimated' ? 'Cost Estimated' :
                             request.status === 'device-assigned' ? 'Device Assigned' :
                             request.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
        )}
      </div>

      {/* Request Device Modal */}
      {showRequestModal && (
        <RequestDeviceModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSuccess={handleRequestSuccess}
          canRequestMore={canRequestDevice}
        />
      )}
    </div>
  );
};
export default UserDashboardNew;

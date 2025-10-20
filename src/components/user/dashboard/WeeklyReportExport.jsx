import React, { useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../services/firebase/firebase';

const WeeklyReportExport = ({ deviceId, isOnline }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Generate CSV data
  const generateCSV = (data) => {
    if (!data || data.length === 0) return '';

    const headers = [
      'Timestamp',
      'Date',
      'Time',
      'Soil Moisture Raw',
      'Soil Moisture %',
      'Air Temperature (°C)',
      'Air Humidity (%)',
      'Soil Temperature (°C)',
      'Air Quality Index',
      'CO2 (ppm)',
      'NH3 (ppm)',
      'Light Detected',
      'Rain Level Raw',
      'Relay Status'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.timestamp,
        new Date(item.timestamp).toLocaleDateString(),
        new Date(item.timestamp).toLocaleTimeString(),
        item.soilMoistureRaw || 0,
        item.soilMoisturePct || 0,
        item.airTemperature || 0,
        item.airHumidity || 0,
        item.soilTemperature || 0,
        item.airQualityIndex || 0,
        item.gases?.co2 || 0,
        item.gases?.nh3 || 0,
        item.lightDetected || 0,
        item.rainLevelRaw || 0,
        item.relayStatus || 'off'
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  // Calculate statistics
  const calculateStats = (data) => {
    if (!data || data.length === 0) return null;

    const stats = {
      soilMoisture: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
      airTemperature: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
      airHumidity: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
      soilTemperature: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
      airQuality: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
      relayOnTime: 0,
      totalDataPoints: data.length
    };

    data.forEach(item => {
      // Soil Moisture
      if (item.soilMoisturePct !== undefined) {
        stats.soilMoisture.min = Math.min(stats.soilMoisture.min, item.soilMoisturePct);
        stats.soilMoisture.max = Math.max(stats.soilMoisture.max, item.soilMoisturePct);
        stats.soilMoisture.sum += item.soilMoisturePct;
        stats.soilMoisture.count++;
      }

      // Air Temperature
      if (item.airTemperature !== undefined) {
        stats.airTemperature.min = Math.min(stats.airTemperature.min, item.airTemperature);
        stats.airTemperature.max = Math.max(stats.airTemperature.max, item.airTemperature);
        stats.airTemperature.sum += item.airTemperature;
        stats.airTemperature.count++;
      }

      // Air Humidity
      if (item.airHumidity !== undefined) {
        stats.airHumidity.min = Math.min(stats.airHumidity.min, item.airHumidity);
        stats.airHumidity.max = Math.max(stats.airHumidity.max, item.airHumidity);
        stats.airHumidity.sum += item.airHumidity;
        stats.airHumidity.count++;
      }

      // Soil Temperature
      if (item.soilTemperature !== undefined) {
        stats.soilTemperature.min = Math.min(stats.soilTemperature.min, item.soilTemperature);
        stats.soilTemperature.max = Math.max(stats.soilTemperature.max, item.soilTemperature);
        stats.soilTemperature.sum += item.soilTemperature;
        stats.soilTemperature.count++;
      }

      // Air Quality
      if (item.airQualityIndex !== undefined) {
        stats.airQuality.min = Math.min(stats.airQuality.min, item.airQualityIndex);
        stats.airQuality.max = Math.max(stats.airQuality.max, item.airQualityIndex);
        stats.airQuality.sum += item.airQualityIndex;
        stats.airQuality.count++;
      }

      // Relay status
      if (item.relayStatus === 'on') {
        stats.relayOnTime++;
      }
    });

    // Calculate averages
    Object.keys(stats).forEach(key => {
      if (key !== 'relayOnTime' && key !== 'totalDataPoints' && stats[key].count > 0) {
        stats[key].avg = stats[key].sum / stats[key].count;
      }
    });

    return stats;
  };

  // Load historical data for the last 7 days
  const loadHistoricalData = async () => {
    if (!deviceId || !database) return [];

    return new Promise((resolve) => {
      const historyRef = ref(database, `devices/${deviceId}/sensors/history`);
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      onValue(historyRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dataArray = Object.entries(data)
            .map(([timestamp, values]) => ({
              timestamp: parseInt(timestamp),
              ...values
            }))
            .filter(item => item.timestamp >= sevenDaysAgo)
            .sort((a, b) => a.timestamp - b.timestamp);

          resolve(dataArray);
        } else {
          resolve([]);
        }
      }, (error) => {
        console.error('Error loading historical data:', error);
        resolve([]);
      });
    });
  };

  // Generate report
  const generateReport = async () => {
    if (!isOnline) {
      alert('Device is offline. Cannot generate report.');
      return;
    }

    setIsGenerating(true);
    try {
      const data = await loadHistoricalData();
      const stats = calculateStats(data);
      
      setReportData({
        data,
        stats,
        generatedAt: new Date().toISOString(),
        deviceId
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download CSV
  const downloadCSV = () => {
    if (!reportData) return;

    const csvContent = generateCSV(reportData.data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartagro-report-${deviceId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Download PDF (client-side generation)
  const downloadPDF = () => {
    if (!reportData) return;

    // Simple PDF generation using browser's print functionality
    const printWindow = window.open('', '_blank');
    const reportHTML = generateReportHTML(reportData);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>SmartAgro Report - ${deviceId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .stat-title { font-weight: bold; margin-bottom: 10px; }
            .stat-value { font-size: 18px; color: #059669; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          ${reportHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  // Generate HTML for PDF
  const generateReportHTML = (data) => {
    const { stats, generatedAt, deviceId } = data;
    
    return `
      <div class="header">
        <h1>SmartAgro Weekly Report</h1>
        <p>Device ID: ${deviceId}</p>
        <p>Generated: ${new Date(generatedAt).toLocaleString()}</p>
        <p>Period: Last 7 Days</p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-title">Soil Moisture</div>
          <div class="stat-value">Min: ${stats.soilMoisture.min.toFixed(1)}%</div>
          <div class="stat-value">Max: ${stats.soilMoisture.max.toFixed(1)}%</div>
          <div class="stat-value">Avg: ${stats.soilMoisture.avg?.toFixed(1)}%</div>
        </div>

        <div class="stat-card">
          <div class="stat-title">Air Temperature</div>
          <div class="stat-value">Min: ${stats.airTemperature.min.toFixed(1)}°C</div>
          <div class="stat-value">Max: ${stats.airTemperature.max.toFixed(1)}°C</div>
          <div class="stat-value">Avg: ${stats.airTemperature.avg?.toFixed(1)}°C</div>
        </div>

        <div class="stat-card">
          <div class="stat-title">Air Humidity</div>
          <div class="stat-value">Min: ${stats.airHumidity.min.toFixed(1)}%</div>
          <div class="stat-value">Max: ${stats.airHumidity.max.toFixed(1)}%</div>
          <div class="stat-value">Avg: ${stats.airHumidity.avg?.toFixed(1)}%</div>
        </div>

        <div class="stat-card">
          <div class="stat-title">Soil Temperature</div>
          <div class="stat-value">Min: ${stats.soilTemperature.min.toFixed(1)}°C</div>
          <div class="stat-value">Max: ${stats.soilTemperature.max.toFixed(1)}°C</div>
          <div class="stat-value">Avg: ${stats.soilTemperature.avg?.toFixed(1)}°C</div>
        </div>

        <div class="stat-card">
          <div class="stat-title">Air Quality</div>
          <div class="stat-value">Min: ${stats.airQuality.min.toFixed(0)} ppm</div>
          <div class="stat-value">Max: ${stats.airQuality.max.toFixed(0)} ppm</div>
          <div class="stat-value">Avg: ${stats.airQuality.avg?.toFixed(0)} ppm</div>
        </div>

        <div class="stat-card">
          <div class="stat-title">Pump Activity</div>
          <div class="stat-value">On: ${stats.relayOnTime} times</div>
          <div class="stat-value">Total Data: ${stats.totalDataPoints} points</div>
        </div>
      </div>
    `;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Weekly Report</h3>
          <p className="text-sm text-gray-600">Export sensor data and statistics for the last 7 days</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>

      {/* Report Generation */}
      <div className="space-y-4">
        <button
          onClick={generateReport}
          disabled={!isOnline || isGenerating}
          className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
            !isOnline || isGenerating
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isGenerating ? 'Generating Report...' : 'Generate Weekly Report'}
        </button>

        {!isOnline && (
          <p className="text-sm text-red-600 text-center">
            Device must be online to generate reports
          </p>
        )}
      </div>

      {/* Report Data Display */}
      {reportData && (
        <div className="mt-6 space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Report Generated Successfully</h4>
            <p className="text-sm text-green-800">
              Generated on {new Date(reportData.generatedAt).toLocaleString()}
            </p>
            <p className="text-sm text-green-800">
              Data points: {reportData.data.length} | Device: {reportData.deviceId}
            </p>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Soil Moisture</h5>
              <p className="text-sm text-blue-800">
                Min: {reportData.stats.soilMoisture.min.toFixed(1)}%<br/>
                Max: {reportData.stats.soilMoisture.max.toFixed(1)}%<br/>
                Avg: {reportData.stats.soilMoisture.avg?.toFixed(1)}%
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h5 className="font-medium text-orange-900 mb-2">Air Temperature</h5>
              <p className="text-sm text-orange-800">
                Min: {reportData.stats.airTemperature.min.toFixed(1)}°C<br/>
                Max: {reportData.stats.airTemperature.max.toFixed(1)}°C<br/>
                Avg: {reportData.stats.airTemperature.avg?.toFixed(1)}°C
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-medium text-purple-900 mb-2">Pump Activity</h5>
              <p className="text-sm text-purple-800">
                Times On: {reportData.stats.relayOnTime}<br/>
                Total Data: {reportData.stats.totalDataPoints} points
              </p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={downloadCSV}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 Download CSV
            </button>
            <button
              onClick={downloadPDF}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              📄 Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">📋 Report Information</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• CSV contains all sensor readings with timestamps</li>
            <li>• PDF includes summary statistics and charts</li>
            <li>• Data covers the last 7 days from device history</li>
            <li>• Reports are generated client-side for privacy</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportExport;
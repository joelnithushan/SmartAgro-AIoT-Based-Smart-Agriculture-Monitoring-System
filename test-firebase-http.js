const https = require('https');

async function testFirebaseHTTP() {
  console.log('🔍 Testing Firebase HTTP API access...');
  
  const deviceId = 'ESP32_001';
  const baseUrl = 'https://smartagro-4-default-rtdb.asia-southeast1.firebasedatabase.app';
  
  // Test data
  const testData = {
    soilMoisture: 45,
    airTemp: 26.5,
    airHumidity: 68,
    soilTemp: 24.2,
    gasLevel: 280,
    rain: 0,
    light: 1,
    pumpStatus: false,
    timestamp: Date.now()
  };
  
  const url = `${baseUrl}/devices/${deviceId}/sensors/latest.json`;
  const data = JSON.stringify(testData);
  
  console.log('📡 Sending test data to:', url);
  console.log('📊 Data:', JSON.stringify(testData, null, 2));
  
  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const req = https.request(url, options, (res) => {
    console.log(`📡 Response status: ${res.statusCode}`);
    console.log(`📡 Response headers:`, res.headers);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('📡 Response body:', responseData);
      
      if (res.statusCode === 200) {
        console.log('✅ HTTP test successful! Firebase accepts PUT requests');
      } else {
        console.log('❌ HTTP test failed. Status:', res.statusCode);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request error:', error);
  });
  
  req.write(data);
  req.end();
}

testFirebaseHTTP();

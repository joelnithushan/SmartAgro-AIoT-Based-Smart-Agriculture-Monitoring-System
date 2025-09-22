# 📧📱 SendGrid & Twilio Setup Complete

## ✅ **Your Credentials Received**

I've received your SendGrid and Twilio credentials. Here's what you need to do to complete the setup:

### **Your Credentials:**
- **SendGrid API Key**: `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`
- **Twilio Account SID**: `AC10c0bca3fdd4bcb3a1b38e037212b37c`
- **Twilio Auth Token**: `b85f6305b23f529299f3c5f98a069f60`
- **Twilio Phone Number**: `+19514254418`

## 🔧 **Manual Setup Steps**

### **Step 1: Create Backend .env File**

1. Navigate to your `backend` folder: `D:\Garry\backend\`
2. Create a new file called `.env` (no extension)
3. Copy and paste the following content:

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"your-client-email@your-project-id.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-client-email%40your-project-id.iam.gserviceaccount.com"}
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# SendGrid Email Configuration
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=alerts@smartagro.com

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=AC10c0bca3fdd4bcb3a1b38e037212b37c
TWILIO_AUTH_TOKEN=b85f6305b23f529299f3c5f98a069f60
TWILIO_PHONE_NUMBER=+19514254418

# Server Configuration
PORT=5000
NODE_ENV=development
```

### **Step 2: Install Dependencies**

Run this command in your terminal:

```bash
cd backend
npm install
```

### **Step 3: Test the Setup**

#### **Test SendGrid Email:**
```bash
curl -X POST http://localhost:5000/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

#### **Test Twilio SMS:**
```bash
curl -X POST http://localhost:5000/api/notifications/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

#### **Check Service Status:**
```bash
curl http://localhost:5000/api/notifications/status
```

## 🚀 **Start the Backend Server**

```bash
cd backend
node server.js
```

You should see:
```
🚀 AI Chatbot Server running on port 5000
📡 Gemini API configured: true
🔥 Firebase configured: true
🕐 Server started at: 12/19/2024, 12:00:00 PM (UTC+5:30)
🌍 Timezone: Asia/Colombo (Sri Lanka)
```

## 📧 **SendGrid Configuration**

### **Email Templates**
Your system will send professional HTML emails with:
- ✅ **Critical Alert Styling**: Red headers for critical alerts
- ✅ **Normal Alert Styling**: Green headers for normal alerts
- ✅ **Sri Lanka Timezone**: All timestamps in SL time
- ✅ **Professional Layout**: Clean, responsive design
- ✅ **Action Recommendations**: Smart suggestions based on sensor data

### **Email Content Includes:**
- Alert type and severity
- Parameter name and current value
- Threshold comparison
- Device ID
- Timestamp in SL time
- Recommended actions
- Dashboard link

## 📱 **Twilio SMS Configuration**

### **SMS Features**
Your system will send concise SMS messages with:
- ✅ **Critical Alert Prefix**: 🚨 for critical alerts
- ✅ **Normal Alert Prefix**: 🔔 for normal alerts
- ✅ **Concise Format**: Under 160 characters
- ✅ **Sri Lanka Timezone**: All timestamps in SL time
- ✅ **Smart Recommendations**: Context-aware suggestions

### **SMS Content Includes:**
- Alert severity indicator
- Parameter and value
- Device ID
- Timestamp in SL time
- Quick recommendation (if space allows)

## 🧪 **Testing Your Alert System**

### **1. Create Test Alerts**
1. Go to your dashboard
2. Click on "Alerts" in the sidebar
3. Create test alerts for different parameters
4. Set low thresholds to trigger easily

### **2. Test Email Alerts**
1. Create an email alert for soil moisture < 50%
2. Set your email address
3. Trigger the alert by watering your plant
4. Check your email for the alert

### **3. Test SMS Alerts**
1. Create an SMS alert for temperature > 30°C
2. Set your phone number
3. Trigger the alert by heating the sensor
4. Check your phone for the SMS

### **4. Test Critical Alerts**
1. Create a critical alert (toggle ON)
2. Notice the red styling in emails
3. Notice the 🚨 prefix in SMS
4. Check the alert bell for red indicators

## 🔔 **Alert Bell Integration**

The alert bell in your dashboard will show:
- ✅ **Alert Count**: Number of triggered alerts
- ✅ **Critical Indicators**: Red styling for critical alerts
- ✅ **SL Time Display**: All timestamps in Sri Lanka time
- ✅ **Quick Actions**: Clear alerts directly from the bell
- ✅ **Real-time Updates**: Live updates as alerts trigger

## 📊 **Firestore Structure**

Your alerts will be stored in Firestore as:

```
/users/{userId}/alerts/{alertId}
{
  type: "email" | "sms",
  value: "email@example.com" | "+1234567890",
  parameter: "soilMoisturePct" | "airTemperature" | etc,
  threshold: 50,
  comparison: ">" | "<" | ">=" | "<=",
  critical: true | false,
  active: true | false,
  createdAt: Timestamp,
  createdAtSL: "12/19/2024, 12:00:00 PM"
}

/users/{userId}/triggeredAlerts/{triggeredAlertId}
{
  alertId: "alert123",
  type: "email" | "sms",
  value: "email@example.com" | "+1234567890",
  parameter: "soilMoisturePct",
  threshold: 50,
  comparison: "<",
  currentValue: 45,
  critical: true,
  deviceId: "ESP32_001",
  triggeredAt: Timestamp,
  triggeredAtSL: "12/19/2024, 12:00:00 PM",
  status: "sent",
  cleared: false
}
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **Email Not Sending**:
   - Check SendGrid API key is correct
   - Verify FROM_EMAIL is verified in SendGrid
   - Check server logs for errors

2. **SMS Not Sending**:
   - Check Twilio credentials are correct
   - Verify phone number format (+1234567890)
   - Check Twilio account balance

3. **Alerts Not Triggering**:
   - Check alert is set to "Active"
   - Verify threshold and comparison logic
   - Check sensor data is updating

4. **Wrong Timezone**:
   - All timestamps should show SL time
   - Check browser timezone settings
   - Verify server timezone configuration

## 🎯 **Next Steps**

1. **Create the .env file** with your credentials
2. **Install dependencies** with `npm install`
3. **Start the server** with `node server.js`
4. **Test email notifications** with the curl command
5. **Test SMS notifications** with the curl command
6. **Create test alerts** in your dashboard
7. **Trigger alerts** and verify notifications

## 📞 **Support**

If you encounter any issues:
1. Check the server logs for error messages
2. Verify your credentials are correct
3. Test the notification endpoints
4. Check Firestore for alert data
5. Verify sensor data is updating

Your Smart Agriculture Alert System is now ready to send professional email and SMS notifications in Sri Lanka time! 🇱🇰📧📱

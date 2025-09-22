# 🚨 Alert System Setup Guide

## Overview
The Alert System is a comprehensive notification system for your Smart Agriculture Monitoring System. It allows users to set up alerts for various sensor parameters and receive notifications via SMS or Email when conditions are met.

## Features Implemented

### ✅ 1. Navigation
- Added "Alerts" menu item in the user sidebar
- Accessible at `/user/alerts` route

### ✅ 2. Alerts Management Page
- **Full CRUD Operations**: Create, Read, Update, Delete alerts
- **Alert Configuration**:
  - Type: SMS or Email
  - Contact: Mobile number or email address
  - Parameter: Soil moisture, temperature, humidity, air quality, gas levels
  - Threshold: User-defined value
  - Comparison: >, <, >=, <=
  - Critical: ON/OFF toggle for priority alerts
  - Active: ON/OFF toggle to enable/disable alerts

### ✅ 3. UI Components
- **Alert Form**: Modal with validation for creating/editing alerts
- **Alert List**: Table view with all configured alerts
- **Alert Bell**: Dashboard indicator showing triggered alerts count
- **Confirmation Modal**: Delete confirmation with safety checks

### ✅ 4. Firestore Integration
- **Data Structure**: `/users/{userId}/alerts/{alertId}`
- **Real-time Sync**: Uses `onSnapshot` for live updates
- **Triggered Alerts**: `/users/{userId}/triggeredAlerts/{alertId}`

### ✅ 5. Backend Logic
- **Alert Processor**: `backend/functions/alertProcessor.js`
- **Condition Evaluation**: Compares sensor values with thresholds
- **Debounce System**: Prevents duplicate alerts within 1 minute
- **API Endpoint**: `POST /process-alerts` for processing alerts

### ✅ 6. UI Indicators
- **Alert Bell**: Shows count of triggered alerts in dashboard
- **Critical Alerts**: Red indicators for high-priority alerts
- **Status Badges**: Active/Inactive, Critical/Regular indicators

### ✅ 7. Extra Features
- **Real-time Processing**: Alerts processed when sensor data updates
- **Validation**: Email and phone number format validation
- **Debounce System**: Prevents spam notifications
- **Responsive Design**: Mobile-friendly interface

## File Structure

```
src/
├── pages/user/Alerts.jsx          # Main alerts management page
├── components/AlertBell.jsx       # Dashboard alert indicator
├── hooks/useAlertProcessor.js     # Alert processing logic
└── ...

backend/
├── functions/alertProcessor.js    # Backend alert processing
└── server.js                      # Updated with alert endpoint

firestore-alert-rules.rules        # Firestore security rules
```

## Setup Instructions

### 1. Firestore Security Rules
Deploy the security rules to allow users to manage their alerts:

```bash
firebase deploy --only firestore:rules
```

### 2. Backend Setup
The alert processing is already integrated into the backend server. Make sure your environment variables are set:

```env
FIREBASE_SERVICE_ACCOUNT=your-service-account-key
FIREBASE_DATABASE_URL=your-database-url
```

### 3. Frontend Integration
The alert system is already integrated into:
- User sidebar navigation
- Dashboard with alert bell indicator
- Real-time alert processing

### 4. SMS/Email Integration (Optional)
To enable actual SMS and Email sending, integrate with:

**SMS (Twilio)**:
```javascript
// In alertProcessor.js
import twilio from 'twilio';
const client = twilio(accountSid, authToken);

await client.messages.create({
  body: smsContent.message,
  from: '+1234567890',
  to: alert.value
});
```

**Email (SendGrid)**:
```javascript
// In alertProcessor.js
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: alert.value,
  from: 'alerts@yourfarm.com',
  subject: emailContent.subject,
  text: emailContent.body
});
```

## Usage

### Creating an Alert
1. Navigate to "Alerts" in the sidebar
2. Click "Add Alert"
3. Configure:
   - Alert Type (SMS/Email)
   - Contact information
   - Parameter to monitor
   - Threshold value and comparison
   - Critical status
   - Active status
4. Save the alert

### Monitoring Alerts
- View all alerts in the alerts table
- Edit existing alerts by clicking "Edit"
- Delete alerts with confirmation
- Monitor triggered alerts via the alert bell in dashboard

### Alert Processing
- Alerts are automatically processed when sensor data updates
- Conditions are evaluated in real-time
- Notifications are sent based on alert configuration
- Debounce system prevents duplicate alerts

## Security Features

- **User Isolation**: Users can only access their own alerts
- **Authentication**: All operations require user authentication
- **Validation**: Input validation for email/phone formats
- **Rate Limiting**: Debounce system prevents spam

## Testing

### Test Alert Creation
1. Create a test alert with a low threshold
2. Wait for sensor data to exceed the threshold
3. Check the alert bell for triggered alerts
4. Verify the alert appears in the triggered alerts list

### Test Alert Processing
1. Set up an alert for soil moisture < 20%
2. Simulate low soil moisture in your ESP32
3. Verify the alert is triggered and logged
4. Check the debounce system by triggering multiple times

## Troubleshooting

### Common Issues

1. **Alerts not triggering**:
   - Check if alert is active
   - Verify sensor data is being received
   - Check browser console for errors

2. **Firestore permission errors**:
   - Ensure security rules are deployed
   - Check user authentication status

3. **Backend errors**:
   - Check server logs for alert processing errors
   - Verify Firebase service account configuration

### Debug Mode
Enable debug logging by checking browser console and server logs for alert processing information.

## Future Enhancements

- **Push Notifications**: Browser push notifications
- **Alert Templates**: Pre-configured alert templates
- **Alert Scheduling**: Time-based alert conditions
- **Alert Groups**: Group alerts by device or parameter
- **Alert Analytics**: Statistics on alert frequency and effectiveness

## Support

For issues or questions about the Alert System:
1. Check the browser console for errors
2. Review server logs for backend issues
3. Verify Firestore security rules
4. Test with simple alert configurations first

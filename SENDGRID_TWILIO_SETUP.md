# 📧📱 SendGrid & Twilio Integration Setup

## Overview
Your Smart Agriculture Monitoring System now supports real email and SMS notifications using SendGrid and Twilio services.

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install @sendgrid/mail twilio
```

### 2. SendGrid Setup (Email Notifications)

#### Step 1: Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day free)
3. Verify your account via email

#### Step 2: Get API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Choose "Restricted Access"
4. Give it a name (e.g., "SmartAgro Alerts")
5. Grant "Mail Send" permissions
6. Copy the API key (starts with `SG.`)

#### Step 3: Verify Sender Identity
1. Go to Settings → Sender Authentication
2. Choose "Single Sender Verification"
3. Add your email address (e.g., `alerts@yourdomain.com`)
4. Verify the email address

#### Step 4: Add to Environment Variables
Add to your `backend/.env` file:
```env
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=alerts@yourdomain.com
```

### 3. Twilio Setup (SMS Notifications)

#### Step 1: Create Twilio Account
1. Go to [Twilio](https://www.twilio.com/)
2. Sign up for a free account
3. Verify your phone number

#### Step 2: Get Credentials
1. Go to Console Dashboard
2. Copy your Account SID (starts with `AC`)
3. Copy your Auth Token
4. Get a phone number from Phone Numbers → Manage → Buy a number

#### Step 3: Add to Environment Variables
Add to your `backend/.env` file:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token-here
TWILIO_PHONE_NUMBER=+1234567890
```

## 🧪 Testing the Integration

### Test Email Notifications
```bash
curl -X POST http://localhost:5000/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "parameter": "soilMoisturePct",
    "currentValue": 25,
    "threshold": 30
  }'
```

### Test SMS Notifications
```bash
curl -X POST http://localhost:5000/api/notifications/test-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "parameter": "soilMoisturePct",
    "currentValue": 25,
    "threshold": 30
  }'
```

### Check Service Status
```bash
curl http://localhost:5000/api/notifications/status
```

## 📧 Email Features

### Professional HTML Emails
- **Responsive Design**: Works on all devices
- **Critical Alerts**: Red styling for urgent notifications
- **Parameter-Specific Recommendations**: Tailored advice based on sensor type
- **Rich Content**: Icons, colors, and structured layout

### Email Content Includes:
- Alert type and severity
- Parameter details and current values
- Device information
- Timestamp
- Actionable recommendations
- Professional branding

## 📱 SMS Features

### Concise SMS Messages
- **Under 160 Characters**: Single SMS delivery
- **Critical Indicators**: 🚨 for urgent alerts
- **Essential Information**: Parameter, value, device, time
- **Quick Recommendations**: Brief action items

### SMS Content Example:
```
🚨 CRITICAL: Farm Alert
Soil Moisture: 25 < 30
Device: ESP32_001
Time: 2:30 PM
Check irrigation system
```

## 🔧 Configuration Options

### Environment Variables
```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=alerts@yourdomain.com

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Fallback Behavior
- If services are not configured, alerts are logged to console
- No errors are thrown, system continues to work
- Easy to enable/disable services via environment variables

## 🚀 Usage in Your App

### Creating Alerts
1. Go to Alerts page in your dashboard
2. Click "Add Alert"
3. Choose Email or SMS type
4. Enter contact information
5. Configure parameters and thresholds
6. Save the alert

### Alert Processing
- Alerts are automatically processed when sensor data updates
- Email/SMS notifications are sent based on alert configuration
- All notifications are logged to Firestore for tracking

## 📊 Monitoring & Debugging

### Server Logs
```bash
# Check if services are configured
✅ SendGrid API configured: true
✅ Twilio configured: true

# Email sending logs
📧 Sending email alert to: user@example.com
✅ Email sent successfully: 202

# SMS sending logs
📱 Sending SMS alert to: +1234567890
✅ SMS sent successfully: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Firestore Logs
- All triggered alerts are stored in `/users/{userId}/triggeredAlerts`
- Includes delivery status and timestamps
- Easy to track notification history

## 💰 Cost Considerations

### SendGrid (Email)
- **Free Tier**: 100 emails/day
- **Paid Plans**: Starting at $14.95/month for 40,000 emails
- **Best For**: Detailed notifications with rich content

### Twilio (SMS)
- **Free Trial**: $15 credit (approximately 1,500 SMS)
- **Paid**: ~$0.0075 per SMS in US
- **Best For**: Urgent, time-sensitive alerts

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **Rate Limiting**: Built-in debounce system prevents spam
3. **Validation**: Phone numbers and emails are validated
4. **Error Handling**: Graceful fallbacks if services fail

## 🆘 Troubleshooting

### Common Issues

1. **SendGrid "Unauthorized" Error**:
   - Check API key format (starts with `SG.`)
   - Verify sender email is authenticated
   - Check API key permissions

2. **Twilio "Invalid Phone Number" Error**:
   - Ensure phone number includes country code (+1 for US)
   - Check Twilio account balance
   - Verify phone number format

3. **No Notifications Sent**:
   - Check server logs for errors
   - Verify environment variables are set
   - Test with notification endpoints

### Debug Commands
```bash
# Test Twilio connection
curl http://localhost:5000/api/notifications/test-twilio

# Validate phone number
curl -X POST http://localhost:5000/api/notifications/validate-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

## 🎯 Next Steps

1. **Set up accounts** for SendGrid and Twilio
2. **Add environment variables** to your `.env` file
3. **Test notifications** using the provided endpoints
4. **Create alerts** in your dashboard
5. **Monitor logs** to ensure everything works

Your Smart Agriculture Monitoring System now has professional-grade notification capabilities! 🌱📧📱

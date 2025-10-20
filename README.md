# Smart Agriculture Monitoring System

A comprehensive IoT-based smart agriculture monitoring system with AI chatbot, real-time sensor data, and automated irrigation control.

## 🚀 Features

- **Real-time IoT Monitoring**: Live sensor data from ESP32 devices
- **AI-Powered Chatbot**: Agriculture expert chatbot using DeepSeek AI
- **Smart Irrigation**: Automated irrigation control with scheduling
- **Alert System**: Email and SMS notifications for critical conditions
- **Multi-language Support**: English and Tamil language support
- **Admin Dashboard**: Complete system management interface
- **User Management**: Role-based access control
- **Cost Estimation**: PDF generation for agricultural cost estimates

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Git**
- **Firebase Project** with Firestore and Realtime Database
- **OpenRouter API Key** (for DeepSeek AI)
- **SendGrid Account** (for email notifications)
- **Twilio Account** (for SMS notifications)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/joelnithushan/Smart-Agriculture-Monitoring-System.git
cd Smart-Agriculture-Monitoring-System
```

### 2. Install Dependencies

Install frontend dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

### 3. Environment Configuration

#### Frontend Configuration
Create a `.env` file in the root directory:
```bash
# Copy the example file
cp env-example.txt .env
```

#### Backend Configuration
Create a `.env` file in the backend directory:
```bash
# Copy the example file
cp backend/env-example.txt backend/.env
```

**Required Environment Variables for Backend (.env):**

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/

# AI Configuration - DeepSeek AI
DEEPSEEK_API_KEY=your-openrouter-api-key-here
DEEPSEEK_MODEL=deepseek/deepseek-r1-0528-qwen3-8b:free

# Email Configuration
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=alerts@yourdomain.com

# SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token-here
TWILIO_PHONE_NUMBER=+1234567890

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Realtime Database

2. **Generate Service Account Key**:
   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Download the JSON file
   - Copy the content to `FIREBASE_SERVICE_ACCOUNT` in your `.env` file

3. **Update Firebase Configuration**:
   - Copy your project ID to `FIREBASE_DATABASE_URL`
   - Update `src/config/firebase.js` with your Firebase config

### 5. API Keys Setup

#### DeepSeek AI (via OpenRouter)
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up and create an API key
3. Add credits for DeepSeek model
4. Add it to your backend `.env` file

#### SendGrid (Email)
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Add it to your backend `.env` file

#### Twilio (SMS)
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Add them to your backend `.env` file

## 🚀 Running the Application

### Option 1: Run Both Frontend and Backend Together
```bash
npm run start:both
```

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run start:backend
```

**Terminal 2 - Frontend:**
```bash
npm run start:frontend
```

### Option 3: Manual Start

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
npm start
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📱 Default Accounts

### Admin Account
- **Email**: admin@smartagro.com
- **Password**: admin123

### Test User Account
- **Email**: user@smartagro.com
- **Password**: user123

## 🔧 Development

### Project Structure
```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── context/           # React contexts
│   └── config/            # Configuration files
├── backend/               # Node.js backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   └── config/            # Backend configuration
└── functions/             # Firebase Cloud Functions
```

### Available Scripts

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

**Backend:**
- `npm run start:backend` - Start backend server
- `npm run dev` - Start with nodemon (development)

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   
   # Kill process on port 5000
   npx kill-port 5000
   ```

2. **Firebase Connection Issues**:
   - Verify your service account key is correct
   - Check Firebase project permissions
   - Ensure Firestore and Realtime Database are enabled

3. **AI Chatbot Not Working**:
   - Verify your DeepSeek API key is valid
   - Check OpenRouter credits/limits
   - Ensure proper environment variable setup

4. **Email/SMS Not Working**:
   - Verify SendGrid/Twilio credentials
   - Check account verification status
   - Ensure proper phone number format for Twilio

### Environment Variables Checklist

Make sure all these are set in your backend `.env`:
- ✅ `FIREBASE_SERVICE_ACCOUNT`
- ✅ `FIREBASE_DATABASE_URL`
- ✅ `DEEPSEEK_API_KEY`
- ✅ `SENDGRID_API_KEY`
- ✅ `SENDGRID_FROM_EMAIL`
- ✅ `TWILIO_ACCOUNT_SID`
- ✅ `TWILIO_AUTH_TOKEN`
- ✅ `TWILIO_PHONE_NUMBER`

## 📚 API Documentation

### Main Endpoints

- `GET /api/devices` - Get all devices
- `POST /api/devices` - Add new device
- `GET /api/sensor-data/:deviceId` - Get sensor data
- `POST /api/chat` - AI chatbot endpoint
- `POST /api/alerts` - Create alert
- `GET /api/users` - Get users (admin only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

## 🔄 Updates

To get the latest updates:
```bash
git pull origin main
npm install
cd backend && npm install && cd ..
```

---

**Happy Farming! 🌱**

# 🚀 **Team Setup Guide: SmartAgro Project**

## **📋 Prerequisites**
Your team members need to install these before cloning:

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Git**
   - Download from: https://git-scm.com/
   - Verify: `git --version`

3. **Firebase CLI** (optional, for deployment)
   - Install: `npm install -g firebase-tools`
   - Verify: `firebase --version`

## **🔧 Step-by-Step Setup Instructions**

### **1. Clone the Repository**
```bash
git clone https://github.com/joelnithushan/Smart-Agriculture-Monitoring-System.git
cd Smart-Agriculture-Monitoring-System
```

### **2. Install Dependencies**

**Frontend Dependencies:**
```bash
npm install
```

**Backend Dependencies:**
```bash
cd backend
npm install
cd ..
```

### **3. Environment Configuration**

**The project is pre-configured with:**
- ✅ Firebase config files
- ✅ Service account key
- ✅ Firestore rules
- ✅ **Permanent ports**: Frontend 3000, Backend 5000

**No additional setup needed!**

### **4. Run the Project**

**Start Backend Server (Port 5000):**
```bash
cd backend
npm start
# or
node server.js
```

**Start Frontend (Port 3000) - in a new terminal:**
```bash
npm start
```

## **🌐 Access URLs**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## **👥 Team Member Roles & Access**

### **Admin Access:**
- **Super Admin**: `joelnithushan6@gmail.com`
- **Admin Features**: User management, device management, farm data

### **User Access:**
- **Regular Users**: Can register and use all user features
- **Features**: Dashboard, devices, crops, alerts, AI chatbot

## **🔧 Development Workflow**

### **For Regular Development:**
```bash
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Your commit message"

# Push to your branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

### **For Testing:**
```bash
# Test backend API
curl http://localhost:5000/health

# Test admin API (demo mode)
curl -H "Authorization: Bearer demo-token-12345678901234567890123456789012345678901234567890" http://localhost:5000/api/admin/users
```

## **📱 Features Available**

### **User Dashboard:**
- ✅ Device monitoring
- ✅ Crop & fertilizer management
- ✅ Alerts system
- ✅ AI chatbot
- ✅ Profile management

### **Admin Dashboard:**
- ✅ User management (promote/demote/delete)
- ✅ Device management
- ✅ Farm data overview
- ✅ System monitoring

## **🚨 Troubleshooting**

### **Common Issues:**

**1. Port Already in Use:**
```bash
# Kill existing Node processes
taskkill /f /im node.exe  # Windows
# or
pkill -f node  # Mac/Linux
```

**2. Firebase Connection Issues:**
- The project runs in **demo mode** by default
- All admin functions work in demo mode
- No additional Firebase setup required

**3. Dependencies Issues:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**4. Backend Not Starting:**
```bash
# Check if port 5000 is available
netstat -an | findstr :5000  # Windows
# or
lsof -i :5000  # Mac/Linux
```

## **📞 Support**

**If team members face issues:**
1. Check this guide first
2. Contact project lead: Joel Nithushan A.T
3. Check GitHub issues
4. Review the codebase documentation

## **🎯 Quick Start Commands**

**For immediate setup:**
```bash
# Clone and setup
git clone https://github.com/joelnithushan/Smart-Agriculture-Monitoring-System.git
cd Smart-Agriculture-Monitoring-System
npm install
cd backend && npm install && cd ..

# Start both servers
# Terminal 1:
cd backend && npm start

# Terminal 2:
npm start
```

**That's it! The project should be running on:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## **✅ Verification Checklist**

Team members should verify:
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend responds at http://localhost:5000/health
- [ ] Can register/login as user
- [ ] Admin dashboard accessible (demo mode)
- [ ] All navigation works
- [ ] No console errors

## **🔒 Port Configuration**

### **Permanent Port Settings:**
- **Frontend**: Port 3000 (React App)
- **Backend**: Port 5000 (Node.js Server)

### **Important Notes:**
1. **Port 3000** is reserved for the React frontend
2. **Port 5000** is reserved for the Node.js backend
3. These ports are **permanent** and should not be changed
4. All API calls from frontend go to `localhost:5000`
5. All frontend requests come from `localhost:3000`

**The project is ready for team development! 🎉**

# SmartAgro Project - Port Configuration

## 🚀 **Permanent Port Settings**

### **Frontend (React App)**
- **Port**: 3000
- **URL**: http://localhost:3000
- **Configuration**: Set in package.json scripts

### **Backend (Node.js Server)**
- **Port**: 5000
- **URL**: http://localhost:5000
- **Configuration**: Set in backend/server.js

## 📋 **How to Run**

### **Start Frontend (Port 3000)**
```bash
npm start
# or
npm run start:frontend
```

### **Start Backend (Port 5000)**
```bash
cd backend
npm start
# or
node server.js
```

### **Start Both Together**
```bash
npm run start:both
```

## 🔧 **Configuration Files**

### **Frontend API Configuration**
- `src/services/api.js` - Uses `http://localhost:5000`
- `src/services/adminApi.js` - Uses `http://localhost:5000/api`

### **Backend Configuration**
- `backend/server.js` - Listens on port 5000
- Environment variable `PORT` can override (defaults to 5000)

## ✅ **Verification**

### **Check Frontend**
- Open: http://localhost:3000
- Should load the SmartAgro application

### **Check Backend**
- Open: http://localhost:5000/health
- Should return: `{"status":"OK","timestamp":"..."}`

### **Check Admin API**
- Test: http://localhost:5000/api/admin/users
- Should return user data (demo mode)

## 🚨 **Important Notes**

1. **Port 3000** is reserved for the React frontend
2. **Port 5000** is reserved for the Node.js backend
3. These ports are **permanent** and should not be changed
4. All API calls from frontend go to `localhost:5000`
5. All frontend requests come from `localhost:3000`

## 🔄 **For Team Members**

When cloning the project:
1. Frontend will automatically run on port 3000
2. Backend will automatically run on port 5000
3. No port configuration needed
4. Just run `npm start` for frontend and `cd backend && npm start` for backend

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminPanelLayout from '../components/AdminPanelLayout';
import AdminDashboard from '../components/AdminDashboard';
import AdminOrderManagement from '../components/AdminOrderManagement';
import UserManagement from './admin/UserManagement';
import AdminDeviceManagement from '../components/AdminDeviceManagement';
import AdminFarmDataManagement from '../components/AdminFarmDataManagement';
import AdminProfile from '../components/AdminProfile';
const AdminPanel = () => {
  return (
    <AdminPanelLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/orders" element={<AdminOrderManagement />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/devices" element={<AdminDeviceManagement />} />
        <Route path="/farm-data" element={<AdminFarmDataManagement />} />
        <Route path="/profile" element={<AdminProfile />} />
      </Routes>
    </AdminPanelLayout>
  );
};
export default AdminPanel;
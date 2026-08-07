// src/App.jsx - Simplified version
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expense from './pages/Expense';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Staff from './pages/Staff';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import UserGuide from './pages/UserGuide';
import ShopLogin from './pages/Login';

// Super Admin Imports
import SuperAdminLayout from './components/SuperAdminLayout';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminLogin from './pages/SuperAdmin/Login';
import Shops from './pages/SuperAdmin/Shops';
import Payments from './pages/SuperAdmin/Payments';
import Analytics from './pages/SuperAdmin/Analytics';
import SuperAdminSettings from './pages/SuperAdmin/Settings';

// Protected route components
import ShopProtectedRoute from './components/ShopProtectedRoute';
import SuperAdminProtectedRoute from './components/SuperAdminProtectedRoute';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-500">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============ PUBLIC ROUTES ============ */}
        <Route path="/login" element={<ShopLogin />} />
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        
        {/* ============ SHOP ROUTES ============ */}
        <Route 
          path="/" 
          element={
            <ShopProtectedRoute>
              <Layout />
            </ShopProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="sales" element={<Sales />} />
          <Route path="expense" element={<Expense />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="staff" element={<Staff />} />
          <Route path="finance" element={<Finance />} />
          <Route path="settings" element={<Settings />} />
          <Route path="userguide" element={<UserGuide />} />
        </Route>
        
        {/* ============ SUPER ADMIN ROUTES ============ */}
        <Route 
          path="/superadmin" 
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminLayout />
            </SuperAdminProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="shops" element={<Shops />} />
          <Route path="payments" element={<Payments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>
        
        {/* ============ CATCH ALL ============ */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
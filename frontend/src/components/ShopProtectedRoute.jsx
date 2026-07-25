// src/components/ShopProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ShopProtectedRoute = ({ children }) => {
  // Check if shop is authenticated
  const isShopAuthenticated = localStorage.getItem('shopToken') === 'authenticated';
  const userRole = localStorage.getItem('userRole');
  
  // If not authenticated as shop, redirect to shop login
  if (!isShopAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is super admin, redirect to super admin dashboard
  if (userRole === 'superadmin') {
    return <Navigate to="/superadmin/dashboard" replace />;
  }
  
  return children;
};

export default ShopProtectedRoute;
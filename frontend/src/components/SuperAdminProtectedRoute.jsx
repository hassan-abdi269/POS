// src/components/SuperAdminProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const SuperAdminProtectedRoute = ({ children }) => {
  const isSuperAdmin = localStorage.getItem('superAdminToken') !== null && 
                       localStorage.getItem('userRole') === 'superadmin';
  
  if (!isSuperAdmin) {
    return <Navigate to="/superadmin/login" replace />;
  }
  
  return children;
};

export default SuperAdminProtectedRoute;
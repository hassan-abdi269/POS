// src/components/SuperAdminProtectedRoute.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../service/api';

const SuperAdminProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);
  const hasChecked = useRef(false);
  const location = useLocation();

  useEffect(() => {
    // Prevent multiple checks
    if (hasChecked.current) return;
    
    const checkAuth = () => {
      try {
        // Get user from localStorage
        const user = authService.getCurrentUser();
        
        console.log('🔒 SuperAdminProtectedRoute check:', { 
          hasUser: !!user,
          user: user,
          isAdmin: user?.is_admin,
          path: location.pathname
        });

        // If no user, redirect to super admin login
        if (!user) {
          console.log('❌ No user found - redirecting to super admin login');
          setRedirectPath('/superadmin/login');
          setIsAuthorized(false);
          hasChecked.current = true;
          setLoading(false);
          return;
        }

        // Check if user is super admin
        if (user.is_admin === true) {
          console.log('✅ Super admin authorized');
          setIsAuthorized(true);
          hasChecked.current = true;
          setLoading(false);
          return;
        }

        // If user is shop admin, redirect to shop dashboard
        if (user.role === 'shop_admin' || user.shopId) {
          // If we're already on a shop path, don't redirect
          if (!location.pathname.startsWith('/superadmin')) {
            console.log('🔄 Shop admin - redirecting to shop dashboard');
            setRedirectPath('/dashboard');
            setIsAuthorized(false);
            hasChecked.current = true;
            setLoading(false);
            return;
          }
        }

        // Default redirect - user is not authorized
        console.log('❌ Not authorized - redirecting to super admin login');
        setRedirectPath('/superadmin/login');
        setIsAuthorized(false);
        hasChecked.current = true;
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Error checking super admin auth:', error);
        setRedirectPath('/superadmin/login');
        setIsAuthorized(false);
        hasChecked.current = true;
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]); // Re-run when path changes

  // Show loading spinner while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authorized
  if (!isAuthorized && redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render children if authorized
  return children;
};

export default SuperAdminProtectedRoute;
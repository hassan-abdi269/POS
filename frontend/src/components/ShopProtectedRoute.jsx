// src/components/ShopProtectedRoute.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../service/api';

const ShopProtectedRoute = ({ children }) => {
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
        // Get user from localStorage using authService
        const user = authService.getCurrentUser();
        
        console.log('🔒 ShopProtectedRoute check:', { 
          hasUser: !!user,
          user: user,
          isAdmin: user?.is_admin,
          path: location.pathname
        });

        // If no user, redirect to login
        if (!user) {
          console.log('❌ No user found - redirecting to login');
          setRedirectPath('/login');
          setIsAuthorized(false);
          hasChecked.current = true;
          setLoading(false);
          return;
        }

        // If user is super admin, redirect to super admin dashboard
        if (user.is_admin === true) {
          console.log('🔄 Super admin - redirecting to super admin dashboard');
          setRedirectPath('/superadmin/dashboard');
          setIsAuthorized(false);
          hasChecked.current = true;
          setLoading(false);
          return;
        }

        // ✅ Shop admin authorized
        console.log('✅ Shop admin authorized');
        setIsAuthorized(true);
        hasChecked.current = true;
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Error checking shop auth:', error);
        setRedirectPath('/login');
        setIsAuthorized(false);
        hasChecked.current = true;
        setLoading(false);
      }
    };

    // Small delay to ensure localStorage is ready
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
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

export default ShopProtectedRoute;
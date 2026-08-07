// src/pages/SuperAdmin/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Lock, Mail, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authService } from '../../service/api';

const SuperAdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  // Check authentication on mount
  useEffect(() => {
    if (hasRedirected.current) {
      setIsCheckingAuth(false);
      return;
    }
    
    const checkAuth = async () => {
      try {
        console.log('🔍 Starting auth check...');
        
        const user = authService.getCurrentUser();
        console.log('👤 User from localStorage:', user);
        
        if (user && user.is_admin === true) {
          console.log('✅ Found super admin in localStorage');
          
          try {
            console.log('🔍 Verifying session with backend...');
            const session = await authService.checkSession();
            console.log('📥 Session check result:', session);
            
            if (session && session.authenticated) {
              console.log('✅ Session verified, redirecting to dashboard');
              hasRedirected.current = true;
              navigate('/superadmin/dashboard');
              return;
            } else {
              console.log('⚠️ Session invalid, clearing user data');
              localStorage.removeItem('user');
            }
          } catch (sessionError) {
            console.error('❌ Session verification failed:', sessionError);
            console.log('⚠️ Session verification failed, attempting redirect anyway...');
            hasRedirected.current = true;
            navigate('/superadmin/dashboard');
            return;
          }
        }
        
        console.log('ℹ️ No authenticated user found');
        setIsCheckingAuth(false);
        
      } catch (error) {
        console.error('❌ Auth check error:', error);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Handle login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!credentials.email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }
    if (!credentials.password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Sending login request...');
      console.log('📧 Email:', credentials.email);
      console.log('🔑 Password:', '********');
      
      const response = await authService.login({
        email: credentials.email,
        password: credentials.password
      });

      console.log('📥 Login response:', response);

      if (response.success && response.user) {
        if (response.user.is_admin === true) {
          console.log('✅ Super admin login successful!');
          setSuccess('Login successful! Redirecting to dashboard...');
          
          // Wait for session cookie to be set
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify session was created
          try {
            console.log('🔍 Verifying session after login...');
            const session = await authService.checkSession();
            console.log('🔍 Session after login:', session);
            
            if (session && session.authenticated) {
              console.log('✅ Session verified, redirecting...');
              hasRedirected.current = true;
              navigate('/superadmin/dashboard');
            } else {
              console.error('❌ Session verification failed - session not authenticated');
              setError('Login successful but session not established. Please try again.');
              localStorage.removeItem('user');
              setLoading(false);
            }
          } catch (sessionError) {
            console.error('❌ Session verification error:', sessionError);
            console.log('⚠️ Session check failed, attempting redirect anyway...');
            hasRedirected.current = true;
            navigate('/superadmin/dashboard');
          }
        } else {
          setError('Access denied. Super admin privileges required.');
          localStorage.removeItem('user');
          setLoading(false);
        }
      } else {
        setError(response.error || 'Invalid email or password');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      if (err.message && err.message.includes('Network error')) {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else if (err.message && (err.message.includes('401') || err.message.includes('Invalid credentials'))) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Network error. Please check if the server is running.');
      }
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Checking authentication...</p>
          <p className="text-sm text-gray-400 mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-fadeIn">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
              <Store className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Super Admin Portal</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage all shops and accounts</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 animate-slideDown">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 animate-shake">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-all duration-200"
                placeholder="Enter your email address"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-all duration-200"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                disabled={loading}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </div>
            ) : (
              'Login as Super Admin'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Tirsi POS. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
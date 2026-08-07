// src/pages/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  Building2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { authService } from '../service/api';

const ShopLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Use refs to prevent multiple redirects and effect runs
  const hasRedirected = useRef(false);
  const isMounted = useRef(true);

  // Check if already logged in - runs when path changes
  useEffect(() => {
    // Prevent multiple executions
    if (hasRedirected.current) return;
    
    const checkAuth = async () => {
      try {
        // Only check if we haven't redirected yet
        if (hasRedirected.current) return;
        
        const user = authService.getCurrentUser();
        const role = authService.getUserRole();
        
        console.log('🔍 Checking auth - User:', user, 'Role:', role, 'Path:', location.pathname);
        
        if (user && role === 'shop_admin') {
          // Only redirect if not already on a shop route
          if (!location.pathname.startsWith('/dashboard')) {
            hasRedirected.current = true;
            console.log('✅ Redirecting to shop dashboard');
            navigate('/dashboard', { replace: true });
          }
          return;
        }
        
        if (user && role === 'super_admin') {
          // Only redirect if not already on a super admin route
          if (!location.pathname.startsWith('/superadmin')) {
            hasRedirected.current = true;
            console.log('✅ Redirecting to super admin dashboard');
            navigate('/superadmin/dashboard', { replace: true });
          }
          return;
        }
        
        console.log('ℹ️ No authenticated user found');
      } catch (error) {
        console.error('❌ Auth check error:', error);
      }
    };
    
    // Run check
    checkAuth();
    
    // Cleanup
    return () => {
      isMounted.current = false;
    };
  }, [location.pathname]); // Re-run when path changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading || hasRedirected.current) return;
    
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📤 Attempting shop login...');
      const data = await authService.shopLogin({ email, password });
      
      console.log('📥 Login response:', data);
      
      if (data.success && data.shop) {
        setSuccess('Login successful! Redirecting...');
        
        // Set redirect flag to prevent loop
        hasRedirected.current = true;
        
        // Navigate after a short delay
        setTimeout(() => {
          console.log('🚀 Navigating to dashboard');
          navigate('/dashboard', { replace: true });
        }, 800);
      } else {
        setError(data.error || 'Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Network error. Please check if the server is running.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
              <Building2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">POS System</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 text-green-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors"
                  placeholder="Enter your email"
                  disabled={isLoading || hasRedirected.current}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading || hasRedirected.current}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading || hasRedirected.current}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || hasRedirected.current}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                isLoading || hasRedirected.current ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : hasRedirected.current ? (
                <span>Redirecting...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>Sign in to Dashboard</span>
                </div>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Tirsi POS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopLogin;
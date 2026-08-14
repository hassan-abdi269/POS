// src/components/SuperAdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown
} from 'lucide-react';
import { authService } from '../service/api';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('user');
      navigate('/superadmin/login');
    }
  };

  const navItems = [
    { path: '/superadmin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/superadmin/shops', icon: Store, label: 'All Shops' },
    { path: '/superadmin/payments', icon: CreditCard, label: 'Payments' },
    { path: '/superadmin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/superadmin/settings', icon: Settings, label: 'Settings' },
  ];

  const user = authService.getCurrentUser();
  console.log('👤 SuperAdminLayout user:', user);
  
  const userEmail = user?.email || 'Super Admin';
  const userName = user?.username || userEmail.split('@')[0] || 'Admin';
  const userInitial = userName.charAt(0).toUpperCase();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 h-full
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isMobile && !sidebarOpen ? 'w-0' : isMobile ? 'w-64' : sidebarOpen ? 'w-64' : 'w-20'}
        bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className={`p-3 sm:p-4 border-b border-gray-800 flex items-center ${!sidebarOpen && !isMobile ? 'justify-center' : 'justify-between'}`}>
          <div className={`flex items-center gap-2 ${!sidebarOpen && !isMobile ? 'justify-center w-full' : ''}`}>
            <Store className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
            {sidebarOpen && <span className="font-bold text-base sm:text-lg">SuperAdmin</span>}
          </div>
          <button
            onClick={toggleSidebar}
            className={`text-gray-400 hover:text-white transition-colors ${!sidebarOpen && !isMobile ? 'hidden' : ''}`}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {!sidebarOpen && !isMobile && (
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {sidebarOpen && (
            <div className="mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main Menu
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`
                }
              >
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${!sidebarOpen && !isMobile ? 'mx-auto' : ''}`} />
                {sidebarOpen && <span className="text-sm sm:text-base">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className={`p-3 sm:p-4 border-t border-gray-800 ${!sidebarOpen && !isMobile ? 'flex justify-center' : ''}`}>
          {/* User Info - Collapsed */}
          {!sidebarOpen && !isMobile && (
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {userInitial}
              </div>
            </button>
          )}

          {/* User Info - Expanded */}
          {sidebarOpen && (
            <div className="mb-2 sm:mb-3 px-2 sm:px-3 py-2 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              {/* Profile Dropdown */}
              {isProfileOpen && sidebarOpen && (
                <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/superadmin/settings');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-700 rounded transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-900/20 rounded transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors ${
              !sidebarOpen && !isMobile ? 'justify-center w-auto' : 'w-full'
            }`}
          >
            <LogOut className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${!sidebarOpen && !isMobile ? '' : ''}`} />
            {sidebarOpen && <span className="text-sm sm:text-base">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <header className="bg-white shadow-sm px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleSidebar}
              className="md:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-base sm:text-xl font-semibold text-gray-800 truncate">
              Shop Management
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <button className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] sm:text-xs rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center">
                3
              </span>
            </button>
            
            {/* User Profile - Mobile */}
            <div className="flex items-center gap-1 sm:gap-2 md:hidden">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                {userInitial}
              </div>
              <span className="text-xs font-medium text-gray-700 truncate max-w-[60px]">
                {userName}
              </span>
            </div>

            {/* User Profile - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {userInitial}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {userName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
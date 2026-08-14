// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Wallet,
  Settings, 
  LogOut,
  Store,
  Menu,
  X,
  Bell,
  Truck,
  UserCog,
  Building2,
  BookOpen,
  Home,
  ChevronDown,
  Search
} from 'lucide-react';
import { authService } from '../service/api';

const Layout = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const user = authService.getCurrentUser();
    
    console.log('🔍 Layout check - User:', user);
    
    if (!user) {
      console.log('❌ No user found in Layout - redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
    
    if (user.is_admin === true) {
      console.log('🔄 Super admin in shop layout - redirecting');
      navigate('/superadmin/dashboard', { replace: true });
      return;
    }
    
    setShop({
      ...user,
      name: user.name || user.shopName || 'Shop',
      owner: user.owner || user.username || 'Shop Owner'
    });
    setIsLoading(false);
    
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/sales', icon: ShoppingCart, label: 'Sales' },
    { path: '/expense', icon: Wallet, label: 'Expenses' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers' },
    { path: '/staff', icon: UserCog, label: 'Staff' },
    { path: '/finance', icon: Building2, label: 'Finance' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/userguide', icon: BookOpen, label: 'User Guide' },
  ];

  const getShopInitials = () => {
    const name = shop?.name || 'Shop';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return null;
  }

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
        bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col shadow-sm
        ${!sidebarOpen && !isMobile ? 'items-center' : ''}
      `}>
        {/* Logo & Shop Name */}
        <div className={`p-4 border-b border-gray-200 flex items-center ${!sidebarOpen && !isMobile ? 'justify-center' : 'justify-between'} w-full`}>
          <div className={`flex items-center gap-2 overflow-hidden ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}>
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-1.5 rounded-lg flex-shrink-0">
              <Store className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <span className="font-bold text-gray-900 block truncate text-sm md:text-base">{shop.name}</span>
                <p className="text-xs text-gray-500 truncate hidden sm:block">POS System</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {!sidebarOpen && !isMobile && (
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto w-full">
          {sidebarOpen && (
            <div className="mb-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    {sidebarOpen && <span className="truncate text-sm font-medium">{item.label}</span>}
                    {isActive && sidebarOpen && (
                      <span className="ml-auto w-1.5 h-6 bg-purple-600 rounded-full"></span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className={`p-4 border-t border-gray-200 bg-gray-50/30 w-full ${!sidebarOpen && !isMobile ? 'flex justify-center' : ''}`}>
          <div className="relative w-full">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-white transition-all duration-200 ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
                {getShopInitials()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">{shop.name}</p>
                  <p className="text-xs text-gray-500 truncate">{shop.owner || 'Shop Owner'}</p>
                </div>
              )}
              {sidebarOpen && (
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                  isProfileOpen ? 'rotate-180' : ''
                }`} />
              )}
            </button>
            
            {/* Profile Dropdown */}
            {isProfileOpen && sidebarOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span>Shop Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/userguide');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span>Help & Support</span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-semibold text-gray-800 truncate">
                {shop.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate hidden xs:block">
                Welcome back, {shop.owner || 'Shop Owner'}! 👋
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <div className="relative flex-1 sm:flex-none max-w-[120px] sm:max-w-[200px]">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            </div>
            <button className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full text-white text-[8px] sm:text-[10px] flex items-center justify-center font-bold border-2 border-white">
                3
              </span>
            </button>
            <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-gray-200">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm">
                {getShopInitials()}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden xs:block">
                {shop.owner || 'Shop Owner'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
// src/pages/Settings.jsx

import React, { useState, useEffect } from 'react';
import { 
  Save,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { settingsService, authService } from '../service/api';
import { api } from '../service/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false
  });

  const [generalSettings, setGeneralSettings] = useState({
    store_name: 'My POS Store',
    store_email: 'admin@mystore.com',
    store_phone: '+254 712 345 678',
    store_address: '123 Main Street',
    store_city: 'Nairobi',
    store_state: 'Nairobi',
    store_zip: '00100',
    store_country: 'Kenya',
    timezone: 'Africa/Nairobi',
    currency: 'KES'
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    accent_color: 'gray-900',
    font_size: 'medium'
  });

  const [regionalSettings, setRegionalSettings] = useState({
    currency: 'KES',
    date_format: 'DD/MM/YYYY',
    time_format: '12h',
    language: 'en'
  });

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: false,
    sessionTimeout: '30'
  });

  // Get current shop ID
  const getShopId = () => {
    const user = authService.getCurrentUser();
    return user?.shopId;
  };

  // Fetch settings on load
  useEffect(() => {
    fetchAllSettings();
  }, []);

  // Fetch all settings
  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      // Fetch all settings in parallel
      await Promise.all([
        fetchGeneralSettings(shopId),
        fetchNotificationPreferences(shopId),
        fetchSecuritySettings(shopId)
      ]);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch general settings
  const fetchGeneralSettings = async (shopId) => {
    try {
      const data = await settingsService.getSettings(shopId);
      
      if (Array.isArray(data)) {
        const settingsMap = {};
        data.forEach(item => {
          settingsMap[item.key] = item.value;
        });
        
        setGeneralSettings(prev => ({
          ...prev,
          store_name: settingsMap.store_name || prev.store_name,
          store_email: settingsMap.store_email || prev.store_email,
          store_phone: settingsMap.store_phone || prev.store_phone,
          store_address: settingsMap.store_address || prev.store_address,
          store_city: settingsMap.store_city || prev.store_city,
          store_state: settingsMap.store_state || prev.store_state,
          store_zip: settingsMap.store_zip || prev.store_zip,
          store_country: settingsMap.store_country || prev.store_country,
          timezone: settingsMap.timezone || prev.timezone,
          currency: settingsMap.currency || prev.currency
        }));
      }
    } catch (error) {
      console.error('Error fetching general settings:', error);
    }
  };

  // Fetch notification preferences
  const fetchNotificationPreferences = async (shopId) => {
    try {
      const response = await api.get('/notifications/preferences', {
        params: { shop_id: shopId }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const prefs = {};
        response.data.forEach(item => {
          prefs[item.type] = item.enabled;
        });
        setNotifications(prev => ({
          ...prev,
          ...prefs
        }));
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  // Fetch security settings
  const fetchSecuritySettings = async (shopId) => {
    try {
      const response = await api.get('/security/settings', {
        params: { shop_id: shopId }
      });
      
      if (response.data) {
        setSecuritySettings(prev => ({
          ...prev,
          twoFactorAuth: response.data.two_factor_auth || false,
          sessionTimeout: String(response.data.session_timeout || '30')
        }));
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    }
  };

  // Save general settings
  const saveGeneralSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      // Convert settings to array format for batch update
      const settingsArray = Object.entries(generalSettings).map(([key, value]) => ({
        key,
        value: String(value),
        category: 'general'
      }));

      await api.post('/settings/batch', {
        settings: settingsArray,
        shop_id: shopId
      });
      
      setSuccess('General settings saved successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.response?.data?.error || 'Failed to save settings');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Save appearance settings
  const saveAppearanceSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      const settingsArray = Object.entries(appearanceSettings).map(([key, value]) => ({
        key,
        value: String(value),
        category: 'appearance'
      }));

      await api.post('/settings/batch', {
        settings: settingsArray,
        shop_id: shopId
      });
      
      setSuccess('Appearance settings saved successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      setError(error.response?.data?.error || 'Failed to save settings');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Save regional settings
  const saveRegionalSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      const settingsArray = Object.entries(regionalSettings).map(([key, value]) => ({
        key,
        value: String(value),
        category: 'regional'
      }));

      await api.post('/settings/batch', {
        settings: settingsArray,
        shop_id: shopId
      });
      
      setSuccess('Regional settings saved successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error saving regional settings:', error);
      setError(error.response?.data?.error || 'Failed to save settings');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Save notification preferences
  const saveNotificationPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      const preferences = Object.entries(notifications).map(([type, enabled]) => ({
        type,
        enabled
      }));

      await api.post('/notifications/preferences', {
        preferences,
        shop_id: shopId
      });
      
      setSuccess('Notification preferences saved successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError(error.response?.data?.error || 'Failed to save preferences');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Save security settings
  const saveSecuritySettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      await api.post('/security/settings', {
        two_factor_auth: securitySettings.twoFactorAuth,
        session_timeout: parseInt(securitySettings.sessionTimeout),
        shop_id: shopId
      });
      
      setSuccess('Security settings saved successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error saving security settings:', error);
      setError(error.response?.data?.error || 'Failed to save security settings');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (securitySettings.newPassword !== securitySettings.confirmPassword) {
        setError('New passwords do not match');
        setTimeout(() => setError(''), 5000);
        return;
      }
      
      if (securitySettings.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        setTimeout(() => setError(''), 5000);
        return;
      }
      
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      await api.post('/security/change-password', {
        current_password: securitySettings.currentPassword,
        new_password: securitySettings.newPassword,
        shop_id: shopId
      });
      
      setSuccess('Password changed successfully!');
      setSecuritySettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.response?.data?.error || 'Failed to change password');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAppearanceChange = (e) => {
    const { name, value } = e.target;
    setAppearanceSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegionalChange = (e) => {
    const { name, value } = e.target;
    setRegionalSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    if (activeTab === 'general') {
      saveGeneralSettings();
    } else if (activeTab === 'notifications') {
      saveNotificationPreferences();
    } else if (activeTab === 'security') {
      if (securitySettings.currentPassword || securitySettings.newPassword) {
        changePassword();
      } else {
        saveSecuritySettings();
      }
    } else if (activeTab === 'appearance') {
      saveAppearanceSettings();
    } else if (activeTab === 'regional') {
      saveRegionalSettings();
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'regional', label: 'Regional', icon: Globe },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your application preferences</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-2 sticky top-4 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                  <span>{tab.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h3>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
                    <input
                      type="text"
                      name="store_name"
                      value={generalSettings.store_name}
                      onChange={handleGeneralChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="store_email"
                        value={generalSettings.store_email}
                        onChange={handleGeneralChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="store_phone"
                        value={generalSettings.store_phone}
                        onChange={handleGeneralChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Logo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Upload Logo
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="store_address"
                      value={generalSettings.store_address}
                      onChange={handleGeneralChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input
                      type="text"
                      name="store_city"
                      value={generalSettings.store_city}
                      onChange={handleGeneralChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State/Province</label>
                    <input
                      type="text"
                      name="store_state"
                      value={generalSettings.store_state}
                      onChange={handleGeneralChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Zip/Postal Code</label>
                    <input
                      type="text"
                      name="store_zip"
                      value={generalSettings.store_zip}
                      onChange={handleGeneralChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                    <select
                      name="store_country"
                      value={generalSettings.store_country}
                      onChange={handleGeneralChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Nigeria">Nigeria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Zone</label>
                    <select
                      name="timezone"
                      value={generalSettings.timezone}
                      onChange={handleGeneralChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates and alerts via email</p>
                  </div>
                  <button onClick={() => toggleNotification('email')} className="text-2xl">
                    {notifications.email ? (
                      <ToggleRight className="w-8 h-8 text-gray-900" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">Real-time notifications on your device</p>
                  </div>
                  <button onClick={() => toggleNotification('push')} className="text-2xl">
                    {notifications.push ? (
                      <ToggleRight className="w-8 h-8 text-gray-900" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Text message alerts for important events</p>
                  </div>
                  <button onClick={() => toggleNotification('sms')} className="text-2xl">
                    {notifications.sms ? (
                      <ToggleRight className="w-8 h-8 text-gray-900" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Marketing Communications</p>
                    <p className="text-sm text-gray-500">Promotional offers and updates</p>
                  </div>
                  <button onClick={() => toggleNotification('marketing')} className="text-2xl">
                    {notifications.marketing ? (
                      <ToggleRight className="w-8 h-8 text-gray-900" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={securitySettings.currentPassword}
                      onChange={handleSecurityChange}
                      placeholder="Enter current password"
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={securitySettings.newPassword}
                      onChange={handleSecurityChange}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={securitySettings.confirmPassword}
                      onChange={handleSecurityChange}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                </button>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <button
                      onClick={() => setSecuritySettings(prev => ({
                        ...prev,
                        twoFactorAuth: !prev.twoFactorAuth
                      }))}
                      className="text-2xl"
                    >
                      {securitySettings.twoFactorAuth ? (
                        <ToggleRight className="w-8 h-8 text-gray-900" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Timeout (minutes)</label>
                  <select
                    name="sessionTimeout"
                    value={securitySettings.sessionTimeout}
                    onChange={handleSecurityChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Appearance Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: 'light' }))}
                      className={`p-4 border-2 rounded-lg bg-white transition-all ${
                        appearanceSettings.theme === 'light' 
                          ? 'border-gray-900 ring-2 ring-gray-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-full h-16 bg-white border rounded mb-2 ${
                          appearanceSettings.theme === 'light' 
                            ? 'border-gray-900' 
                            : 'border-gray-200'
                        }`}></div>
                        <p className={`text-sm font-medium ${
                          appearanceSettings.theme === 'light' 
                            ? 'text-gray-900' 
                            : 'text-gray-600'
                        }`}>Light</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: 'dark' }))}
                      className={`p-4 border-2 rounded-lg bg-white transition-all ${
                        appearanceSettings.theme === 'dark' 
                          ? 'border-gray-900 ring-2 ring-gray-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-full h-16 bg-gray-900 border rounded mb-2 ${
                          appearanceSettings.theme === 'dark' 
                            ? 'border-gray-900' 
                            : 'border-gray-700'
                        }`}></div>
                        <p className={`text-sm font-medium ${
                          appearanceSettings.theme === 'dark' 
                            ? 'text-gray-900' 
                            : 'text-gray-600'
                        }`}>Dark</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: 'system' }))}
                      className={`p-4 border-2 rounded-lg bg-white transition-all ${
                        appearanceSettings.theme === 'system' 
                          ? 'border-gray-900 ring-2 ring-gray-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-full h-16 bg-gradient-to-r from-white to-gray-900 border border-gray-200 rounded mb-2"></div>
                        <p className={`text-sm font-medium ${
                          appearanceSettings.theme === 'system' 
                            ? 'text-gray-900' 
                            : 'text-gray-600'
                        }`}>System</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, accent_color: 'gray-900' }))}
                      className={`w-10 h-10 rounded-full bg-gray-900 border-2 ${
                        appearanceSettings.accent_color === 'gray-900' 
                          ? 'border-gray-900 ring-2 ring-gray-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    ></button>
                    <button
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, accent_color: 'blue-600' }))}
                      className={`w-10 h-10 rounded-full bg-blue-600 border-2 ${
                        appearanceSettings.accent_color === 'blue-600' 
                          ? 'border-blue-600 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    ></button>
                    <button
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, accent_color: 'purple-600' }))}
                      className={`w-10 h-10 rounded-full bg-purple-600 border-2 ${
                        appearanceSettings.accent_color === 'purple-600' 
                          ? 'border-purple-600 ring-2 ring-purple-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    ></button>
                    <button
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, accent_color: 'green-600' }))}
                      className={`w-10 h-10 rounded-full bg-green-600 border-2 ${
                        appearanceSettings.accent_color === 'green-600' 
                          ? 'border-green-600 ring-2 ring-green-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    ></button>
                    <button
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, accent_color: 'red-600' }))}
                      className={`w-10 h-10 rounded-full bg-red-600 border-2 ${
                        appearanceSettings.accent_color === 'red-600' 
                          ? 'border-red-600 ring-2 ring-red-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    ></button>
                    <button
                      onClick={() => setAppearanceSettings(prev => ({ ...prev, accent_color: 'orange-600' }))}
                      className={`w-10 h-10 rounded-full bg-orange-600 border-2 ${
                        appearanceSettings.accent_color === 'orange-600' 
                          ? 'border-orange-600 ring-2 ring-orange-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    ></button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Size</label>
                  <select
                    name="font_size"
                    value={appearanceSettings.font_size}
                    onChange={handleAppearanceChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="xlarge">Extra Large</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Regional Settings */}
          {activeTab === 'regional' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Regional Settings</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="currency"
                      value={regionalSettings.currency}
                      onChange={handleRegionalChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                      <option value="CAD">CAD - Canadian Dollar (C$)</option>
                      <option value="AUD">AUD - Australian Dollar (A$)</option>
                      <option value="JPY">JPY - Japanese Yen (¥)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Format</label>
                  <select
                    name="date_format"
                    value={regionalSettings.date_format}
                    onChange={handleRegionalChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Format</label>
                  <select
                    name="time_format"
                    value={regionalSettings.time_format}
                    onChange={handleRegionalChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="language"
                      value={regionalSettings.language}
                      onChange={handleRegionalChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <p>Changes to regional settings will affect how data is displayed across the system.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
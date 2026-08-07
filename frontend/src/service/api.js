// service/api.js

import axios from 'axios';

// ✅ Use localhost for better browser cookie handling
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  // ✅ IMPORTANT: Enable credentials for session cookies
  withCredentials: true,
});

// ✅ Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('🔑 [API] Request:', config.method.toUpperCase(), config.url);
    console.log('🍪 Cookies being sent:', document.cookie);
    
    // Add shop ID header if available
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.shopId) {
          config.headers['X-Shop-ID'] = userData.shopId;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ [API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ [API] Response:', response.status, response.config.url);
    console.log('🍪 Cookies after response:', document.cookie);
    return response;
  },
  (error) => {
    console.error('❌ [API] Response error:', error.response?.status, error.response?.config?.url);
    
    if (!error.response) {
      console.error('Network error - please check your connection');
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Handle 401 - session expired
    if (error.response?.status === 401) {
      console.error('🔒 Session expired - Redirecting to login');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/superadmin/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleError = (error) => {
  if (error.message === 'Network error. Please check your connection.') {
    throw new Error('Network error. Please check if the server is running.');
  }
  
  if (error.response?.data?.error) {
    throw new Error(error.response.data.error);
  }
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  if (error.message) {
    throw error;
  }
  throw new Error('An unexpected error occurred');
};

// ============ AUTHENTICATION SERVICES ============
export const authService = {
  // Super Admin Login
  login: async (credentials) => {
    try {
      console.log('📤 Sending login request to:', `${API_BASE_URL}/auth/login`);
      const response = await api.post('/auth/login', credentials);
      
      console.log('📥 Full login response:', response.data);
      console.log('📥 Response status:', response.status);
      console.log('🍪 Cookies after login:', document.cookie);
      
      if (response.data && response.data.authenticated) {
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          console.log('✅ User data stored:', response.data.user);
        }
        
        return {
          success: true,
          user: response.data.user,
          authenticated: response.data.authenticated,
          ...response.data
        };
      } else {
        const errorMsg = response.data?.error || response.data?.message || 'Login failed';
        console.error('❌ Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  // ✅ Shop Login
  shopLogin: async (credentials) => {
    try {
      console.log('📤 Sending shop login request to:', `${API_BASE_URL}/shop/login`);
      const response = await api.post('/shop/login', credentials);
      
      console.log('📥 Full login response:', response.data);
      console.log('📥 Response status:', response.status);
      console.log('🍪 Cookies after login:', document.cookie);
      
      if (response.data && response.data.success) {
        if (response.data.shop) {
          const shopData = {
            ...response.data.shop,
            role: 'shop_admin',
            shopId: response.data.shop.id
          };
          localStorage.setItem('user', JSON.stringify(shopData));
          console.log('✅ Shop data stored:', shopData);
        }
        
        return {
          success: true,
          shop: response.data.shop,
          ...response.data
        };
      } else {
        const errorMsg = response.data?.error || response.data?.message || 'Login failed';
        console.error('❌ Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  checkSession: async () => {
    try {
      console.log('🔍 Checking session...');
      console.log('🍪 Sending cookies:', document.cookie);
      const response = await api.get('/auth/session-check');
      console.log('📥 Session check response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Session check error:', error);
      if (error.response?.status === 401) {
        return { authenticated: false };
      }
      throw error;
    }
  },

  getSessionStatus: async () => {
    try {
      console.log('🔍 Getting session status...');
      const response = await api.get('/auth/session-status');
      console.log('📥 Session status:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Session status error:', error);
      return null;
    }
  },

  logout: async () => {
    console.log('🚪 Logging out...');
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        console.log('✅ User loaded from storage:', parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('❌ Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('user');
  },

  getUserRole: () => {
    const user = authService.getCurrentUser();
    if (!user) return null;
    
    if (user.is_admin === true) {
      return 'super_admin';
    }
    
    return user?.role || 'shop_admin';
  },

  isSuperAdmin: () => {
    const user = authService.getCurrentUser();
    return user?.is_admin === true;
  },

  isShopAdmin: () => {
    const user = authService.getCurrentUser();
    return user && !user.is_admin;
  },

  getCurrentShopId: () => {
    const user = authService.getCurrentUser();
    return user?.shopId || null;
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      if (response.data.user) {
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  resetPassword: async (resetData) => {
    try {
      const response = await api.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ SHOP SERVICES ============
export const shopService = {
  getAllShops: async () => {
    try {
      console.log('📡 Fetching all shops...');
      const response = await api.get('/shops');
      console.log('✅ Shops fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching shops:', error);
      return handleError(error);
    }
  },

  getShop: async (shopId) => {
    try {
      const response = await api.get(`/shops/${shopId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createShop: async (shopData) => {
    try {
      console.log('📤 Creating shop:', shopData);
      const response = await api.post('/shops', shopData);
      console.log('✅ Shop created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating shop:', error);
      return handleError(error);
    }
  },

  updateShop: async (shopId, shopData) => {
    try {
      const response = await api.put(`/shops/${shopId}`, shopData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteShop: async (shopId) => {
    try {
      const response = await api.delete(`/shops/${shopId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getShopSettings: async (shopId) => {
    try {
      const response = await api.get(`/shops/${shopId}/settings`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateShopSettings: async (shopId, settings) => {
    try {
      const response = await api.put(`/shops/${shopId}/settings`, settings);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getShopStats: async (shopId) => {
    try {
      const response = await api.get(`/shops/${shopId}/stats`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ ANALYTICS SERVICES ============
export const analyticsService = {
  getDashboardAnalytics: async (shopId) => {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getSalesAnalytics: async (shopId, params = {}) => {
    try {
      const response = await api.get('/analytics/sales', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getProductAnalytics: async (shopId, params = {}) => {
    try {
      const response = await api.get('/analytics/products', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCustomerAnalytics: async (shopId, params = {}) => {
    try {
      const response = await api.get('/analytics/customers', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getStaffPerformance: async (shopId, params = {}) => {
    try {
      const response = await api.get('/analytics/staff', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getInventoryAnalytics: async (shopId, params = {}) => {
    try {
      const response = await api.get('/analytics/inventory', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ FINANCE SERVICES ============
export const financeService = {
  getFinancialOverview: async (shopId, params = {}) => {
    try {
      const response = await api.get('/finance/overview', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getProfitLoss: async (shopId, params = {}) => {
    try {
      const response = await api.get('/finance/profit-loss', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getRevenueReport: async (shopId, params = {}) => {
    try {
      const response = await api.get('/finance/revenue', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getExpenseReport: async (shopId, params = {}) => {
    try {
      const response = await api.get('/finance/expenses', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getTaxReport: async (shopId, params = {}) => {
    try {
      const response = await api.get('/finance/tax', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCashFlow: async (shopId, params = {}) => {
    try {
      const response = await api.get('/finance/cash-flow', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ SUPER ADMIN SERVICES ============
export const superAdminService = {
  getAllShopsAnalytics: async () => {
    try {
      const response = await api.get('/super-admin/analytics/all-shops');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getGlobalAnalytics: async () => {
    try {
      const response = await api.get('/super-admin/analytics/global');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getAllPayments: async (params = {}) => {
    try {
      const response = await api.get('/super-admin/payments', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getPaymentDetails: async (paymentId) => {
    try {
      const response = await api.get(`/super-admin/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getSystemSettings: async () => {
    try {
      const response = await api.get('/super-admin/settings');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateSystemSettings: async (settings) => {
    try {
      const response = await api.put('/super-admin/settings', settings);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/super-admin/users', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const response = await api.patch(`/super-admin/users/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getSystemHealth: async () => {
    try {
      const response = await api.get('/super-admin/health');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ STAFF SERVICES ============
export const staffService = {
  getAllStaff: async (shopId, params = {}) => {
    try {
      const queryParams = {
        ...params,
        shop_id: shopId
      };
      console.log('📡 Fetching staff with params:', queryParams);
      const response = await api.get('/staff', { params: queryParams });
      console.log('✅ Staff fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching staff:', error);
      return handleError(error);
    }
  },

  getStaff: async (shopId, staffId) => {
    try {
      const response = await api.get(`/staff/${staffId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createStaff: async (shopId, staffData) => {
    try {
      const data = {
        ...staffData,
        shop_id: shopId
      };
      console.log('📤 Creating staff with data:', data);
      const response = await api.post('/staff', data);
      console.log('✅ Staff created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating staff:', error);
      return handleError(error);
    }
  },

  updateStaff: async (shopId, staffId, staffData) => {
    try {
      const data = {
        ...staffData,
        shop_id: shopId
      };
      console.log(`📤 Updating staff ${staffId}:`, data);
      const response = await api.put(`/staff/${staffId}`, data);
      console.log('✅ Staff updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating staff:', error);
      return handleError(error);
    }
  },

  deleteStaff: async (shopId, staffId) => {
    try {
      console.log(`🗑️ Deleting staff ${staffId}`);
      const response = await api.delete(`/staff/${staffId}`, {
        params: { shop_id: shopId }
      });
      console.log('✅ Staff deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting staff:', error);
      return handleError(error);
    }
  },

  changeStaffRole: async (shopId, staffId, role) => {
    try {
      const response = await api.patch(`/staff/${staffId}/role`, 
        { role, shop_id: shopId }
      );
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getStaffStats: async (shopId) => {
    try {
      const response = await api.get('/staff/stats', {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ INVENTORY SERVICES ============
export const inventoryService = {
  getAllProducts: async (shopId, params = {}) => {
    try {
      console.log('📦 Fetching products...');
      const queryParams = {
        ...params,
        shop_id: shopId
      };
      const response = await api.get('/products', { params: queryParams });
      console.log('✅ Products fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      return handleError(error);
    }
  },

  getProduct: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createProduct: async (productData) => {
    try {
      console.log('📤 Creating product:', productData);
      const response = await api.post('/products', productData);
      console.log('✅ Product created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      return handleError(error);
    }
  },

  updateProduct: async (productId, productData) => {
    try {
      console.log(`📤 Updating product ${productId}:`, productData);
      const response = await api.put(`/products/${productId}`, productData);
      console.log('✅ Product updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating product:', error);
      return handleError(error);
    }
  },

  deleteProduct: async (productId) => {
    try {
      console.log(`🗑️ Deleting product ${productId}`);
      const response = await api.delete(`/products/${productId}`);
      console.log('✅ Product deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      return handleError(error);
    }
  },

  updateStock: async (productId, quantity) => {
    try {
      console.log(`📊 Updating stock for product ${productId}: ${quantity}`);
      const response = await api.patch(`/products/${productId}/stock`, { quantity });
      console.log('✅ Stock updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      return handleError(error);
    }
  },

  getLowStock: async (shopId) => {
    try {
      const response = await api.get('/products', { 
        params: { status: 'Low Stock', shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCategories: async (shopId) => {
    try {
      return [];
    } catch (error) {
      return handleError(error);
    }
  },

  bulkImport: async (shopId, products) => {
    try {
      const response = await api.post('/products/bulk', { products, shop_id: shopId });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ SALES SERVICES ============
export const salesService = {
  getAllSales: async (shopId, params = {}) => {
    try {
      const queryParams = {
        ...params,
        shop_id: shopId
      };
      const response = await api.get('/sales', { params: queryParams });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getSale: async (shopId, saleId) => {
    try {
      const response = await api.get(`/sales/${saleId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createSale: async (shopId, saleData) => {
    try {
      const data = {
        ...saleData,
        shop_id: shopId
      };
      const response = await api.post('/sales', data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateSale: async (shopId, saleId, saleData) => {
    try {
      const data = {
        ...saleData,
        shop_id: shopId
      };
      const response = await api.put(`/sales/${saleId}`, data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteSale: async (shopId, saleId) => {
    try {
      const response = await api.delete(`/sales/${saleId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getSalesSummary: async (shopId, params = {}) => {
    try {
      const queryParams = {
        ...params,
        shop_id: shopId
      };
      const response = await api.get('/sales/summary', { params: queryParams });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getDailySales: async (shopId, date) => {
    try {
      const response = await api.get('/sales/daily', { 
        params: { date, shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getSalesByDateRange: async (shopId, startDate, endDate) => {
    try {
      const response = await api.get('/sales/range', {
        params: { startDate, endDate, shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  generateReceipt: async (shopId, saleId) => {
    try {
      const response = await api.get(`/sales/${saleId}/receipt`, {
        params: { shop_id: shopId },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ CUSTOMER SERVICES ============
export const customerService = {
  getAllCustomers: async (shopId, params = {}) => {
    try {
      const queryParams = {
        ...params,
        shop_id: shopId
      };
      const response = await api.get('/customers', { params: queryParams });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCustomer: async (shopId, customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createCustomer: async (shopId, customerData) => {
    try {
      const data = {
        ...customerData,
        shop_id: shopId
      };
      const response = await api.post('/customers', data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateCustomer: async (shopId, customerId, customerData) => {
    try {
      const data = {
        ...customerData,
        shop_id: shopId
      };
      const response = await api.put(`/customers/${customerId}`, data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteCustomer: async (shopId, customerId) => {
    try {
      const response = await api.delete(`/customers/${customerId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCustomerHistory: async (shopId, customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}/history`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCustomerStats: async (shopId) => {
    try {
      const response = await api.get('/customers/stats', {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ EXPENSE SERVICES ============
export const expenseService = {
  getAllExpenses: async (shopId, params = {}) => {
    try {
      const queryParams = {
        ...params,
        shop_id: shopId
      };
      const response = await api.get('/expenses', { params: queryParams });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getExpense: async (shopId, expenseId) => {
    try {
      const response = await api.get(`/expenses/${expenseId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createExpense: async (shopId, expenseData) => {
    try {
      const data = {
        ...expenseData,
        shop_id: shopId
      };
      const response = await api.post('/expenses', data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateExpense: async (shopId, expenseId, expenseData) => {
    try {
      const data = {
        ...expenseData,
        shop_id: shopId
      };
      const response = await api.put(`/expenses/${expenseId}`, data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteExpense: async (shopId, expenseId) => {
    try {
      const response = await api.delete(`/expenses/${expenseId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getExpenseCategories: async (shopId) => {
    try {
      const response = await api.get('/expenses/categories', {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getExpenseSummary: async (shopId, params = {}) => {
    try {
      const queryParams = {
        ...params,
        shop_id: shopId
      };
      const response = await api.get('/expenses/summary', { params: queryParams });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ SUPPLIER SERVICES ============
export const supplierService = {
  getAllSuppliers: async (shopId, params = {}) => {
    try {
      const queryParams = {
        ...params,
        shop_id: shopId
      };
      const response = await api.get('/suppliers', { params: queryParams });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getSupplier: async (shopId, supplierId) => {
    try {
      const response = await api.get(`/suppliers/${supplierId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createSupplier: async (shopId, supplierData) => {
    try {
      const data = {
        ...supplierData,
        shop_id: shopId
      };
      const response = await api.post('/suppliers', data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateSupplier: async (shopId, supplierId, supplierData) => {
    try {
      const data = {
        ...supplierData,
        shop_id: shopId
      };
      const response = await api.put(`/suppliers/${supplierId}`, data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteSupplier: async (shopId, supplierId) => {
    try {
      const response = await api.delete(`/suppliers/${supplierId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getSupplierStats: async (shopId) => {
    try {
      const response = await api.get('/suppliers/stats', {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ PAYMENT SERVICES ============
export const paymentService = {
  getAllPayments: async (params = {}) => {
    try {
      console.log('💰 Fetching payments with params:', params);
      const response = await api.get('/payments', { params });
      console.log('✅ Payments fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      return handleError(error);
    }
  },

  getPayment: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createPayment: async (paymentData) => {
    try {
      console.log('💰 Creating payment:', paymentData);
      const response = await api.post('/payments', paymentData);
      console.log('✅ Payment created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating payment:', error);
      return handleError(error);
    }
  },

  updatePayment: async (paymentId, paymentData) => {
    try {
      console.log(`💰 Updating payment ${paymentId}:`, paymentData);
      const response = await api.put(`/payments/${paymentId}`, paymentData);
      console.log('✅ Payment updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating payment:', error);
      return handleError(error);
    }
  },

  deletePayment: async (paymentId) => {
    try {
      console.log(`💰 Deleting payment ${paymentId}`);
      const response = await api.delete(`/payments/${paymentId}`);
      console.log('✅ Payment deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting payment:', error);
      return handleError(error);
    }
  },

  updatePaymentStatus: async (paymentId, status) => {
    try {
      console.log(`💰 Updating payment ${paymentId} status to ${status}`);
      const response = await api.patch(`/payments/${paymentId}/status`, { status });
      console.log('✅ Payment status updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      return handleError(error);
    }
  },

  getPaymentStats: async (params = {}) => {
    try {
      console.log('📊 Fetching payment stats with params:', params);
      const response = await api.get('/payments/stats', { params });
      console.log('✅ Payment stats fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching payment stats:', error);
      return handleError(error);
    }
  }
};

// ============ PURCHASE ORDER SERVICES ============
export const purchaseOrderService = {
  getAllPurchaseOrders: async (params = {}) => {
    try {
      console.log('📦 Fetching purchase orders with params:', params);
      const response = await api.get('/purchase-orders', { params });
      console.log('✅ Purchase orders fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching purchase orders:', error);
      return handleError(error);
    }
  },

  getPurchaseOrder: async (orderId) => {
    try {
      const response = await api.get(`/purchase-orders/${orderId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createPurchaseOrder: async (orderData) => {
    try {
      console.log('📤 Creating purchase order:', orderData);
      const response = await api.post('/purchase-orders', orderData);
      console.log('✅ Purchase order created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating purchase order:', error);
      return handleError(error);
    }
  },

  updatePurchaseOrderStatus: async (orderId, status) => {
    try {
      console.log(`📤 Updating order ${orderId} status to ${status}`);
      const response = await api.patch(`/purchase-orders/${orderId}/status`, { status });
      console.log('✅ Order status updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      return handleError(error);
    }
  },

  getOrderHistory: async (orderId) => {
    try {
      const response = await api.get(`/purchase-orders/${orderId}/history`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deletePurchaseOrder: async (orderId) => {
    try {
      const response = await api.delete(`/purchase-orders/${orderId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  exportOrderPDF: async (orderId) => {
    try {
      const response = await api.get(`/purchase-orders/${orderId}/export/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  exportOrderExcel: async (orderId) => {
    try {
      const response = await api.get(`/purchase-orders/${orderId}/export/excel`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getOrderStats: async () => {
    try {
      const response = await api.get('/purchase-orders/stats');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getStatusTransitions: async () => {
    try {
      const response = await api.get('/order-status-transitions');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  revertOrderStatus: async (orderId, targetStatus) => {
    try {
      const response = await api.post(`/purchase-orders/${orderId}/revert`, {
        target_status: targetStatus
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ SETTINGS SERVICES ============
export const settingsService = {
  getSettings: async (shopId) => {
    try {
      const response = await api.get('/settings', {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateSettings: async (shopId, settings) => {
    try {
      const response = await api.put('/settings', { ...settings, shop_id: shopId });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateTheme: async (shopId, theme) => {
    try {
      const response = await api.patch('/settings/theme', { theme, shop_id: shopId });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateCurrency: async (shopId, currency) => {
    try {
      const response = await api.patch('/settings/currency', { currency, shop_id: shopId });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getAllSettings: async (shopId) => {
    try {
      const response = await api.get('/settings/all', {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ USER GUIDE SERVICES ============
export const userGuideService = {
  getUserGuide: async (role) => {
    try {
      const response = await api.get('/userguide', { params: { role } });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getAllGuides: async () => {
    try {
      const response = await api.get('/userguide');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateUserGuide: async (role, content) => {
    try {
      const response = await api.put('/userguide', { content, role });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  searchGuide: async (query, role) => {
    try {
      const response = await api.get('/userguide/search', { params: { query, role } });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  submitFeedback: async (feedback) => {
    try {
      const response = await api.post('/userguide/feedback', feedback);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  chat: async (message, context) => {
    try {
      const response = await api.post('/userguide/chat', { message, context });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getQAPairs: async () => {
    try {
      const response = await api.get('/userguide/qa');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  addQAPair: async (qaData) => {
    try {
      const response = await api.post('/userguide/qa', qaData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateQAPair: async (qaId, qaData) => {
    try {
      const response = await api.put(`/userguide/qa/${qaId}`, qaData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteQAPair: async (qaId) => {
    try {
      const response = await api.delete(`/userguide/qa/${qaId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getArticles: async () => {
    try {
      const response = await api.get('/userguide/articles');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getArticle: async (articleId) => {
    try {
      const response = await api.get(`/userguide/articles/${articleId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/userguide/stats');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ UPLOAD SERVICES ============
export const uploadService = {
  uploadProductImage: async (shopId, productId, file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('shop_id', shopId);
      formData.append('product_id', productId);
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      return handleError(error);
    }
  },

  uploadShopLogo: async (shopId, file) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('shop_id', shopId);
      const response = await api.post('/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  uploadBulkProducts: async (shopId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('shop_id', shopId);
      const response = await api.post('/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  uploadMultipleImages: async (shopId, files, type = 'product') => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });
      formData.append('type', type);
      formData.append('shop_id', shopId);
      const response = await api.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ REPORT SERVICES ============
export const reportService = {
  generateSalesReport: async (shopId, params = {}) => {
    try {
      const response = await api.get('/sales/export/excel', { 
        params: { ...params, shop_id: shopId },
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  generateInventoryReport: async (shopId, params = {}) => {
    try {
      const response = await api.get('/inventory/export/excel', { 
        params: { ...params, shop_id: shopId },
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  generateFinancialReport: async (shopId, params = {}) => {
    try {
      const response = await api.get('/finance/export/excel', { 
        params: { ...params, shop_id: shopId },
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  generateExpenseReport: async (shopId, params = {}) => {
    try {
      const response = await api.get('/expenses/export/excel', { 
        params: { ...params, shop_id: shopId },
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  generateCustomerReport: async (shopId, params = {}) => {
    try {
      const response = await api.get('/customers/export/excel', { 
        params: { ...params, shop_id: shopId },
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ NOTIFICATION SERVICES ============
export const notificationService = {
  getNotifications: async (shopId, params = {}) => {
    try {
      const queryParams = {
        ...params,
        shop_id: shopId
      };
      const response = await api.get('/notifications', { params: queryParams });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  markAsRead: async (shopId, notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`, {
        shop_id: shopId
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  markAllAsRead: async (shopId) => {
    try {
      const response = await api.patch('/notifications/read-all', {
        shop_id: shopId
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteNotification: async (shopId, notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`, {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getUnreadCount: async (shopId) => {
    try {
      const response = await api.get('/notifications/unread-count', {
        params: { shop_id: shopId }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  sendNotification: async (shopId, notificationData) => {
    try {
      const data = {
        ...notificationData,
        shop_id: shopId
      };
      const response = await api.post('/notifications', data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============ EXPORT THE API INSTANCE ============
export { api };

// ============ EXPORT ALL SERVICES AS DEFAULT ============
export default {
  auth: authService,
  shops: shopService,
  staff: staffService,
  inventory: inventoryService,
  sales: salesService,
  customers: customerService,
  expenses: expenseService,
  suppliers: supplierService,
  analytics: analyticsService,
  finance: financeService,
  superAdmin: superAdminService,
  payments: paymentService,
  purchaseOrders: purchaseOrderService,
  settings: settingsService,
  userGuide: userGuideService,
  upload: uploadService,
  reports: reportService,
  notifications: notificationService,
};
import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  StickyNote, 
  MoreVertical, 
  ChevronDown,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  Truck,
  AlertTriangle,
  ShoppingCart,
  XCircle,
  Box,
  Tag
} from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      refundedOrders: 0,
      cancelledOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      lowStock: 0,
      outOfStock: 0,
      inStock: 0
    },
    products: [],
    recentSales: [],
    customerContacts: [],
    purchaseHistory: []
  });

  // Stats data for the top cards
  const statsData = [
    { 
      title: 'Total Products', 
      value: dashboardData.stats.totalProducts, 
      updated: `${dashboardData.stats.inStock} in stock`,
      icon: Package,
      color: 'blue'
    },
    { 
      title: 'Low Stock Alert', 
      value: dashboardData.stats.lowStock, 
      updated: `${dashboardData.stats.outOfStock} out of stock`,
      icon: AlertTriangle,
      color: 'orange'
    },
    { 
      title: 'Total Revenue', 
      value: `KES ${dashboardData.stats.totalRevenue.toFixed(2)}`, 
      updated: `${dashboardData.stats.totalOrders} total orders`,
      icon: DollarSign,
      color: 'green'
    },
    { 
      title: 'Total Orders', 
      value: dashboardData.stats.totalOrders, 
      updated: `${dashboardData.stats.completedOrders} completed`,
      icon: ShoppingBag,
      color: 'purple'
    },
  ];

  // Fetch all dashboard data from real APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch ALL products
      const productsRes = await fetch('http://localhost:5000/api/products', {
        credentials: 'include'
      });
      let products = [];
      if (productsRes.ok) {
        products = await productsRes.json();
        console.log('✅ Products fetched:', products.length);
      }

      // Fetch sales
      const salesRes = await fetch('http://localhost:5000/api/sales', {
        credentials: 'include'
      });
      let sales = [];
      if (salesRes.ok) {
        sales = await salesRes.json();
        console.log('✅ Sales fetched:', sales.length);
      }

      // Fetch customers
      const customersRes = await fetch('http://localhost:5000/api/customers', {
        credentials: 'include'
      });
      let customers = [];
      if (customersRes.ok) {
        customers = await customersRes.json();
        console.log('✅ Customers fetched:', customers.length);
      }

      // Calculate stats from REAL product data
      const totalProducts = products.length;
      
      // Stock status breakdown
      const inStock = products.filter(p => p.stock >= 51).length;
      const lowStock = products.filter(p => p.stock >= 25 && p.stock <= 50).length;
      const outOfStock = products.filter(p => p.stock <= 24).length;
      
      // Calculate total value of all products
      const totalProductValue = products.reduce((sum, p) => sum + (p.price * p.stock || 0), 0);
      
      // Sales stats - from your actual sales data
      const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const totalOrders = sales.length;
      const completedOrders = sales.filter(s => s.status === 'Completed').length;
      const pendingOrders = sales.filter(s => s.status === 'Pending').length;
      const cancelledOrders = sales.filter(s => s.status === 'Cancelled').length;
      const refundedOrders = sales.filter(s => s.status === 'Refunded').length;

      // Get recent sales (last 5)
      const recentSales = sales.slice(0, 5).map(s => ({
        ...s,
        customer_name: s.customer_name || 'Walk-in Customer'
      }));

      // Get customer contacts from REAL customers only
      let customerContacts = customers.slice(0, 5).map(c => ({
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
        phone: c.phone || 'N/A',
        type: 'Email',
        summary: `Customer since ${new Date(c.created_at).toLocaleDateString()}`,
        status: c.status || 'Active'
      }));

      // If no customers, use sales customers as fallback
      if (customerContacts.length === 0 && sales.length > 0) {
        customerContacts = sales.slice(0, 5).map(s => ({
          name: s.customer_name || 'Walk-in Customer',
          phone: s.customer_phone || 'N/A',
          type: 'Email',
          summary: `Order #${s.sale_number || s.id}`,
          status: s.status || 'Active'
        }));
      }

      // Calculate purchase history from REAL sales
      const pendingTotal = sales.filter(s => s.status === 'Pending').reduce((sum, s) => sum + (s.total || 0), 0);
      const completedTotal = sales.filter(s => s.status === 'Completed').reduce((sum, s) => sum + (s.total || 0), 0);
      const cancelledTotal = sales.filter(s => s.status === 'Cancelled').reduce((sum, s) => sum + (s.total || 0), 0);
      const refundedTotal = sales.filter(s => s.status === 'Refunded').reduce((sum, s) => sum + (s.total || 0), 0);

      const purchaseHistory = [
        { label: 'Pending', amount: pendingTotal.toFixed(2) },
        { label: 'Completed', amount: completedTotal.toFixed(2) },
        { label: 'Cancelled', amount: cancelledTotal.toFixed(2) },
        { label: 'Refunded', amount: refundedTotal.toFixed(2) },
      ].filter(item => parseFloat(item.amount) > 0);

      setDashboardData({
        stats: {
          totalRevenue,
          totalOrders,
          completedOrders,
          pendingOrders,
          refundedOrders,
          cancelledOrders,
          totalCustomers: customers.length,
          totalProducts,
          lowStock,
          outOfStock,
          inStock
        },
        products: products.slice(0, 10),
        recentSales,
        customerContacts,
        purchaseHistory
      });

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActivityIcon = (type) => {
    switch(type) {
      case 'Email': return <Mail className="w-4 h-4 text-gray-500" />;
      case 'Chat': return <MessageSquare className="w-4 h-4 text-gray-500" />;
      case 'Notes': return <StickyNote className="w-4 h-4 text-gray-500" />;
      case 'Phone Call': return <Phone className="w-4 h-4 text-gray-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'In Stock': 'bg-green-100 text-green-700',
      'Active': 'bg-green-100 text-green-700',
      'Completed': 'bg-green-100 text-green-700',
      'Low Stock': 'bg-yellow-100 text-yellow-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Out of Stock': 'bg-red-100 text-red-700',
      'Inactive': 'bg-red-100 text-red-700',
      'Cancelled': 'bg-red-100 text-red-700',
      'Refunded': 'bg-purple-100 text-purple-700',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-600';
  };

  const getStockStatusColor = (stock) => {
    if (stock >= 51) return 'text-green-600 font-semibold';
    if (stock >= 25) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getStatColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-100',
      purple: 'bg-purple-50 border-purple-100',
      green: 'bg-green-50 border-green-100',
      orange: 'bg-orange-50 border-orange-100',
    };
    return colorMap[color] || 'bg-gray-50 border-gray-100';
  };

  const getStatTextColor = (color) => {
    const colorMap = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
    };
    return colorMap[color] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Check if there's any real data
  const hasData = dashboardData.stats.totalProducts > 0 || 
                  dashboardData.stats.totalOrders > 0 || 
                  dashboardData.stats.totalCustomers > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border border-gray-200">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No Data Available</h3>
        <p className="text-sm text-gray-500 mt-1">Start by adding products, customers, or creating sales.</p>
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Product
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Create Sale
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Add Customer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className={`border rounded-xl p-4 ${getStatColor(stat.color)} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.title === 'Total Revenue' 
                      ? `KES ${dashboardData.stats.totalRevenue.toFixed(2)}`
                      : stat.title === 'Total Products'
                      ? dashboardData.stats.totalProducts
                      : stat.title === 'Low Stock Alert'
                      ? dashboardData.stats.lowStock
                      : dashboardData.stats.totalOrders
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.updated}</p>
                </div>
                <div className={`p-2 rounded-lg bg-white shadow-sm ${getStatTextColor(stat.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Products Overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-gray-900">
                {dashboardData.stats.totalProducts}
              </span>
              <span className="text-sm font-medium text-gray-600 ml-1">Products</span>
              <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full ml-2">
                {dashboardData.stats.inStock} In Stock
              </span>
            </div>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
            View All Products →
          </button>
        </div>
        
        {/* Stock Distribution Chart */}
        <div className="relative h-32 bg-gray-50 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-end px-4">
            <div className="w-full flex items-end justify-around gap-4 h-full pt-4">
              {[
                { label: 'In Stock', count: dashboardData.stats.inStock, color: 'bg-green-500' },
                { label: 'Low Stock', count: dashboardData.stats.lowStock, color: 'bg-yellow-500' },
                { label: 'Out of Stock', count: dashboardData.stats.outOfStock, color: 'bg-red-500' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-full ${item.color} rounded-t-sm transition-all duration-300`}
                    style={{ 
                      height: `${dashboardData.stats.totalProducts > 0 
                        ? (item.count / dashboardData.stats.totalProducts) * 100 
                        : 0}%`,
                      minHeight: item.count > 0 ? '8px' : '0px',
                      opacity: 0.8
                    }}
                  />
                  <span className="text-xs text-gray-600 mt-2 font-medium">{item.label}</span>
                  <span className="text-xs text-gray-400">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List - takes 2/3 */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Products</h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              View All Products
            </button>
          </div>
          {dashboardData.products.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.products.map((product, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-900">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">KES {product.price?.toFixed(2) || '0.00'}</td>
                        <td className={`py-3 px-4 ${getStockStatusColor(product.stock)}`}>
                          {product.stock || 0}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status || 'Unknown')}`}>
                            {product.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm">No products yet</p>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">Add your first product</button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Contacts */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Recent Customers</h3>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                View All
              </button>
            </div>
            {dashboardData.customerContacts.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="space-y-3">
                  {dashboardData.customerContacts.slice(0, 4).map((customer, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                        <p className="text-xs text-gray-500 truncate">{customer.phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No customers yet</p>
              </div>
            )}
          </div>

          {/* Sales Summary */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Sales Summary</h3>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                View All
              </button>
            </div>
            {dashboardData.purchaseHistory.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="space-y-2">
                  {dashboardData.purchaseHistory.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className={`text-sm font-bold ${
                        item.label === 'Pending' ? 'text-yellow-600' : 
                        item.label === 'Completed' ? 'text-green-600' : 
                        item.label === 'Cancelled' ? 'text-red-600' : 
                        'text-purple-600'
                      }`}>
                        KES {item.amount}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total</span>
                      <span className="text-sm font-bold text-blue-600">
                        KES {dashboardData.purchaseHistory.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
                <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No sales yet</p>
              </div>
            )}
          </div>

          {/* Completed Accuracy */}
          {dashboardData.stats.totalOrders > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Completion Rate</h3>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600">
                      {dashboardData.stats.totalOrders > 0 
                        ? Math.round((dashboardData.stats.completedOrders / dashboardData.stats.totalOrders) * 100)
                        : 0}
                      .00%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Order completion rate</p>
                  </div>
                  <div className="relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="32"
                        cx="40"
                        cy="40"
                      />
                      <circle
                        className="text-green-500"
                        strokeWidth="8"
                        strokeDasharray={200}
                        strokeDashoffset={
                          200 - (200 * (dashboardData.stats.totalOrders > 0 
                            ? (dashboardData.stats.completedOrders / dashboardData.stats.totalOrders)
                            : 0))
                        }
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="32"
                        cx="40"
                        cy="40"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-green-600">
                      {dashboardData.stats.totalOrders > 0 
                        ? Math.round((dashboardData.stats.completedOrders / dashboardData.stats.totalOrders) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Based on {dashboardData.stats.totalOrders} orders</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
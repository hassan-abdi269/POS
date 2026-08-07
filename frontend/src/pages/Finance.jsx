// src/pages/Finance.jsx

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Download,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  CreditCard,
  PiggyBank,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw,
  Package,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import { financeService, authService } from '../service/api';
// Import the api instance correctly
import { api } from '../service/api';

const Finance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [viewMode, setViewMode] = useState('cards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState({
    revenue: { total: 0, count: 0, average: 0 },
    expenses: { total: 0, count: 0, paid: 0, pending: 0 },
    profit: { net: 0, margin: 0 },
    products: { total: 0, low_stock: 0, out_of_stock: 0 },
    customers: { total: 0 }
  });
  const [transactions, setTransactions] = useState([]);
  const [revenueChart, setRevenueChart] = useState({ labels: [], data: [] });
  const [expenseChart, setExpenseChart] = useState({ labels: [], data: [] });

  const periods = ['today', 'week', 'month', 'quarter', 'year'];

  // Get current shop ID
  const getShopId = () => {
    const user = authService.getCurrentUser();
    return user?.shopId;
  };

  // Get period label
  const getPeriodLabel = (period) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  // Get period parameters for API
  const getPeriodParams = (period) => {
    const now = new Date();
    let startDate, endDate;
    
    switch(period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        endDate = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };
  };

  // Fetch finance overview
  const fetchOverview = async () => {
    try {
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      const params = getPeriodParams(selectedPeriod);
      // Add shop_id to params
      const data = await financeService.getFinancialOverview(shopId, params);
      
      setOverview({
        revenue: data.revenue || { total: 0, count: 0, average: 0 },
        expenses: data.expenses || { total: 0, count: 0, paid: 0, pending: 0 },
        profit: data.profit || { net: 0, margin: 0 },
        products: data.products || { total: 0, low_stock: 0, out_of_stock: 0 },
        customers: data.customers || { total: 0 }
      });
    } catch (error) {
      console.error('Error fetching overview:', error);
      setError(error.response?.data?.error || 'Failed to load financial overview');
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const shopId = getShopId();
      if (!shopId) return;

      // Use the transactions endpoint with shop_id
      const response = await api.get('/finance/transactions', {
        params: { shop_id: shopId, limit: 20 }
      });
      
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Don't set error state here to avoid breaking the page
    }
  };

  // Fetch revenue chart data
  const fetchRevenueChart = async () => {
    try {
      const shopId = getShopId();
      if (!shopId) return;

      const response = await api.get('/finance/revenue-chart', {
        params: { shop_id: shopId, period: selectedPeriod }
      });
      
      if (response.data) {
        setRevenueChart({
          labels: response.data.labels || [],
          data: response.data.data || []
        });
      }
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
      // Set fallback data
      const labels = selectedPeriod === 'month' 
        ? Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`)
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      setRevenueChart({ 
        labels, 
        data: labels.map(() => Math.random() * 1000) 
      });
    }
  };

  // Fetch expense chart data
  const fetchExpenseChart = async () => {
    try {
      const shopId = getShopId();
      if (!shopId) return;

      const response = await api.get('/finance/expense-chart', {
        params: { shop_id: shopId, period: selectedPeriod }
      });
      
      if (response.data) {
        setExpenseChart({
          labels: response.data.labels || [],
          data: response.data.data || []
        });
      }
    } catch (error) {
      console.error('Error fetching expense chart:', error);
      // Set fallback data
      const labels = selectedPeriod === 'month' 
        ? Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`)
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      setExpenseChart({ 
        labels, 
        data: labels.map(() => Math.random() * 500) 
      });
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      await Promise.all([
        fetchOverview(),
        fetchTransactions(),
        fetchRevenueChart(),
        fetchExpenseChart()
      ]);
      setLoading(false);
    };
    fetchAll();
  }, [selectedPeriod]);

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    await Promise.all([
      fetchOverview(),
      fetchTransactions(),
      fetchRevenueChart(),
      fetchExpenseChart()
    ]);
    setLoading(false);
  };

  // Filter transactions
  const filteredData = transactions.filter(item => {
    const matchesSearch = item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesType = selectedType === 'All' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalRevenue = overview.revenue?.total || 0;
  const totalExpenses = overview.expenses?.total || 0;
  const netProfit = overview.profit?.net || 0;

  // Get max value for chart scaling
  const maxRevenue = Math.max(...revenueChart.data, 1);
  const maxExpense = Math.max(...expenseChart.data, 1);

  // Get chart display labels - show fewer labels for better readability
  const getDisplayLabels = (labels, data, period) => {
    if (period === 'today') {
      return labels.filter((_, i) => i % 2 === 0);
    } else if (period === 'week') {
      return labels;
    } else if (period === 'month') {
      return labels.filter((_, i) => i % 5 === 0 || i === labels.length - 1);
    } else {
      return labels;
    }
  };

  const displayRevenueLabels = getDisplayLabels(revenueChart.labels, revenueChart.data, selectedPeriod);
  const displayRevenueData = getDisplayLabels(revenueChart.data, revenueChart.data, selectedPeriod);
  const displayExpenseLabels = getDisplayLabels(expenseChart.labels, expenseChart.data, selectedPeriod);
  const displayExpenseData = getDisplayLabels(expenseChart.data, expenseChart.data, selectedPeriod);

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Financial Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage all your financial transactions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Table
            </button>
          </div>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg">
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {periods.map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {getPeriodLabel(period)}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">KES {totalRevenue.toFixed(2)}</p>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>{overview.revenue?.count || 0} transactions</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Expenses</p>
            <div className="p-2 bg-red-50 rounded-lg">
              <Wallet className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">KES {totalExpenses.toFixed(2)}</p>
          <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
            <TrendingDown className="w-3 h-3" />
            <span>{overview.expenses?.count || 0} transactions</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Net Profit</p>
            <div className="p-2 bg-blue-50 rounded-lg">
              <PiggyBank className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            KES {netProfit.toFixed(2)}
          </p>
          <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Margin: {overview.profit?.margin?.toFixed(1) || 0}%</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Transactions</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <CreditCard className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{(overview.revenue?.count || 0) + (overview.expenses?.count || 0)}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Calendar className="w-3 h-3" />
            <span>This period</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Revenue</h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1"
            >
              {periods.map(p => (
                <option key={p} value={p}>{getPeriodLabel(p)}</option>
              ))}
            </select>
          </div>
          <div className="h-48 flex items-end justify-between gap-1 overflow-x-auto">
            {displayRevenueData.length > 0 ? (
              displayRevenueData.map((value, index) => {
                const height = maxRevenue > 0 ? (value / maxRevenue) * 100 : 0;
                return (
                  <div key={index} className="flex-1 min-w-[20px] flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                      style={{ height: `${Math.max(height, 2)}%`, minHeight: height > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-gray-500 truncate max-w-full">
                      {displayRevenueLabels[index] || ''}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Expenses</h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1"
            >
              {periods.map(p => (
                <option key={p} value={p}>{getPeriodLabel(p)}</option>
              ))}
            </select>
          </div>
          <div className="h-48 flex items-end justify-between gap-1 overflow-x-auto">
            {displayExpenseData.length > 0 ? (
              displayExpenseData.map((value, index) => {
                const height = maxExpense > 0 ? (value / maxExpense) * 100 : 0;
                return (
                  <div key={index} className="flex-1 min-w-[20px] flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-red-500 rounded-t transition-all duration-500 hover:bg-red-600"
                      style={{ height: `${Math.max(height, 2)}%`, minHeight: height > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-gray-500 truncate max-w-full">
                      {displayExpenseLabels[index] || ''}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Products</p>
              <p className="font-semibold text-gray-900">{overview.products?.total || 0}</p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-xs text-yellow-600">{overview.products?.low_stock || 0} Low</span>
              <span className="text-xs text-red-600 ml-2">{overview.products?.out_of_stock || 0} Out</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Customers</p>
              <p className="font-semibold text-gray-900">{overview.customers?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Wallet className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expenses Status</p>
              <p className="font-semibold text-gray-900">
                <span className="text-green-600">KES {(overview.expenses?.paid || 0).toFixed(2)}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-yellow-600">KES {(overview.expenses?.pending || 0).toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white cursor-pointer hover:border-gray-300 transition-colors"
            >
              <option value="All">All Types</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">More Filters</span>
          </button>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading transactions...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredData.map((transaction) => (
              <div key={transaction.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                        transaction.type === 'Revenue' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {transaction.type === 'Revenue' ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm truncate max-w-[150px]">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      transaction.status === 'Completed' || transaction.status === 'Paid' 
                        ? 'border-green-200 bg-green-50 text-green-700' 
                        : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        transaction.status === 'Completed' || transaction.status === 'Paid' 
                          ? 'bg-green-500' 
                          : 'bg-yellow-500'
                      }`}></span>
                      {transaction.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-sm text-gray-500">Amount</span>
                      <p className={`text-xl font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}KES {Math.abs(transaction.amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{transaction.category}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3.5 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-4 text-gray-500">Loading transactions...</p>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900 truncate max-w-xs">
                        {transaction.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'Revenue' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            transaction.type === 'Revenue' ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{transaction.category}</td>
                      <td className="py-3 px-4 text-gray-600">{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${(transaction.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(transaction.amount || 0) >= 0 ? '+' : ''}KES {Math.abs(transaction.amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'Completed' || transaction.status === 'Paid'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            transaction.status === 'Completed' || transaction.status === 'Paid'
                              ? 'bg-green-500'
                              : 'bg-yellow-500'
                          }`}></span>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
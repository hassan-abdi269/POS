// src/pages/Expense.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Download,
  Edit,
  Trash2,
  ChevronDown,
  TrendingDown,
  Wallet,
  Calendar,
  FileText,
  CreditCard,
  Building2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Save,
  Package,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { expenseService, authService, reportService } from '../service/api';

const Expense = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Data states
  const [expenseData, setExpenseData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    count: 0,
    average: 0
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    item_name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    reference: '',
    status: 'Pending',
    notes: ''
  });

  // Get current shop ID
  const getShopId = () => {
    const user = authService.getCurrentUser();
    return user?.shopId;
  };

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      // Build params for filtering
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedPaymentMethod !== 'All') params.payment_method = selectedPaymentMethod;

      const data = await expenseService.getAllExpenses(shopId, params);
      setExpenseData(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError(error.response?.data?.error || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const shopId = getShopId();
      if (!shopId) return;

      // Get all expenses to calculate stats
      const expenses = await expenseService.getAllExpenses(shopId);
      
      const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const paid = expenses.filter(e => e.status === 'Paid' || e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);
      const pending = expenses.filter(e => e.status === 'Pending' || e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0);
      const overdue = expenses.filter(e => e.status === 'Overdue' || e.status === 'overdue').reduce((sum, e) => sum + (e.amount || 0), 0);
      const count = expenses.length;
      const average = count > 0 ? total / count : 0;

      setStats({
        total,
        paid,
        pending,
        overdue,
        count,
        average
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, selectedPaymentMethod]);

  // Handle export
  const handleExport = async (format) => {
    try {
      setLoading(true);
      setError('');
      
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      // Build params for filtering
      const params = {};
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedPaymentMethod !== 'All') params.payment_method = selectedPaymentMethod;
      if (searchTerm) params.search = searchTerm;

      // Use report service to generate expense report
      const blob = await reportService.generateExpenseReport(shopId, params);
      
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const extension = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'docx';
      link.download = `expenses_report_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      setSuccess(`Expenses report exported as ${format.toUpperCase()} successfully!`);
      setShowExportMenu(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setError(error.response?.data?.error || 'Failed to export expenses data');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit - Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const shopId = getShopId();
    if (!shopId) {
      setError('Shop not found. Please login again.');
      return;
    }

    try {
      await expenseService.createExpense(shopId, {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setSuccess('Expense added successfully!');
      setShowAddModal(false);
      resetForm();
      await fetchExpenses();
      await fetchStats();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error adding expense:', error);
      setError(error.response?.data?.error || 'Failed to add expense');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handle form submit - Update Expense
  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const shopId = getShopId();
    if (!shopId) {
      setError('Shop not found. Please login again.');
      return;
    }

    try {
      await expenseService.updateExpense(shopId, selectedExpense.id, {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setSuccess('Expense updated successfully!');
      setShowEditModal(false);
      resetForm();
      await fetchExpenses();
      await fetchStats();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error updating expense:', error);
      setError(error.response?.data?.error || 'Failed to update expense');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      try {
        await expenseService.deleteExpense(shopId, expenseId);
        setSuccess('Expense deleted successfully!');
        await fetchExpenses();
        await fetchStats();
        setTimeout(() => setSuccess(''), 5000);
      } catch (error) {
        console.error('Error deleting expense:', error);
        setError(error.response?.data?.error || 'Failed to delete expense');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      item_name: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      reference: '',
      status: 'Pending',
      notes: ''
    });
    setSelectedExpense(null);
  };

  // Handle edit
  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      item_name: expense.item_name,
      amount: expense.amount?.toString() || '',
      date: expense.date || new Date().toISOString().split('T')[0],
      payment_method: expense.payment_method || 'Cash',
      reference: expense.reference || '',
      status: expense.status || 'Pending',
      notes: expense.notes || ''
    });
    setShowEditModal(true);
  };

  // Handle view
  const handleView = (expense) => {
    setSelectedExpense(expense);
    setShowViewModal(true);
  };

  const statuses = ['All', 'Paid', 'Pending', 'Overdue'];
  const paymentMethods = ['All', 'Credit Card', 'Bank Transfer', 'Cash', 'Debit Card', 'M-Pesa'];

  const getStatusDot = (status) => {
    switch(status) {
      case 'Paid': return 'bg-green-500';
      case 'Pending': return 'bg-yellow-500';
      case 'Overdue': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBgColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Overdue': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'Credit Card': return <CreditCard className="w-3.5 h-3.5" />;
      case 'Bank Transfer': return <Building2 className="w-3.5 h-3.5" />;
      case 'Cash': return <Wallet className="w-3.5 h-3.5" />;
      case 'Debit Card': return <CreditCard className="w-3.5 h-3.5" />;
      case 'M-Pesa': return <Wallet className="w-3.5 h-3.5" />;
      default: return <Wallet className="w-3.5 h-3.5" />;
    }
  };

  // Get icon for item
  const getItemIcon = (itemName) => {
    const name = itemName?.toLowerCase() || '';
    if (name.includes('rent') || name.includes('lease')) return <Building2 className="w-5 h-5" />;
    if (name.includes('supply') || name.includes('material')) return <ShoppingBag className="w-5 h-5" />;
    if (name.includes('product') || name.includes('inventory')) return <Package className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Expense Tracking</h2>
          <p className="text-sm text-gray-500 mt-0.5">Monitor and manage all your business expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button 
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3 h-3" />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px] overflow-hidden">
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-xl">📊</span>
                  <div>
                    <p className="font-medium">Excel</p>
                    <p className="text-xs text-gray-400">.xlsx format</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3 border-t border-gray-100 transition-colors"
                >
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="font-medium">PDF</p>
                    <p className="text-xs text-gray-400">.pdf format</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('word')}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3 border-t border-gray-100 transition-colors"
                >
                  <span className="text-xl">📝</span>
                  <div>
                    <p className="font-medium">Word</p>
                    <p className="text-xs text-gray-400">.docx format</p>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Expenses</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Wallet className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">KES {stats.total.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>{stats.count} transactions</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Paid</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">KES {stats.paid.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>{stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(0) : 0}% of total</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-yellow-600">KES {stats.pending.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>{stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(0) : 0}% of total</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Average</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <TrendingDown className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">KES {stats.average.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>Per expense average</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white cursor-pointer hover:border-gray-300 transition-colors"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white cursor-pointer hover:border-gray-300 transition-colors"
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table View Only */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3.5 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading expenses...</p>
                  </td>
                </tr>
              ) : expenseData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No expenses found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                expenseData.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          {getItemIcon(expense.item_name)}
                        </div>
                        <span className="font-medium text-gray-900">{expense.item_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{expense.date}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {getPaymentIcon(expense.payment_method)}
                        {expense.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{expense.reference || '-'}</td>
                    <td className="py-3 px-4 font-medium text-red-600">-KES {expense.amount?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusBgColor(expense.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(expense.status)}`}></span>
                        {expense.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-0.5">
                        <button 
                          onClick={() => handleView(expense)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                        </button>
                        <button 
                          onClick={() => handleEdit(expense)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Add New Expense</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter item name (e.g., Office Rent, Supplies, etc.)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (KES) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Invoice or reference number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Edit Expense</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter item name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (KES) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Invoice or reference number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Update Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {showViewModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Expense Details</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Item Name</p>
                  <p className="font-medium text-gray-900">{selectedExpense.item_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-red-600">-KES {selectedExpense.amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{selectedExpense.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900">{selectedExpense.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBgColor(selectedExpense.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(selectedExpense.status)}`}></span>
                    {selectedExpense.status}
                  </span>
                </div>
                {selectedExpense.reference && (
                  <div>
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="font-medium text-gray-900">{selectedExpense.reference}</p>
                  </div>
                )}
              </div>

              {selectedExpense.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{selectedExpense.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(selectedExpense);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;
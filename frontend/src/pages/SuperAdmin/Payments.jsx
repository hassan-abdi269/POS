// src/pages/SuperAdmin/Payments.jsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  DollarSign,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Banknote,
  Plus,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { shopService, authService, paymentService } from '../../service/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [shops, setShops] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    totalPayments: 0,
    recentRevenue: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterShop, setFilterShop] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditPayment, setShowEditPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // Check if user is super admin
    if (!authService.isSuperAdmin()) {
      setError('Access denied. Super admin privileges required.');
      setIsLoading(false);
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadShops(),
        loadPayments(),
        loadStats()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadShops = async () => {
    try {
      const response = await shopService.getAllShops();
      const shopsData = response?.shops || response || [];
      setShops(shopsData);
    } catch (err) {
      console.error('Error loading shops:', err);
    }
  };

  // Fetch real payments from API
  const loadPayments = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPlan !== 'all') params.plan = filterPlan;
      if (filterShop) params.shop_id = filterShop;

      const response = await paymentService.getAllPayments(params);
      const paymentsData = response?.payments || response || [];
      setPayments(paymentsData);
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Failed to load payments');
    }
  };

  // Fetch real payment stats
  const loadStats = async () => {
    try {
      const params = {};
      if (filterShop) params.shop_id = filterShop;

      const response = await paymentService.getPaymentStats(params);
      const statsData = response?.stats || {};
      
      setStats({
        totalRevenue: statsData.totalRevenue || 0,
        pendingPayments: statsData.pendingPayments || 0,
        completedPayments: statsData.completedPayments || 0,
        failedPayments: statsData.failedPayments || 0,
        refundedPayments: statsData.refundedPayments || 0,
        totalPayments: statsData.totalPayments || 0,
        recentRevenue: statsData.recentRevenue || 0
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      // Fallback: calculate from payments
      if (payments.length > 0) {
        calculateStatsFromPayments(payments);
      }
    }
  };

  // Fallback calculation from payments
  const calculateStatsFromPayments = (paymentData) => {
    const totalRevenue = paymentData.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingPayments = paymentData.filter(p => p.status === 'pending').length;
    const completedPayments = paymentData.filter(p => p.status === 'completed').length;
    const failedPayments = paymentData.filter(p => p.status === 'failed').length;
    const refundedPayments = paymentData.filter(p => p.status === 'refunded').length;
    const totalPayments = paymentData.length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRevenue = paymentData
      .filter(p => p.payment_date && new Date(p.payment_date) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    setStats({
      totalRevenue,
      pendingPayments,
      completedPayments,
      failedPayments,
      refundedPayments,
      totalPayments,
      recentRevenue
    });
  };

  // Create payment via API
  const handleAddPayment = async (newPayment) => {
    try {
      const response = await paymentService.createPayment(newPayment);
      if (response.success) {
        await loadData();
        setShowAddPayment(false);
        alert('Payment added successfully!');
      } else {
        alert(response.error || 'Failed to add payment');
      }
    } catch (err) {
      console.error('Error adding payment:', err);
      alert('Failed to add payment: ' + (err.response?.data?.error || err.message));
    }
  };

  // Update payment via API
  const handleEditPayment = async (paymentId, updatedData) => {
    try {
      const response = await paymentService.updatePayment(paymentId, updatedData);
      if (response.success) {
        await loadData();
        setShowEditPayment(null);
        alert('Payment updated successfully!');
      } else {
        alert(response.error || 'Failed to update payment');
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      alert('Failed to update payment: ' + (err.response?.data?.error || err.message));
    }
  };

  // Update payment status via API
  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      const response = await paymentService.updatePaymentStatus(paymentId, newStatus);
      if (response.success) {
        await loadData();
        alert(`Payment ${newStatus} successfully!`);
      } else {
        alert(response.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update payment status: ' + (err.response?.data?.error || err.message));
    }
  };

  // Delete payment via API
  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      const response = await paymentService.deletePayment(paymentId);
      if (response.success) {
        await loadData();
        alert('Payment deleted successfully!');
      } else {
        alert(response.error || 'Failed to delete payment');
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      alert('Failed to delete payment: ' + (err.response?.data?.error || err.message));
    }
  };

  // Reload payments when filters change
  useEffect(() => {
    if (authService.isSuperAdmin() && !isLoading) {
      loadPayments();
      loadStats();
    }
  }, [searchTerm, filterStatus, filterPlan, filterShop]);

  // Filter payments (client-side filtering of API results)
  const getFilteredPayments = () => {
    let filtered = [...payments];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.transaction_id?.toLowerCase().includes(term) ||
        p.customer_name?.toLowerCase().includes(term) ||
        p.shop_name?.toLowerCase().includes(term) ||
        p.receipt_number?.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    if (filterPlan !== 'all') {
      filtered = filtered.filter(p => p.plan === filterPlan);
    }
    
    if (filterShop) {
      filtered = filtered.filter(p => p.shop_id === parseInt(filterShop));
    }
    
    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Export single payment as PDF
  const exportSinglePaymentPDF = (payment) => {
    if (!payment) return;

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('Payment Receipt', pageWidth / 2, 25, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const dateStr = new Date().toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generated: ${dateStr}`, pageWidth / 2, 33, { align: 'center' });

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 38, pageWidth - 20, 38);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Details', 20, 48);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let yPos = 55;
      const lineHeight = 7;

      const details = [
        ['Transaction ID', payment.transaction_id || 'N/A'],
        ['Receipt Number', payment.receipt_number || 'N/A'],
        ['Status', payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || 'N/A'],
        ['Shop', payment.shop_name || 'N/A'],
        ['Shop ID', `#${payment.shop_id}`],
        ['Customer Name', payment.customer_name || 'N/A'],
        ['Customer Email', payment.customer_email || 'N/A'],
        ['Customer Phone', payment.customer_phone || 'N/A'],
        ['Amount', `KES ${(payment.amount || 0).toLocaleString()}`],
        ['Plan', payment.plan || 'N/A'],
        ['Payment Method', payment.payment_method?.replace('_', ' ') || 'N/A'],
        ['Payment Date', payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-KE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'N/A'],
        ['Payment Time', payment.payment_date ? new Date(payment.payment_date).toLocaleTimeString('en-KE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) : 'N/A']
      ];

      details.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label + ':', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, yPos);
        yPos += lineHeight;
      });

      if (payment.notes) {
        yPos += 4;
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(payment.notes, 70, yPos);
        yPos += lineHeight;
      }

      yPos += 6;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, pageWidth - 20, yPos);

      yPos += 10;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        'This is a computer generated receipt',
        pageWidth / 2,
        yPos,
        { align: 'center' }
      );
      doc.text(
        'Thank you for your business!',
        pageWidth / 2,
        yPos + 5,
        { align: 'center' }
      );

      doc.save(`payment_${payment.transaction_id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'refunded': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'credit_card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Banknote className="h-4 w-4" />;
      case 'mobile_money': return <DollarSign className="h-4 w-4" />;
      case 'cash': return <DollarSign className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'pending': return <Clock className="h-3.5 w-3.5" />;
      case 'failed': return <XCircle className="h-3.5 w-3.5" />;
      case 'refunded': return <XCircle className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const planOptions = ['Basic', 'Standard', 'Premium'];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Manage all subscription payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddPayment(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Payment
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-1">
            {formatCurrency(stats.recentRevenue || 0)} in last 30 days
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pendingPayments || 0}</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-bold text-green-600">{stats.completedPayments || 0}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-xl font-bold text-red-600">{stats.failedPayments || 0}</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search payments..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
          >
            <option value="all">All Plans</option>
            {planOptions.map(plan => (
              <option key={plan} value={plan}>{plan}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            value={filterShop}
            onChange={(e) => setFilterShop(e.target.value)}
          >
            <option value="">All Shops</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 self-center">
            {filteredPayments.length} payments
          </span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{payment.transaction_id}</div>
                        <div className="text-gray-500 text-xs">{payment.customer_name}</div>
                        <div className="text-gray-400 text-xs">Receipt: {payment.receipt_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{payment.shop_name || 'N/A'}</div>
                        <div className="text-gray-500 text-xs">ID: #{payment.shop_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.plan === 'Premium'
                            ? 'bg-purple-100 text-purple-800' 
                            : payment.plan === 'Standard'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.plan || 'Basic'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400">
                            {getPaymentMethodIcon(payment.payment_method)}
                          </span>
                          <span className="text-gray-700 text-xs capitalize">
                            {payment.payment_method?.replace('_', ' ') || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">
                          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-KE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {payment.payment_date ? new Date(payment.payment_date).toLocaleTimeString('en-KE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-0.5">
                          <button 
                            onClick={() => setSelectedPayment(payment)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setShowEditPayment(payment)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Payment"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => exportSinglePaymentPDF(payment)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(payment.id, 'completed')}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(payment.id, 'failed')}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No payments found</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterPlan('all');
                    setFilterShop('');
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredPayments.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddPayment && (
        <AddPaymentModal 
          shops={shops}
          onClose={() => setShowAddPayment(false)}
          onSuccess={handleAddPayment}
        />
      )}

      {/* Edit Payment Modal */}
      {showEditPayment && (
        <EditPaymentModal 
          payment={showEditPayment}
          shops={shops}
          onClose={() => setShowEditPayment(null)}
          onSuccess={handleEditPayment}
        />
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <PaymentDetailsModal 
          payment={selectedPayment} 
          onClose={() => setSelectedPayment(null)}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeletePayment}
          onExportPDF={exportSinglePaymentPDF}
          onEdit={() => {
            setSelectedPayment(null);
            setShowEditPayment(selectedPayment);
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// ADD PAYMENT MODAL - FIXED with Capitalized Plans
// ============================================================
const AddPaymentModal = ({ shops, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    shop_id: '',
    amount: '',
    plan: 'Basic',
    payment_method: 'credit_card',
    status: 'pending',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    payment_date: new Date().toISOString().slice(0, 16),
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);

  const handleShopChange = (shopId) => {
    if (shopId) {
      const shop = shops.find(s => s.id === parseInt(shopId));
      setSelectedShop(shop);
      if (shop) {
        setFormData(prev => ({
          ...prev,
          shop_id: shopId,
          customer_name: shop.owner || '',
          customer_email: shop.email || '',
          customer_phone: shop.phone || '',
          plan: shop.subscription ? shop.subscription.charAt(0).toUpperCase() + shop.subscription.slice(1) : 'Basic'
        }));
      }
    } else {
      setSelectedShop(null);
      setFormData(prev => ({
        ...prev,
        shop_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        plan: 'Basic'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.shop_id) {
      setError('Please select a shop');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!formData.customer_name.trim()) {
      setError('Please enter customer name');
      return;
    }
    if (!formData.payment_date) {
      setError('Please select payment date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentDate = new Date(formData.payment_date);
      const isoDate = paymentDate.toISOString();
      
      const paymentData = {
        shop_id: parseInt(formData.shop_id),
        amount: parseFloat(formData.amount),
        plan: formData.plan,
        payment_method: formData.payment_method,
        status: formData.status,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        payment_date: isoDate,
        notes: formData.notes || null
      };

      await onSuccess(paymentData);
      setIsSubmitting(false);
    } catch (err) {
      setError(err.message || 'Failed to add payment');
      setIsSubmitting(false);
    }
  };

  const paymentMethods = ['credit_card', 'bank_transfer', 'mobile_money', 'cash'];
  const planOptions = ['Basic', 'Standard', 'Premium'];
  const statusOptions = ['pending', 'completed', 'failed'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {selectedShop && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Shop: {selectedShop.name}</p>
            <p className="text-xs text-blue-700">Owner: {selectedShop.owner}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.shop_id}
                onChange={(e) => handleShopChange(e.target.value)}
                required
              >
                <option value="">Select a shop...</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                placeholder="+254712345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
              <input
                type="number"
                step="1"
                min="1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.plan}
                onChange={(e) => setFormData({...formData, plan: e.target.value})}
              >
                {planOptions.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({...formData, payment_method: method})}
                    className={`p-2 text-sm rounded-lg border-2 transition-colors capitalize ${
                      formData.payment_method === method
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    {method.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({...formData, status})}
                    className={`p-2 text-sm rounded-lg border-2 transition-colors capitalize ${
                      formData.status === status
                        ? status === 'completed'
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : status === 'pending'
                          ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
                          : 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.payment_date}
                onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows="2"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Add Payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// EDIT PAYMENT MODAL - FIXED with Capitalized Plans
// ============================================================
const EditPaymentModal = ({ payment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: payment.amount || '',
    plan: payment.plan || 'Basic',
    payment_method: payment.payment_method || 'credit_card',
    status: payment.status || 'pending',
    customer_name: payment.customer_name || '',
    customer_email: payment.customer_email || '',
    customer_phone: payment.customer_phone || '',
    payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    notes: payment.notes || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!formData.customer_name.trim()) {
      setError('Please enter customer name');
      return;
    }
    if (!formData.payment_date) {
      setError('Please select payment date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentDate = new Date(formData.payment_date);
      const isoDate = paymentDate.toISOString();
      
      const paymentData = {
        amount: parseFloat(formData.amount),
        plan: formData.plan,
        payment_method: formData.payment_method,
        status: formData.status,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        payment_date: isoDate,
        notes: formData.notes || null
      };

      await onSuccess(payment.id, paymentData);
      setIsSubmitting(false);
    } catch (err) {
      setError(err.message || 'Failed to update payment');
      setIsSubmitting(false);
    }
  };

  const paymentMethods = ['credit_card', 'bank_transfer', 'mobile_money', 'cash'];
  const planOptions = ['Basic', 'Standard', 'Premium'];
  const statusOptions = ['pending', 'completed', 'failed'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">Transaction: <span className="font-medium">{payment.transaction_id}</span></p>
          <p className="text-sm text-gray-600">Shop: <span className="font-medium">{payment.shop_name}</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
              <input
                type="number"
                step="1"
                min="1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.plan}
                onChange={(e) => setFormData({...formData, plan: e.target.value})}
              >
                {planOptions.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({...formData, payment_method: method})}
                    className={`p-2 text-sm rounded-lg border-2 transition-colors capitalize ${
                      formData.payment_method === method
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    {method.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({...formData, status})}
                    className={`p-2 text-sm rounded-lg border-2 transition-colors capitalize ${
                      formData.status === status
                        ? status === 'completed'
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : status === 'pending'
                          ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
                          : 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.payment_date}
                onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="2"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// PAYMENT DETAILS MODAL
// ============================================================
const PaymentDetailsModal = ({ payment, onClose, onUpdateStatus, onDelete, onExportPDF, onEdit }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Transaction ID</p>
            <p className="font-medium text-sm">{payment.transaction_id}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Receipt Number</p>
            <p className="font-medium text-sm">{payment.receipt_number}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Status</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
              {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || 'N/A'}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Shop</p>
            <p className="font-medium text-sm">{payment.shop_name || 'N/A'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Customer</p>
            <p className="font-medium text-sm">{payment.customer_name}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Amount</p>
            <p className="font-bold text-lg text-gray-900">{formatCurrency(payment.amount)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Plan</p>
            <p className="font-medium text-sm">{payment.plan || 'Basic'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Method</p>
            <p className="font-medium text-sm capitalize">{payment.payment_method?.replace('_', ' ') || 'N/A'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-medium text-sm">
              {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Time</p>
            <p className="font-medium text-sm">
              {payment.payment_date ? new Date(payment.payment_date).toLocaleTimeString('en-KE', {
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'}
            </p>
          </div>
          {payment.notes && (
            <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Notes</p>
              <p className="font-medium text-sm">{payment.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <button 
            onClick={() => onEdit()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
          <button 
            onClick={() => onExportPDF(payment)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Download PDF
          </button>
          {payment.status === 'pending' && (
            <>
              <button 
                onClick={() => onUpdateStatus(payment.id, 'completed')}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button 
                onClick={() => onUpdateStatus(payment.id, 'failed')}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          <button 
            onClick={() => onDelete(payment.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payments;
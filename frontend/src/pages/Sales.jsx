import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Download,
  Eye,
  Printer,
  ChevronDown,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Wallet,
  X,
  Save,
  Minus,
  Plus as PlusIcon,
  Trash2,
  Package,
  Edit,
  RefreshCw,
  UserPlus,
  Phone,
  List
} from 'lucide-react';
import { saveAs } from 'file-saver';

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Sale form state - Removed tax
  const [saleForm, setSaleForm] = useState({
    customer_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    payment_method: 'Cash',
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    notes: '',
    status: 'Completed'
  });

  const [salesData, setSalesData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch products from inventory
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const availableProducts = data.filter(p => p.stock > 0);
        setInventoryData(availableProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customers', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const activeCustomers = data.filter(c => c.status === 'Active');
        setCustomersData(activeCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch sales data
  const fetchSales = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sales', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchSales();
  }, []);

  // Calculate totals when items change - Removed tax
  useEffect(() => {
    const subtotal = saleForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - saleForm.discount;
    setSaleForm(prev => ({
      ...prev,
      subtotal,
      total
    }));
  }, [saleForm.items, saleForm.discount]);

  // Handle customer selection
  const handleCustomerSelect = (customerId) => {
    if (!customerId) {
      setSelectedCustomerId('');
      setSaleForm(prev => ({
        ...prev,
        customer_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: ''
      }));
      return;
    }

    const customer = customersData.find(c => c.id === parseInt(customerId));
    if (customer) {
      setSelectedCustomerId(customerId);
      setSaleForm(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.full_name,
        customer_email: customer.email,
        customer_phone: customer.phone
      }));
    }
  };

  // Handle Export
  const handleExport = async (format) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      
      if (selectedPeriod === 'Today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('start_date', today);
        params.append('end_date', today);
      } else if (selectedPeriod === 'Yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        params.append('start_date', dateStr);
        params.append('end_date', dateStr);
      } else if (selectedPeriod === 'This Week') {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        const end = new Date(now);
        end.setDate(now.getDate() + (6 - now.getDay()));
        params.append('start_date', start.toISOString().split('T')[0]);
        params.append('end_date', end.toISOString().split('T')[0]);
      } else if (selectedPeriod === 'This Month') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        params.append('start_date', start.toISOString().split('T')[0]);
        params.append('end_date', end.toISOString().split('T')[0]);
      }
      
      const url = `http://localhost:5000/api/sales/export/${format}?${params.toString()}`;
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
      
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `sales_report_${new Date().toISOString().split('T')[0]}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      } else {
        const ext = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'docx';
        filename += `.${ext}`;
      }
      
      saveAs(blob, filename);
      setSuccess(`Sales report exported as ${format.toUpperCase()} successfully!`);
      setShowExportMenu(false);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setError(error.message || 'Failed to export sales data');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Add product to sale
  const addProductToSale = () => {
    if (!selectedProduct) return;
    
    const existingItem = saleForm.items.find(item => item.product_id === selectedProduct.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > selectedProduct.stock) {
        setError(`Only ${selectedProduct.stock} units available in stock`);
        return;
      }
      setSaleForm(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.product_id === selectedProduct.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      }));
    } else {
      if (quantity > selectedProduct.stock) {
        setError(`Only ${selectedProduct.stock} units available in stock`);
        return;
      }
      setSaleForm(prev => ({
        ...prev,
        items: [...prev.items, {
          product_id: selectedProduct.id,
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          price: selectedProduct.price,
          quantity: quantity,
          stock: selectedProduct.stock,
          image_url: selectedProduct.image_url
        }]
      }));
    }
    
    setSelectedProduct(null);
    setQuantity(1);
    setError('');
  };

  // Remove item from sale
  const removeItemFromSale = (productId) => {
    setSaleForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product_id !== productId)
    }));
  };

  // Update item quantity
  const updateItemQuantity = (productId, newQuantity) => {
    const product = inventoryData.find(p => p.id === productId);
    if (!product) {
      setError('Product not found');
      return;
    }
    if (newQuantity > product.stock) {
      setError(`Only ${product.stock} units available in stock`);
      return;
    }
    if (newQuantity < 1) return;
    
    setSaleForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    }));
  };

  // Submit sale - Removed tax
  const handleSubmitSale = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (saleForm.items.length === 0) {
      setError('Please add at least one product to the sale');
      return;
    }

    try {
      const saleData = {
        ...saleForm,
        customer_id: saleForm.customer_id || null,
        items: saleForm.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Sale #${data.sale_number || data.id} created successfully!`);
        setShowSaleModal(false);
        resetForm();
        fetchProducts();
        fetchSales();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create sale');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      setError('Network error. Please check server connection.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Reset form
  const resetForm = () => {
    setSaleForm({
      customer_id: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      payment_method: 'Cash',
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      notes: '',
      status: 'Completed'
    });
    setSelectedCustomerId('');
    setSelectedProduct(null);
    setQuantity(1);
  };

  // Handle View Sale
  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setShowViewModal(true);
  };

  // Handle Edit Sale
  const handleEditSale = (sale) => {
    setSelectedSale(sale);
    setSaleForm({
      customer_id: sale.customer_id || '',
      customer_name: sale.customer_name || '',
      customer_email: sale.customer_email || '',
      customer_phone: sale.customer_phone || '',
      payment_method: sale.payment_method || 'Cash',
      items: sale.items || [],
      subtotal: sale.subtotal || 0,
      discount: sale.discount || 0,
      total: sale.total || 0,
      notes: sale.notes || '',
      status: sale.status || 'Completed'
    });
    setSelectedCustomerId(sale.customer_id || '');
    setShowEditModal(true);
  };

  // Handle Update Sale
  const handleUpdateSale = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updateData = {
        status: saleForm.status,
        notes: saleForm.notes,
        customer_name: saleForm.customer_name,
        customer_email: saleForm.customer_email,
        customer_phone: saleForm.customer_phone,
        payment_method: saleForm.payment_method
      };

      const response = await fetch(`http://localhost:5000/api/sales/${selectedSale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSuccess(`Sale #${selectedSale.sale_number || selectedSale.id} updated successfully!`);
        setShowEditModal(false);
        fetchSales();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update sale');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error updating sale:', error);
      setError('Network error. Please check server connection.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handle Delete/Cancel Sale
  const handleCancelSale = async (saleId) => {
    if (window.confirm('Are you sure you want to cancel this sale?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/sales/${saleId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          setSuccess('Sale cancelled successfully!');
          fetchSales();
          setTimeout(() => setSuccess(''), 5000);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to cancel sale');
          setTimeout(() => setError(''), 5000);
        }
      } catch (error) {
        console.error('Error cancelling sale:', error);
        setError('Network error. Please check server connection.');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // Get status dot color
  const getStatusDot = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-500';
      case 'Pending': return 'bg-yellow-500';
      case 'Refunded': return 'bg-red-500';
      case 'Cancelled': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBgColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Refunded': return 'bg-red-50 text-red-700 border-red-200';
      case 'Cancelled': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentIcon = (payment) => {
    switch(payment) {
      case 'Credit Card': return <CreditCard className="w-3.5 h-3.5" />;
      case 'PayPal': return <Wallet className="w-3.5 h-3.5" />;
      case 'Cash': return <DollarSign className="w-3.5 h-3.5" />;
      case 'Debit Card': return <CreditCard className="w-3.5 h-3.5" />;
      case 'M-Pesa': return <Wallet className="w-3.5 h-3.5" />;
      default: return <Wallet className="w-3.5 h-3.5" />;
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      'from-gray-400 to-gray-600',
      'from-gray-500 to-gray-700',
      'from-gray-300 to-gray-500',
      'from-gray-400 to-gray-600',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const statuses = ['All', 'Completed', 'Pending', 'Refunded', 'Cancelled'];
  const periods = ['Today', 'Yesterday', 'This Week', 'This Month', 'Custom'];
  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'M-Pesa', 'PayPal'];

  // Filter sales data - Hide cancelled sales by default
  const filteredData = salesData.filter(item => {
    if (!showCancelled && item.status === 'Cancelled') {
      return false;
    }
    
    const idMatch = item.id ? String(item.id).toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const customerMatch = item.customer_name ? item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesSearch = idMatch || customerMatch;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats - Exclude cancelled from calculations
  const activeSales = salesData.filter(item => item.status !== 'Cancelled');
  const totalSales = activeSales.reduce((sum, item) => sum + (item.total || 0), 0);
  const completedSales = activeSales.filter(item => item.status === 'Completed').length;
  const totalOrders = activeSales.length;
  const pendingOrders = activeSales.filter(item => item.status === 'Pending').length;
  const refundedOrders = activeSales.filter(item => item.status === 'Refunded').length;

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
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
          <h2 className="text-xl font-semibold text-gray-900">Sales Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage all your sales orders</p>
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
              setShowSaleModal(true);
            }}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Sale
          </button>
        </div>
      </div>

      {/* Stats Cards - Excluding Cancelled */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">KES {totalSales.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+12.5% from last month</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Orders</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{pendingOrders} pending</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckCircle className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{completedSales}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>{totalOrders > 0 ? ((completedSales / totalOrders) * 100).toFixed(0) : 0}% completion rate</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Refunded</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{refundedOrders}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>{totalOrders > 0 ? ((refundedOrders / totalOrders) * 100).toFixed(0) : 0}% refund rate</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by ID or customer name..."
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
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white cursor-pointer hover:border-gray-300 transition-colors"
            >
              {periods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Show Cancelled Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg bg-white">
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              Show Cancelled
            </label>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">More Filters</span>
          </button>
        </div>
      </div>

      {/* Table View Only */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Names</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3.5 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((order) => {
                const uniqueItems = order.items?.length || 0;
                const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                const itemNames = order.items?.map(item => item.product_name || item.name).join(', ') || 'No items';
                
                return (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-600 hover:text-gray-800 cursor-pointer">
                        #{order.sale_number || order.id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(order.customer_name || 'C')} flex items-center justify-center text-white font-semibold text-xs`}>
                          {(order.customer_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-900 font-medium">{order.customer_name || 'Walk-in Customer'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs truncate" title={itemNames}>
                        {itemNames}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-100 px-2 py-1 rounded-full text-xs font-medium text-blue-700">
                        {uniqueItems}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center bg-gray-100 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                        {totalQuantity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {getPaymentIcon(order.payment_method)}
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">KES {order.total?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusBgColor(order.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(order.status)}`}></span>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-0.5">
                        <button 
                          onClick={() => handleViewSale(order)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                        </button>
                        <button 
                          onClick={() => handleEditSale(order)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                        </button>
                        <button 
                          onClick={() => handleCancelSale(order.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* New Sale Modal - Removed tax */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">New Sale</h3>
              <button 
                onClick={() => setShowSaleModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitSale} className="p-6">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Walk-in Customer</option>
                      {customersData.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.full_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => window.location.href = '/customers'}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                      title="Add New Customer"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={saleForm.payment_method}
                    onChange={(e) => setSaleForm({...saleForm, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={saleForm.customer_email}
                    onChange={(e) => setSaleForm({...saleForm, customer_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Phone
                  </label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={saleForm.customer_phone}
                      onChange={(e) => setSaleForm({...saleForm, customer_phone: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter customer phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Products
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const product = inventoryData.find(p => p.id === parseInt(e.target.value));
                      setSelectedProduct(product);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a product...</option>
                    {inventoryData.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Stock: {product.stock} units - KES {product.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addProductToSale}
                    disabled={!selectedProduct}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                      selectedProduct ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
                {selectedProduct && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {selectedProduct.stock} units
                  </p>
                )}
              </div>

              {/* Cart Items */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Cart Items</h4>
                {saleForm.items.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No items added to cart</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {saleForm.items.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <PlusIcon className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                          <span className="font-medium text-gray-900">KES {(item.price * item.quantity).toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => removeItemFromSale(item.product_id)}
                            className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Summary - Removed tax */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="space-y-2 max-w-sm ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">KES {saleForm.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <input
                      type="number"
                      min="0"
                      value={saleForm.discount}
                      onChange={(e) => setSaleForm({...saleForm, discount: parseFloat(e.target.value) || 0})}
                      className="w-24 px-2 py-1 border border-gray-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">KES {saleForm.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Add any notes about this sale..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  Complete Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Sale Modal - Removed tax display */}
      {showViewModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Sale Details</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Sale Header */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Sale Number</p>
                  <p className="font-semibold text-gray-900">#{selectedSale.sale_number || selectedSale.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold text-gray-900">{selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-semibold text-gray-900">{selectedSale.customer_name || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{selectedSale.customer_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-900">{selectedSale.customer_phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBgColor(selectedSale.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(selectedSale.status)}`}></span>
                    {selectedSale.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-semibold text-gray-900">{selectedSale.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-blue-600 text-lg">KES {selectedSale.total?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Items Purchased</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Product Name</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">SKU</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Price</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600">Qty</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.items && selectedSale.items.length > 0 ? (
                        selectedSale.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200 last:border-0">
                            <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-gray-900">{item.product_name || item.name}</td>
                            <td className="py-2 px-3 text-gray-600">{item.product_sku || item.sku}</td>
                            <td className="py-2 px-3 text-right text-gray-600">KES {item.price?.toFixed(2) || '0.00'}</td>
                            <td className="py-2 px-3 text-center">{item.quantity}</td>
                            <td className="py-2 px-3 text-right font-medium text-gray-900">KES {(item.price * item.quantity)?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-4 text-center text-gray-500">No items found</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan="5" className="py-2 px-3 text-right font-medium text-gray-700">Subtotal:</td>
                        <td className="py-2 px-3 text-right font-medium text-gray-900">KES {selectedSale.subtotal?.toFixed(2) || '0.00'}</td>
                      </tr>
                      <tr>
                        <td colSpan="5" className="py-2 px-3 text-right font-medium text-gray-700">Discount:</td>
                        <td className="py-2 px-3 text-right font-medium text-gray-900">KES {selectedSale.discount?.toFixed(2) || '0.00'}</td>
                      </tr>
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan="5" className="py-2 px-3 text-right font-bold text-gray-900">Total:</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-600">KES {selectedSale.total?.toFixed(2) || '0.00'}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedSale.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{selectedSale.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditSale(selectedSale);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {showEditModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Edit Sale</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateSale} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Number
                </label>
                <input
                  type="text"
                  value={`#${selectedSale.sale_number || selectedSale.id}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={saleForm.customer_name}
                  onChange={(e) => setSaleForm({...saleForm, customer_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={saleForm.customer_email}
                  onChange={(e) => setSaleForm({...saleForm, customer_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer email"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  value={saleForm.customer_phone}
                  onChange={(e) => setSaleForm({...saleForm, customer_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer phone"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  required
                  value={saleForm.payment_method}
                  onChange={(e) => setSaleForm({...saleForm, payment_method: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={saleForm.status}
                  onChange={(e) => setSaleForm({...saleForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add notes..."
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
                  Update Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
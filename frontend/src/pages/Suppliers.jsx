// src/pages/Suppliers.jsx - COMPLETE WITH PDF & EXCEL DOWNLOAD (Table Only)
import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Building2,
  Package,
  Truck,
  Clock,
  DollarSign,
  Eye,
  X,
  Save,
  Star,
  FileText,
  RefreshCw,
  ShoppingCart,
  Minus,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  PackageOpen,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Link2,
  History,
  FileSpreadsheet,
  Download
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [supplierData, setSupplierData] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    total_products: 0,
    total_orders: 0,
    total_spent: 0,
    category_breakdown: {}
  });

  // Orders states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderViewMode, setOrderViewMode] = useState('table');
  const [orderFilterStatus, setOrderFilterStatus] = useState('All');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [showOrderActions, setShowOrderActions] = useState(null);
  const [orderStatusHistory, setOrderStatusHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Order form state - Updated for manual product entry
  const [orderForm, setOrderForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    notes: ''
  });
  
  // Manual product entry fields
  const [productNameInput, setProductNameInput] = useState('');
  const [productPriceInput, setProductPriceInput] = useState('');
  const [productQuantityInput, setProductQuantityInput] = useState(1);

  // Form state - Removed item_name
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    status: 'Active',
    rating: 0,
    notes: ''
  });

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedItemType !== 'All') params.append('item_name', selectedItemType);

      const response = await fetch(`${API_BASE_URL}/suppliers?${params.toString()}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSupplierData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load suppliers');
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Failed to load suppliers. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch purchase orders
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const params = new URLSearchParams();
      if (orderFilterStatus !== 'All') params.append('status', orderFilterStatus);

      const response = await fetch(`${API_BASE_URL}/purchase-orders?${params.toString()}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        let filteredData = data;
        if (orderSearchTerm) {
          filteredData = data.filter(order =>
            order.order_number?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
            order.supplier_name?.toLowerCase().includes(orderSearchTerm.toLowerCase())
          );
        }
        setOrders(filteredData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please check server connection.');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch a single order details
  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchase-orders/${orderId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
        setShowOrderDetailModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    }
  };

  // Fetch order status history
  const fetchOrderHistory = async (orderId) => {
    try {
      setHistoryLoading(true);
      const response = await fetch(`${API_BASE_URL}/purchase-orders/${orderId}/history`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOrderStatusHistory(data);
        const order = orders.find(o => o.id === orderId);
        if (order) {
          setSelectedOrderForHistory(order);
        }
        setShowHistoryModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load order history');
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
      setError('Failed to load order history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ============ DOWNLOAD FUNCTIONS ============
  
  // Download order as PDF
  const downloadOrderPDF = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchase-orders/${orderId}/export/pdf`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const order = orders.find(o => o.id === orderId);
        a.download = `PO-${order?.order_number || orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setSuccess('PDF downloaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to download PDF');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download PDF');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Download order as Excel
  const downloadOrderExcel = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchase-orders/${orderId}/export/excel`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const order = orders.find(o => o.id === orderId);
        a.download = `PO-${order?.order_number || orderId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setSuccess('Excel downloaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to download Excel');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setError('Failed to download Excel');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Fetch product names from inventory
  const fetchProductNames = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const names = data
          .map(product => product.name)
          .filter(name => name)
          .sort();
        const uniqueNames = [...new Set(names)];
        setProductNames(uniqueNames);
      }
    } catch (error) {
      console.error('Error fetching product names:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProductNames();
    fetchStats();
    fetchOrders();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers();
      fetchStats();
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, selectedItemType, orderFilterStatus, orderSearchTerm]);

  // Calculate order totals when items change - Removed tax
  useEffect(() => {
    const subtotal = orderForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - orderForm.discount;
    setOrderForm(prev => ({
      ...prev,
      subtotal,
      total
    }));
  }, [orderForm.items, orderForm.discount]);

  // Handle form submit - Add Supplier (Updated - removed item_name)
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Supplier added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchSuppliers();
        fetchStats();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add supplier');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      setError('Network error. Please check server connection.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handle form submit - Update Supplier (Updated - removed item_name)
  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/${selectedSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Supplier updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchSuppliers();
        fetchStats();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update supplier');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      setError('Network error. Please check server connection.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handle delete supplier
  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to deactivate this supplier?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/suppliers/${supplierId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          setSuccess('Supplier deactivated successfully!');
          fetchSuppliers();
          fetchStats();
          setTimeout(() => setSuccess(''), 5000);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to deactivate supplier');
          setTimeout(() => setError(''), 5000);
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
        setError('Network error. Please check server connection.');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // Handle update order status - Uses PATCH endpoint
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchase-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || `Order status updated to ${newStatus}`);
        fetchOrders();
        fetchStats();
        setTimeout(() => setSuccess(''), 5000);
        setShowOrderActions(null);
      } else {
        setError(data.error || 'Failed to update order status');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Network error. Please check server connection.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Reset form (Updated - removed item_name)
  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      status: 'Active',
      rating: 0,
      notes: ''
    });
    setSelectedSupplier(null);
  };

  // Reset order form
  const resetOrderForm = () => {
    setOrderForm({
      supplier_id: '',
      order_date: new Date().toISOString().split('T')[0],
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      notes: ''
    });
    setProductNameInput('');
    setProductPriceInput('');
    setProductQuantityInput(1);
  };

  // Add product to order - Manual entry
  const addProductToOrder = () => {
    if (!productNameInput.trim()) {
      setError('Please enter a product name');
      return;
    }
    if (!productPriceInput || parseFloat(productPriceInput) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    if (!productQuantityInput || productQuantityInput < 1) {
      setError('Please enter a valid quantity');
      return;
    }

    const newItem = {
      id: Date.now(), // Temporary ID for the item
      product_name: productNameInput.trim(),
      price: parseFloat(productPriceInput),
      quantity: parseInt(productQuantityInput)
    };

    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setProductNameInput('');
    setProductPriceInput('');
    setProductQuantityInput(1);
    setError('');
  };

  // Remove item from order
  const removeItemFromOrder = (itemId) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Update order item quantity
  const updateOrderItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    }));
  };

  // Update order item price
  const updateOrderItemPrice = (itemId, newPrice) => {
    if (newPrice < 0) return;
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, price: newPrice }
          : item
      )
    }));
  };

  // Submit order - Uses POST endpoint (Updated - removed tax, supports manual entry)
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (orderForm.items.length === 0) {
      setError('Please add at least one product to the order');
      return;
    }

    if (!orderForm.supplier_id) {
      setError('Please select a supplier');
      return;
    }

    try {
      const orderData = {
        supplier_id: parseInt(orderForm.supplier_id),
        order_date: orderForm.order_date,
        items: orderForm.items.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price
        })),
        tax: 0,
        discount: orderForm.discount || 0,
        notes: orderForm.notes
      };

      console.log('Sending order data:', orderData);

      const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccess(`Purchase Order #${responseData.order_number || responseData.id} created successfully!`);
        setShowOrderModal(false);
        resetOrderForm();
        fetchSuppliers();
        fetchStats();
        fetchOrders();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(responseData.error || 'Failed to create order');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Network error. Please check server connection.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handle edit (Updated - removed item_name)
  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country || '',
      postal_code: supplier.postal_code || '',
      status: supplier.status,
      rating: supplier.rating || 0,
      notes: supplier.notes || ''
    });
    setShowEditModal(true);
  };

  // Handle view
  const handleView = (supplier) => {
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  // Handle open order modal for a specific supplier
  const handleOpenOrderModal = (supplier) => {
    setSelectedSupplier(supplier);
    setOrderForm(prev => ({
      ...prev,
      supplier_id: supplier.id
    }));
    setShowOrderModal(true);
  };

  // Handle view order details
  const handleViewOrder = (order) => {
    fetchOrderDetails(order.id);
  };

  // Get order status color
  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'Received': return 'bg-green-100 text-green-700 border-green-200';
      case 'Ordered': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'Received': return <CheckCircle className="w-4 h-4" />;
      case 'Ordered': return <Truck className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <PackageOpen className="w-4 h-4" />;
    }
  };

  // Get available status transitions
  const getAvailableStatusTransitions = (currentStatus) => {
    switch (currentStatus) {
      case 'Pending':
        return ['Ordered', 'Cancelled'];
      case 'Ordered':
        return ['Received', 'Cancelled', 'Pending'];
      case 'Received':
        return ['Pending', 'Ordered'];
      case 'Cancelled':
        return ['Pending', 'Ordered'];
      default:
        return [];
    }
  };

  const statuses = ['All', 'Active', 'Inactive', 'Pending'];
  const orderStatuses = ['All', 'Pending', 'Ordered', 'Received', 'Cancelled'];

  const getStatusDot = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Inactive': return 'bg-gray-400';
      case 'Pending': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-xs">
            {i < fullStars ? '★' : (i === fullStars && hasHalfStar ? '★' : '☆')}
          </span>
        ))}
        <span className="ml-1 text-gray-500 text-xs">({rating.toFixed(1)})</span>
      </div>
    );
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return `KES ${amount.toFixed(2)}`;
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      {/* Header with Both Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Supplier Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all your suppliers and purchase orders</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              resetOrderForm();
              setShowOrderModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Building2 className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>All suppliers</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Active</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Truck className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% of total</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Products</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Package className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total_products}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>From all suppliers</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Orders</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>All time orders</span>
          </div>
        </div>
      </div>

      {/* ============ ORDERS SECTION (TOP) ============ */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              Purchase Orders
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Track and manage all your purchase orders</p>
          </div>
        </div>

        {/* Order Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative">
            <select
              value={orderFilterStatus}
              onChange={(e) => setOrderFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white cursor-pointer hover:border-gray-300 transition-colors"
            >
              {orderStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by number or supplier..."
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
          <button
            onClick={() => fetchOrders()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Order Table View with Changeable Status and Download */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-4 text-gray-500">Loading orders...</p>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const availableTransitions = getAvailableStatusTransitions(order.status);
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{order.order_number}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{order.supplier_name || 'Unknown Supplier'}</td>
                        <td className="py-3 px-4 text-gray-600">{new Date(order.order_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-gray-600">{order.items?.length || 0}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">KES {order.total?.toFixed(2) || '0.00'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(order.status)}`}>
                              {getOrderStatusIcon(order.status)}
                              {order.status}
                            </span>
                            {availableTransitions.length > 0 && (
                              <div className="relative">
                                <button
                                  onClick={() => setShowOrderActions(showOrderActions === order.id ? null : order.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-0.5 bg-blue-50 rounded flex items-center gap-1"
                                >
                                  <span>Change</span>
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                {showOrderActions === order.id && (
                                  <div className="absolute left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                                    {availableTransitions.map((status) => (
                                      <button
                                        key={status}
                                        onClick={() => handleUpdateOrderStatus(order.id, status)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      >
                                        {status === 'Ordered' && <Truck className="w-4 h-4 text-blue-500" />}
                                        {status === 'Received' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        {status === 'Cancelled' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                        Mark as {status}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => downloadOrderPDF(order.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <FileText className="w-4 h-4 text-red-500 hover:text-red-700" />
                            </button>
                            <button
                              onClick={() => downloadOrderExcel(order.id)}
                              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download Excel"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-green-500 hover:text-green-700" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderForHistory(order);
                                fetchOrderHistory(order.id);
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View History"
                            >
                              <History className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                            </button>
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============ SUPPLIERS SECTION (BOTTOM) ============ */}
      <div className="border-t border-gray-200 pt-8">
        {/* Supplier Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-700" />
              Suppliers
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Manage your supplier database</p>
          </div>
        </div>

        {/* Supplier Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers by name or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={selectedItemType}
                onChange={(e) => setSelectedItemType(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="All">All Item Types</option>
                {productNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
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
            <button
              onClick={() => {
                fetchProductNames();
                fetchSuppliers();
                fetchOrders();
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Supplier Table View */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Spent</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Order</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3.5 px-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-4 text-gray-500">Loading suppliers...</p>
                    </td>
                  </tr>
                ) : supplierData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No suppliers found</p>
                    </td>
                  </tr>
                ) : (
                  supplierData.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarColor(supplier.name)} flex items-center justify-center text-white font-semibold text-xs`}>
                            {supplier.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{supplier.name}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{supplier.address || 'No address'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="text-gray-900 text-xs">{supplier.contact_person}</div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <Mail className="w-3 h-3" />
                            <span>{supplier.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <Phone className="w-3 h-3" />
                            <span>{supplier.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{supplier.total_products}</td>
                      <td className="py-3 px-4 text-gray-600">{supplier.total_orders}</td>
                      <td className="py-3 px-4 text-gray-600">KES {supplier.total_spent?.toFixed(0) || '0'}</td>
                      <td className="py-3 px-4 text-gray-600">{supplier.last_order_date ? new Date(supplier.last_order_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-4">{getRatingStars(supplier.rating)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(supplier.status)}`}></span>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => handleView(supplier)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                          </button>
                          <button onClick={() => handleEdit(supplier)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                          </button>
                          <button onClick={() => handleOpenOrderModal(supplier)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Create Order">
                            <ShoppingCart className="w-4 h-4 text-gray-400 hover:text-green-600" />
                          </button>
                          <button onClick={() => handleDeleteSupplier(supplier.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Deactivate">
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
      </div>

      {/* ============ MODALS ============ */}

      {/* Add Supplier Modal - Updated: Removed item_type field */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Add New Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Supplier name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                  <input type="text" required value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contact person name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone number" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Street address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="City" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="State" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Country" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input type="text" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Postal code" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <input type="number" min="0" max="5" step="0.1" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Additional notes about this supplier..." />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Save className="w-4 h-4" />
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal - Updated: Removed item_type field */}
      {showEditModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Edit Supplier</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                  <input type="text" required value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input type="text" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <input type="number" min="0" max="5" step="0.1" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Save className="w-4 h-4" />
                  Update Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Supplier Modal - Updated: Removed item_type display */}
      {showViewModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Supplier Details</h3>
              <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getAvatarColor(selectedSupplier.name)} flex items-center justify-center text-white font-semibold text-2xl`}>
                  {selectedSupplier.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedSupplier.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(selectedSupplier.status)}`}></span>
                      {selectedSupplier.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="font-medium text-gray-900">{selectedSupplier.contact_person}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{selectedSupplier.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{selectedSupplier.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-medium text-gray-900">{getRatingStars(selectedSupplier.rating)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="font-medium text-gray-900">{selectedSupplier.total_products}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="font-medium text-gray-900">{selectedSupplier.total_orders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="font-medium text-gray-900">KES {selectedSupplier.total_spent?.toFixed(0) || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Order</p>
                  <p className="font-medium text-gray-900">{selectedSupplier.last_order_date ? new Date(selectedSupplier.last_order_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">{new Date(selectedSupplier.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {(selectedSupplier.address || selectedSupplier.city || selectedSupplier.country) && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">
                    {selectedSupplier.address && <span>{selectedSupplier.address}<br /></span>}
                    {selectedSupplier.city && <span>{selectedSupplier.city}</span>}
                    {selectedSupplier.state && <span>, {selectedSupplier.state}</span>}
                    {selectedSupplier.postal_code && <span> {selectedSupplier.postal_code}</span>}
                    {selectedSupplier.country && <span><br />{selectedSupplier.country}</span>}
                  </p>
                </div>
              )}

              {selectedSupplier.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{selectedSupplier.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Close</button>
                <button onClick={() => { setShowViewModal(false); handleEdit(selectedSupplier); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit Supplier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal - Updated: Manual product entry, removed tax */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Create Purchase Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  {selectedSupplier ? (
                    <input type="text" value={selectedSupplier.name} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700" />
                  ) : (
                    <select
                      value={orderForm.supplier_id}
                      onChange={(e) => setOrderForm({ ...orderForm, supplier_id: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a supplier...</option>
                      {supplierData.filter(s => s.status === 'Active').map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                  <input type="date" required value={orderForm.order_date} onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Manual Product Entry Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={productNameInput}
                      onChange={(e) => setProductNameInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Price"
                      value={productPriceInput}
                      onChange={(e) => setProductPriceInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={productQuantityInput}
                      onChange={(e) => setProductQuantityInput(parseInt(e.target.value) || 1)}
                      className="w-16 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                    <button
                      type="button"
                      onClick={addProductToOrder}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Order Items</h4>
                {orderForm.items.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No items added to order</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderForm.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateOrderItemQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button type="button" onClick={() => updateOrderItemQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                              <PlusIcon className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateOrderItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                          />
                          <span className="font-medium text-gray-900">KES {(item.price * item.quantity).toFixed(2)}</span>
                          <button type="button" onClick={() => removeItemFromOrder(item.id)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                            <TrashIcon className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="space-y-2 max-w-sm ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">KES {orderForm.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <input type="number" min="0" value={orderForm.discount} onChange={(e) => setOrderForm({ ...orderForm, discount: parseFloat(e.target.value) || 0 })} className="w-24 px-2 py-1 border border-gray-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">KES {orderForm.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="Add any notes about this order..." />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg">
                  <Save className="w-4 h-4" />
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Status History Modal */}
      {showHistoryModal && selectedOrderForHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600" />
                Order History - {selectedOrderForHistory.order_number}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading history...</p>
                </div>
              ) : orderStatusHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No status history found for this order</p>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {orderStatusHistory.map((history, index) => (
                      <li key={history.id}>
                        <div className="relative pb-8">
                          {index < orderStatusHistory.length - 1 && (
                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          )}
                          <div className="relative flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
                              {history.new_status === 'Received' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : history.new_status === 'Cancelled' ? (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              ) : history.new_status === 'Ordered' ? (
                                <Truck className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOrderStatusColor(history.new_status)}`}>
                                  {getOrderStatusIcon(history.new_status)}
                                  {history.new_status}
                                </span>
                                {history.old_status && (
                                  <>
                                    <span className="text-gray-400 text-xs">from</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOrderStatusColor(history.old_status)}`}>
                                      {getOrderStatusIcon(history.old_status)}
                                      {history.old_status}
                                    </span>
                                  </>
                                )}
                              </div>
                              {history.notes && (
                                <p className="mt-1 text-sm text-gray-600">{history.notes}</p>
                              )}
                              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {history.changed_by ? `User ${history.changed_by}` : 'System'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(history.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail View Modal with Download Buttons */}
      {showOrderDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Order Details - {selectedOrder.order_number}
              </h3>
              <button onClick={() => {
                setShowOrderDetailModal(false);
                setSelectedOrder(null);
              }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Order Summary - Removed tax row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Supplier</p>
                  <p className="font-medium text-gray-900">{selectedOrder.supplier_name || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Order Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedOrder.order_date)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(selectedOrder.status)}`}>
                    {getOrderStatusIcon(selectedOrder.status)}
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedOrder.subtotal)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Discount</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedOrder.discount)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 col-span-2 md:col-span-3">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedOrder.total)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-gray-900">{item.product_name}</td>
                            <td className="py-2.5 px-4 text-right text-gray-700">{item.quantity}</td>
                            <td className="py-2.5 px-4 text-right text-gray-700">{formatCurrency(item.price)}</td>
                            <td className="py-2.5 px-4 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-8 text-gray-500">No items in this order</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan="2" className="py-3 px-4"></td>
                        <td className="py-3 px-4 text-right font-medium text-gray-700">Subtotal:</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(selectedOrder.subtotal)}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan="2" className="py-2 px-4"></td>
                        <td className="py-2 px-4 text-right font-medium text-gray-700">Discount:</td>
                        <td className="py-2 px-4 text-right font-medium text-gray-900">-{formatCurrency(selectedOrder.discount)}</td>
                      </tr>
                      <tr className="bg-blue-50">
                        <td colSpan="2" className="py-3 px-4"></td>
                        <td className="py-3 px-4 text-right font-bold text-blue-700">Total:</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-700">{formatCurrency(selectedOrder.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700 font-medium">Notes:</p>
                  <p className="text-sm text-yellow-800">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status Change Actions */}
              {getAvailableStatusTransitions(selectedOrder.status).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Update Order Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableStatusTransitions(selectedOrder.status).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          handleUpdateOrderStatus(selectedOrder.id, status);
                          setShowOrderDetailModal(false);
                          setSelectedOrder(null);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${status === 'Ordered' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                            status === 'Received' ? 'bg-green-600 hover:bg-green-700 text-white' :
                              status === 'Cancelled' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                      >
                        {status === 'Ordered' && <Truck className="w-4 h-4" />}
                        {status === 'Received' && <CheckCircle className="w-4 h-4" />}
                        {status === 'Cancelled' && <AlertCircle className="w-4 h-4" />}
                        Mark as {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer with Download Buttons */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="flex gap-2">
                  {/* PDF Download Button */}
                  <button
                    onClick={() => downloadOrderPDF(selectedOrder.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Export PDF
                  </button>
                  
                  {/* Excel Download Button */}
                  <button
                    onClick={() => downloadOrderExcel(selectedOrder.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedOrderForHistory(selectedOrder);
                      setShowOrderDetailModal(false);
                      fetchOrderHistory(selectedOrder.id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <History className="w-4 h-4" />
                    View History
                  </button>
                  <button
                    onClick={() => {
                      setShowOrderDetailModal(false);
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
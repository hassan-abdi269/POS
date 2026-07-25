import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  ChevronDown,
  ShoppingBag,
  Package,
  AlertCircle,
  Minus,
  Plus as PlusIcon,
  Edit,
  Trash2,
  MoreVertical,
  X,
  Save,
  Upload,
  Image as ImageIcon,
  LayoutGrid,
  List
} from 'lucide-react';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [viewMode, setViewMode] = useState('cards');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    stock_limit: '50',
    image_url: ''
  });

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setInventoryData(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle stock update with automatic subtraction and status change
  const updateProductStock = async (productId, change) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity: change }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the product in the local state
        setInventoryData(prev => 
          prev.map(p => p.id === productId ? data.product : p)
        );
        
        // Get the product name for messages
        const product = inventoryData.find(p => p.id === productId);
        const productName = product ? product.name : 'Product';
        
        // Create status-specific messages
        let statusMessage = '';
        
        if (data.product.status === 'In Stock') {
          statusMessage = `✅ ${productName}: Stock is healthy (${data.product.stock} units available - Limit: ${data.product.stock_limit})`;
        } else if (data.product.status === 'Low Stock') {
          statusMessage = `⚠️ ${productName}: Running low on stock (${data.product.stock} units remaining - Limit: ${data.product.stock_limit})`;
        } else if (data.product.status === 'Out of Stock') {
          statusMessage = `🚨 ${productName}: OUT OF STOCK! (0 units available)`;
        }
        
        // Show alert only on status change or specific thresholds
        if (data.alerts && data.alerts.length > 0) {
          // Use the server alerts with colors
          data.alerts.forEach(alert => {
            let colorInfo = {};
            if (alert.includes('OUT OF STOCK')) {
              colorInfo = { bg: 'bg-red-50', border: 'border-red-500', icon: 'text-red-500', type: 'danger' };
            } else if (alert.includes('running low')) {
              colorInfo = { bg: 'bg-blue-50', border: 'border-blue-500', icon: 'text-blue-500', type: 'warning' };
            } else {
              colorInfo = { bg: 'bg-green-50', border: 'border-green-500', icon: 'text-green-500', type: 'success' };
            }
            setAlerts(prev => [...prev, { 
              message: alert, 
              type: colorInfo.type,
              bgColor: colorInfo.bg,
              borderColor: colorInfo.border,
              iconColor: colorInfo.icon
            }]);
          });
          // Auto-dismiss alerts after 30 minutes
          setTimeout(() => {
            setAlerts(prev => prev.filter(a => !data.alerts.includes(a.message)));
          }, 1800000);
        } else {
          // Show status message with appropriate color
          setSuccess(statusMessage);
          // Auto-dismiss success message after 30 minutes
          setTimeout(() => {
            setSuccess('');
          }, 1800000);
        }
        
        // Reset quantity display for this product
        setQuantities(prev => ({ ...prev, [productId]: 0 }));
        
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update stock');
        return false;
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      setError('Network error. Please check server connection.');
      return false;
    }
  };

  // Handle quantity change with automatic stock update
  const handleQuantityChange = async (productId, change) => {
    // Find the product to check current stock
    const product = inventoryData.find(p => p.id === productId);
    if (!product) return;
    
    // Calculate new quantity
    const newStock = product.stock + change;
    
    // Prevent negative stock
    if (newStock < 0) {
      setError(`Cannot reduce stock below 0 for ${product.name}`);
      return;
    }
    
    // Update the quantity display
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change)
    }));
    
    // Call the API to update stock
    await updateProductStock(productId, change);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'In Stock': return 'bg-green-100 text-green-700';
      case 'Low Stock': return 'bg-blue-100 text-blue-700';
      case 'Out of Stock': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Low Stock': return <AlertCircle className="w-3 h-3" />;
      case 'Out of Stock': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  // Stats
  const totalProducts = inventoryData.length;
  const inStock = inventoryData.filter(item => item.status === 'In Stock').length;
  const lowStock = inventoryData.filter(item => item.status === 'Low Stock').length;
  const outOfStock = inventoryData.filter(item => item.status === 'Out of Stock').length;

  const filteredItems = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost || 0),
      stock: parseInt(formData.stock),
      stock_limit: parseInt(formData.stock_limit)
    };

    try {
      let imageUrl = formData.image_url;
      
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append('image', imageFile);
        
        const uploadResponse = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataImage
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.image_url;
        }
      }
      
      productData.image_url = imageUrl;

      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct.id}`
        : 'http://localhost:5000/api/products';
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingProduct) {
          setInventoryData(prev => prev.map(p => p.id === data.id ? data : p));
        } else {
          setInventoryData(prev => [...prev, data]);
        }
        setSuccess(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
        setShowModal(false);
        setEditingProduct(null);
        setImagePreview(null);
        setImageFile(null);
        setFormData({
          name: '',
          sku: '',
          description: '',
          price: '',
          cost: '',
          stock: '',
          stock_limit: '50',
          image_url: ''
        });
        fetchProducts();
        setTimeout(() => {
          setSuccess('');
        }, 1800000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Network error. Please check if the server is running.');
    }
  };

  // Handle edit
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost?.toString() || '',
      stock: product.stock.toString(),
      stock_limit: product.stock_limit?.toString() || '50',
      image_url: product.image_url || ''
    });
    if (product.image_url) {
      setImagePreview(product.image_url);
    }
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (response.ok) {
          setInventoryData(prev => prev.filter(p => p.id !== productId));
          setSuccess('Product deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Network error.');
      }
    }
  };

  // Auto-dismiss alerts after 30 minutes
  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => {
        setAlerts([]);
      }, 1800000);
      return () => clearTimeout(timer);
    }
  }, [alerts]);

  return (
    <div>
      {/* Alerts Banner - Color coded by status */}
      {alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {alerts.map((alert, index) => (
            <div 
              key={index} 
              className={`${alert.bgColor} border-l-4 ${alert.borderColor} rounded-lg p-4 shadow-sm animate-pulse`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-5 h-5 ${alert.iconColor}`} />
                  <p className={`font-medium ${alert.iconColor}`}>{alert.message}</p>
                </div>
                <button 
                  onClick={() => setAlerts(prev => prev.filter((_, i) => i !== index))}
                  className={`${alert.iconColor} hover:opacity-70`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Success Messages */}
      {success && (
        <div className={`mb-4 rounded-lg p-4 shadow-sm ${
          success.includes('healthy') ? 'bg-green-50 border border-green-200' :
          success.includes('Running low') ? 'bg-blue-50 border border-blue-200' :
          success.includes('OUT OF STOCK') ? 'bg-red-50 border border-red-200' :
          'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 ${
                success.includes('healthy') ? 'text-green-500' :
                success.includes('Running low') ? 'text-blue-500' :
                success.includes('OUT OF STOCK') ? 'text-red-500' :
                'text-green-500'
              }`} />
              <p className={`font-medium ${
                success.includes('healthy') ? 'text-green-700' :
                success.includes('Running low') ? 'text-blue-700' :
                success.includes('OUT OF STOCK') ? 'text-red-700' :
                'text-green-700'
              }`}>{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Inventory Management</h2>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
          </div>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setImagePreview(null);
              setImageFile(null);
              setError('');
              setSuccess('');
              setFormData({
                name: '',
                sku: '',
                description: '',
                price: '',
                cost: '',
                stock: '',
                stock_limit: '50',
                image_url: ''
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">In Stock</p>
          <p className="text-2xl font-bold text-green-600">{inStock}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-2xl font-bold text-blue-600">{lowStock}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
        />
      </div>

      {/* Products View */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading products...</p>
        </div>
      ) : (
        <>
          {/* Card View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group ${
                    item.status === 'Out of Stock' ? 'border-red-300 bg-red-50/30' : 
                    item.status === 'Low Stock' ? 'border-blue-300 bg-blue-50/30' : 
                    'border-green-300 bg-green-50/30'
                  }`}
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <ImageIcon className="w-12 h-12" />
                        <span className="text-sm mt-2">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800/50 text-white backdrop-blur-sm">
                        {item.sku}
                      </span>
                    </div>
                    {item.status === 'Out of Stock' && (
                      <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg transform rotate-[-15deg]">
                          OUT OF STOCK
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{item.name}</h4>
                      <span className="text-sm font-bold text-blue-600">KES {item.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                        Limit: {item.stock_limit} units
                      </span>
                      <span className={`text-xs font-medium ${
                        item.stock >= item.stock_limit ? 'text-green-600' : 
                        item.stock > 0 ? 'text-blue-600' : 
                        'text-red-600'
                      }`}>
                        Stock: {item.stock} units
                      </span>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={item.stock <= 0}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            item.stock <= 0
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <Minus className={`w-4 h-4 ${item.stock > 0 ? 'text-gray-600' : 'text-gray-300'}`} />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900">
                          {quantities[item.id] || 0}
                        </span>
                        <button 
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          <PlusIcon className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Limit</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-gray-500">
                          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium">No products found</p>
                          <p className="text-sm">Try adjusting your search</p>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.image_url ? (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <span className="font-medium text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.sku}</td>
                          <td className="py-3 px-4 font-medium text-blue-600">KES {item.price.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              item.stock >= item.stock_limit ? 'text-green-600' : 
                              item.stock > 0 ? 'text-blue-600' : 
                              'text-red-600'
                            }`}>
                              {item.stock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.stock_limit}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {/* Quantity Controls in Table */}
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleQuantityChange(item.id, -1)}
                                  disabled={item.stock <= 0}
                                  className={`p-1 rounded border transition-colors ${
                                    item.stock <= 0
                                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                  }`}
                                >
                                  <Minus className={`w-3 h-3 ${item.stock > 0 ? 'text-gray-600' : 'text-gray-300'}`} />
                                </button>
                                <span className="w-6 text-center font-medium text-gray-900 text-xs">
                                  {quantities[item.id] || 0}
                                </span>
                                <button 
                                  onClick={() => handleQuantityChange(item.id, 1)}
                                  className="p-1 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                >
                                  <PlusIcon className="w-3 h-3 text-gray-600" />
                                </button>
                              </div>
                              <button 
                                onClick={() => handleEdit(item)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
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
          )}
        </>
      )}

      {filteredItems.length === 0 && !loading && viewMode === 'cards' && (
        <div className="text-center py-12 text-gray-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">Try adjusting your search</p>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">Upload Image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter SKU"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (KES) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <p className={`text-xs mt-1 ${
                    parseInt(formData.stock) >= parseInt(formData.stock_limit) ? 'text-green-600' : 
                    parseInt(formData.stock) > 0 ? 'text-blue-600' : 
                    'text-red-600'
                  }`}>
                    Status: {parseInt(formData.stock) >= parseInt(formData.stock_limit) ? '✅ In Stock' : 
                             parseInt(formData.stock) > 0 ? '⚠️ Low Stock' : 
                             '🚫 Out of Stock'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Limit *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.stock_limit}
                    onChange={(e) => setFormData({...formData, stock_limit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum stock threshold"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    When stock falls below this number, it shows "Low Stock"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
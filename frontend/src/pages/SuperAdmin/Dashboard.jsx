// src/pages/SuperAdmin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [shops, setShops] = useState([]);
  const [stats, setStats] = useState({
    totalShops: 0,
    activeShops: 0,
    inactiveShops: 0,
    totalRevenue: 0,
    growth: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddShop, setShowAddShop] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const mockShops = [
      {
        id: 1,
        name: 'Main Street Store',
        email: 'main@store.com',
        phone: '+1234567890',
        status: 'active',
        createdAt: '2024-01-15',
        address: '123 Main St, City',
        subscription: 'premium',
        owner: 'John Doe',
        revenue: 15240.00
      },
      {
        id: 2,
        name: 'Downtown Boutique',
        email: 'downtown@boutique.com',
        phone: '+1234567891',
        status: 'inactive',
        createdAt: '2024-02-20',
        address: '456 Downtown Ave, City',
        subscription: 'basic',
        owner: 'Jane Smith',
        revenue: 8940.00
      },
      {
        id: 3,
        name: 'Mall Kiosk',
        email: 'mall@kiosk.com',
        phone: '+1234567892',
        status: 'active',
        createdAt: '2024-03-10',
        address: '789 Mall Rd, City',
        subscription: 'standard',
        owner: 'Bob Johnson',
        revenue: 5160.00
      },
      {
        id: 4,
        name: 'Tech Hub Store',
        email: 'tech@hub.com',
        phone: '+1234567893',
        status: 'active',
        createdAt: '2024-04-05',
        address: '321 Tech Park, City',
        subscription: 'premium',
        owner: 'Alice Williams',
        revenue: 12890.50
      },
      {
        id: 5,
        name: 'Fashion Express',
        email: 'fashion@express.com',
        phone: '+1234567894',
        status: 'inactive',
        createdAt: '2024-05-12',
        address: '654 Fashion Blvd, City',
        subscription: 'standard',
        owner: 'Charlie Brown',
        revenue: 3000.00
      }
    ];
    setShops(mockShops);
    
    const active = mockShops.filter(s => s.status === 'active').length;
    const inactive = mockShops.filter(s => s.status === 'inactive').length;
    const totalRevenue = mockShops.reduce((acc, shop) => acc + shop.revenue, 0);
    
    setStats({
      totalShops: mockShops.length,
      activeShops: active,
      inactiveShops: inactive,
      totalRevenue: totalRevenue,
      growth: 15.3
    });
  }, []);

  const handleStatusToggle = (shopId) => {
    setShops(shops.map(shop => 
      shop.id === shopId 
        ? { ...shop, status: shop.status === 'active' ? 'inactive' : 'active' }
        : shop
    ));
    const updatedShops = shops.map(shop => 
      shop.id === shopId 
        ? { ...shop, status: shop.status === 'active' ? 'inactive' : 'active' }
        : shop
    );
    const active = updatedShops.filter(s => s.status === 'active').length;
    const inactive = updatedShops.filter(s => s.status === 'inactive').length;
    setStats({
      ...stats,
      activeShops: active,
      inactiveShops: inactive
    });
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
        <p className="text-gray-600">Overview of all shops and their performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Shops</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalShops}</p>
            </div>
            <Store className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Shops</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeShops}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Shops</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactiveShops}</p>
            </div>
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Growth</p>
              <p className="text-2xl font-bold text-indigo-600">+{stats.growth}%</p>
            </div>
            <TrendingUp className="h-10 w-10 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search shops..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/superadmin/shops')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            View All Shops
          </button>
          <button
            onClick={() => navigate('/superadmin/payments')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Payments
          </button>
          <button
            onClick={() => setShowAddShop(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Register New Shop
          </button>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{shop.name}</div>
                      <div className="text-sm text-gray-500">ID: #{shop.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{shop.email}</div>
                    <div className="text-sm text-gray-500">{shop.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{shop.owner}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleStatusToggle(shop.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        shop.status === 'active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors`}
                    >
                      {shop.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      ${shop.revenue.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedShop(shop)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button className="text-green-600 hover:text-green-800 transition-colors">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-800 transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Shop Modal */}
      {showAddShop && (
        <AddShopModal onClose={() => setShowAddShop(false)} />
      )}

      {/* Shop Details Modal */}
      {selectedShop && (
        <ShopDetailsModal shop={selectedShop} onClose={() => setSelectedShop(null)} />
      )}
    </div>
  );
};

// Add Shop Modal Component
const AddShopModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    owner: '',
    subscription: 'basic'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('New shop data:', formData);
    alert('Shop registered successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Register New Shop</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.owner}
                onChange={(e) => setFormData({...formData, owner: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.subscription}
                onChange={(e) => setFormData({...formData, subscription: e.target.value})}
              >
                <option value="basic">Basic - $99/month</option>
                <option value="standard">Standard - $199/month</option>
                <option value="premium">Premium - $299/month</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Register Shop
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Shop Details Modal Component
const ShopDetailsModal = ({ shop, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">{shop.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Shop ID</p>
            <p className="font-medium">#{shop.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className={`font-medium ${shop.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
              {shop.status}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{shop.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{shop.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">{shop.address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Owner</p>
            <p className="font-medium">{shop.owner}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Subscription</p>
            <p className="font-medium capitalize">{shop.subscription}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="font-medium">${shop.revenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">{shop.createdAt}</p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Edit Shop
          </button>
          <button className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">
            Delete Shop
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
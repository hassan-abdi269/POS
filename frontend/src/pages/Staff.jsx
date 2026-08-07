// src/pages/Staff.jsx

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
  UserCog,
  Users,
  Clock,
  Calendar,
  Award,
  Shield,
  UserCheck,
  UserX,
  Eye,
  X,
  Save,
  Building2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { staffService, authService } from '../service/api';

const Staff = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Data states
  const [staffData, setStaffData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    on_leave: 0,
    inactive: 0,
    total_tasks: 0,
    total_salary: 0,
    average_salary: 0,
    role_breakdown: {},
    department_breakdown: {}
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    role: 'Cashier',
    department: 'Sales',
    join_date: new Date().toISOString().split('T')[0],
    salary: '',
    status: 'Active',
    performance: 'Good',
    tasks: 0,
    notes: ''
  });

  // Email validation state
  const [emailError, setEmailError] = useState('');

  // Get current shop ID
  const getShopId = () => {
    const user = authService.getCurrentUser();
    return user?.shopId;
  };

  // Check if email exists in current shop
  const checkEmailExistsInShop = async (email, excludeId = null) => {
    if (!email) return false;
    
    const shopId = getShopId();
    if (!shopId) return false;
    
    try {
      const staff = await staffService.getAllStaff(shopId);
      return staff.some(s => 
        s.email.toLowerCase() === email.toLowerCase() &&
        (excludeId === null || s.id !== excludeId)
      );
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Validate email in real-time
  const validateEmail = async (email) => {
    if (!email) {
      setEmailError('');
      return;
    }
    
    const exists = await checkEmailExistsInShop(email);
    setEmailError(exists ? 'This email is already registered in this shop' : '');
    return !exists;
  };

  // Fetch staff
  const fetchStaff = async () => {
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
      if (selectedRole !== 'All') params.role = selectedRole;

      const data = await staffService.getAllStaff(shopId, params);
      setStaffData(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError(error.response?.data?.error || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const shopId = getShopId();
      if (!shopId) return;

      // Get all staff to calculate stats
      const staff = await staffService.getAllStaff(shopId);
      
      const total = staff.length;
      const active = staff.filter(s => s.status === 'Active' || s.status === 'active').length;
      const on_leave = staff.filter(s => s.status === 'On Leave' || s.status === 'on_leave').length;
      const inactive = staff.filter(s => s.status === 'Inactive' || s.status === 'inactive').length;
      const total_tasks = staff.reduce((sum, s) => sum + (s.tasks || 0), 0);
      const total_salary = staff.reduce((sum, s) => sum + (s.salary || 0), 0);
      const average_salary = total > 0 ? total_salary / total : 0;
      
      // Role breakdown
      const role_breakdown = {};
      staff.forEach(s => {
        const role = s.role || 'Unknown';
        role_breakdown[role] = (role_breakdown[role] || 0) + 1;
      });
      
      // Department breakdown
      const department_breakdown = {};
      staff.forEach(s => {
        const dept = s.department || 'Unknown';
        department_breakdown[dept] = (department_breakdown[dept] || 0) + 1;
      });

      setStats({
        total,
        active,
        on_leave,
        inactive,
        total_tasks,
        total_salary,
        average_salary,
        role_breakdown,
        department_breakdown
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchStats();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaff();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, selectedRole]);

  // Handle form submit - Add Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const shopId = getShopId();
    if (!shopId) {
      setError('Shop not found. Please login again.');
      return;
    }

    // Check if email already exists in this shop
    const emailExists = await checkEmailExistsInShop(formData.email);
    if (emailExists) {
      setError(`Email ${formData.email} is already registered in this shop. Please use a different email.`);
      return;
    }

    try {
      const data = {
        ...formData,
        salary: parseFloat(formData.salary),
        tasks: parseInt(formData.tasks) || 0
      };
      
      const result = await staffService.createStaff(shopId, data);
      setSuccess(`Staff member ${result.first_name} ${result.last_name} added successfully!`);
      setShowAddModal(false);
      resetForm();
      await fetchStaff();
      await fetchStats();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error adding staff:', error);
      if (error.message && error.message.includes('already registered in this shop')) {
        setError('This email is already registered in this shop. Please use a different email address.');
      } else {
        setError(error.response?.data?.error || 'Failed to add staff');
      }
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handle form submit - Update Staff
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const shopId = getShopId();
    if (!shopId) {
      setError('Shop not found. Please login again.');
      return;
    }

    // Check if email already exists in this shop (excluding current staff)
    const emailExists = await checkEmailExistsInShop(formData.email, selectedStaff.id);
    if (emailExists) {
      setError(`Email ${formData.email} is already registered in this shop. Please use a different email.`);
      return;
    }

    try {
      const data = {
        ...formData,
        salary: parseFloat(formData.salary),
        tasks: parseInt(formData.tasks) || 0
      };
      
      const result = await staffService.updateStaff(shopId, selectedStaff.id, data);
      setSuccess(`Staff member ${result.first_name} ${result.last_name} updated successfully!`);
      setShowEditModal(false);
      resetForm();
      await fetchStaff();
      await fetchStats();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error updating staff:', error);
      if (error.message && error.message.includes('already registered in this shop')) {
        setError('This email is already registered in this shop. Please use a different email address.');
      } else {
        setError(error.response?.data?.error || 'Failed to update staff');
      }
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handle delete staff
  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to deactivate this staff member?')) {
      const shopId = getShopId();
      if (!shopId) {
        setError('Shop not found. Please login again.');
        return;
      }

      try {
        await staffService.deleteStaff(shopId, staffId);
        setSuccess('Staff member deactivated successfully!');
        await fetchStaff();
        await fetchStats();
        setTimeout(() => setSuccess(''), 5000);
      } catch (error) {
        console.error('Error deleting staff:', error);
        setError(error.response?.data?.error || 'Failed to deactivate staff');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      role: 'Cashier',
      department: 'Sales',
      join_date: new Date().toISOString().split('T')[0],
      salary: '',
      status: 'Active',
      performance: 'Good',
      tasks: 0,
      notes: ''
    });
    setEmailError('');
    setSelectedStaff(null);
  };

  // Handle edit
  const handleEdit = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      address: staff.address || '',
      city: staff.city || '',
      state: staff.state || '',
      country: staff.country || '',
      postal_code: staff.postal_code || '',
      role: staff.role || 'Cashier',
      department: staff.department || 'Sales',
      join_date: staff.join_date || new Date().toISOString().split('T')[0],
      salary: staff.salary?.toString() || '',
      status: staff.status || 'Active',
      performance: staff.performance || 'Good',
      tasks: staff.tasks || 0,
      notes: staff.notes || ''
    });
    setEmailError('');
    setShowEditModal(true);
  };

  // Handle view
  const handleView = (staff) => {
    setSelectedStaff(staff);
    setShowViewModal(true);
  };

  const roles = ['All', 'Manager', 'Cashier', 'Sales Associate', 'Inventory Specialist', 'IT Support', 'Marketing Specialist'];
  const departments = ['Operations', 'Sales', 'Inventory', 'IT', 'Marketing', 'Finance', 'HR'];
  const statuses = ['All', 'Active', 'On Leave', 'Inactive'];
  const performances = ['All', 'Excellent', 'Good', 'Average', 'Poor'];

  const getStatusDot = (status) => {
    switch(status) {
      case 'Active': return 'bg-green-500';
      case 'On Leave': return 'bg-yellow-500';
      case 'Inactive': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getPerformanceDot = (performance) => {
    switch(performance) {
      case 'Excellent': return 'bg-purple-500';
      case 'Good': return 'bg-blue-500';
      case 'Average': return 'bg-gray-400';
      case 'Poor': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'Manager': return <Shield className="w-3.5 h-3.5" />;
      case 'Cashier': return <UserCheck className="w-3.5 h-3.5" />;
      case 'Sales Associate': return <Users className="w-3.5 h-3.5" />;
      case 'Inventory Specialist': return <Clock className="w-3.5 h-3.5" />;
      default: return <UserCog className="w-3.5 h-3.5" />;
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
          <h2 className="text-xl font-semibold text-gray-900">Staff Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all your staff members</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Staff</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>All staff members</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Active</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserCheck className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% of total</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">On Leave</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.on_leave}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>Currently on leave</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Tasks</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Award className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total_tasks}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>All tasks assigned</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff by name, email or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white cursor-pointer hover:border-gray-300 transition-colors"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
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
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Join Date</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tasks</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3.5 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading staff...</p>
                  </td>
                </tr>
              ) : staffData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No staff members found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                staffData.map((staff) => (
                  <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(staff.first_name + ' ' + staff.last_name)} flex items-center justify-center text-white font-semibold text-xs`}>
                          {staff.first_name?.charAt(0)}{staff.last_name?.charAt(0)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{staff.first_name} {staff.last_name}</span>
                          <div className="text-xs text-gray-400">{staff.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          <Mail className="w-3 h-3" />
                          <span>{staff.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          <Phone className="w-3 h-3" />
                          <span>{staff.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {getRoleIcon(staff.role)}
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{staff.department}</td>
                    <td className="py-3 px-4 text-gray-600">{staff.join_date}</td>
                    <td className="py-3 px-4 text-gray-600">{staff.tasks || 0}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${getPerformanceDot(staff.performance)}`}></span>
                        {staff.performance}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(staff.status)}`}></span>
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-0.5">
                        <button 
                          onClick={() => handleView(staff)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                        </button>
                        <button 
                          onClick={() => handleEdit(staff)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Deactivate"
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

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Add New Staff Member</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      validateEmail(e.target.value);
                    }}
                    className={`w-full px-3 py-2 border ${emailError ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="email@example.com"
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-500">{emailError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Postal code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.filter(r => r !== 'All').map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.join_date}
                    onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary (KES) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Performance
                  </label>
                  <select
                    value={formData.performance}
                    onChange={(e) => setFormData({...formData, performance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Additional notes about this staff member..."
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
                  disabled={!!emailError}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    emailError 
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Edit Staff Member</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      validateEmail(e.target.value);
                    }}
                    className={`w-full px-3 py-2 border ${emailError ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="email@example.com"
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-500">{emailError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Postal code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.filter(r => r !== 'All').map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.join_date}
                    onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary (KES) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Performance
                  </label>
                  <select
                    value={formData.performance}
                    onChange={(e) => setFormData({...formData, performance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Additional notes about this staff member..."
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
                  disabled={!!emailError}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    emailError 
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  Update Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Staff Modal */}
      {showViewModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Staff Details</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(selectedStaff.first_name + ' ' + selectedStaff.last_name)} flex items-center justify-center text-white font-semibold text-2xl`}>
                  {selectedStaff.first_name?.charAt(0)}{selectedStaff.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedStaff.first_name} {selectedStaff.last_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(selectedStaff.status)}`}></span>
                      {selectedStaff.status}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {selectedStaff.employee_id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{selectedStaff.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{selectedStaff.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium text-gray-900">{selectedStaff.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium text-gray-900">{selectedStaff.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="font-medium text-gray-900">{selectedStaff.join_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Salary</p>
                  <p className="font-medium text-gray-900">KES {selectedStaff.salary?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tasks</p>
                  <p className="font-medium text-gray-900">{selectedStaff.tasks || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Performance</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${getPerformanceDot(selectedStaff.performance)}`}></span>
                    {selectedStaff.performance}
                  </p>
                </div>
              </div>

              {(selectedStaff.address || selectedStaff.city || selectedStaff.country) && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">
                    {selectedStaff.address && <span>{selectedStaff.address}<br /></span>}
                    {selectedStaff.city && <span>{selectedStaff.city}</span>}
                    {selectedStaff.state && <span>, {selectedStaff.state}</span>}
                    {selectedStaff.postal_code && <span> {selectedStaff.postal_code}</span>}
                    {selectedStaff.country && <span><br />{selectedStaff.country}</span>}
                  </p>
                </div>
              )}

              {selectedStaff.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{selectedStaff.notes}</p>
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
                    handleEdit(selectedStaff);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
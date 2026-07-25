// src/pages/SuperAdmin/Analytics.jsx
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Store,
  DollarSign,
  Calendar,
  Download,
  ArrowUp,
  Users,
  Package
} from 'lucide-react';

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('monthly');
  const [data, setData] = useState({
    revenue: {
      total: 45230.50,
      growth: 15.3,
      byShop: [
        { name: 'Main Street Store', amount: 15240.00, percentage: 33.7 },
        { name: 'Tech Hub Store', amount: 12890.50, percentage: 28.5 },
        { name: 'Downtown Boutique', amount: 8940.00, percentage: 19.8 },
        { name: 'Mall Kiosk', amount: 5160.00, percentage: 11.4 },
        { name: 'Fashion Express', amount: 3000.00, percentage: 6.6 }
      ],
      monthly: [
        { month: 'Jan', amount: 3250 },
        { month: 'Feb', amount: 3800 },
        { month: 'Mar', amount: 4200 },
        { month: 'Apr', amount: 5100 },
        { month: 'May', amount: 4800 },
        { month: 'Jun', amount: 5600 },
        { month: 'Jul', amount: 6200 }
      ]
    },
    shops: {
      total: 5,
      active: 3,
      inactive: 2,
      newThisMonth: 1
    },
    subscriptions: {
      premium: 2,
      standard: 2,
      basic: 1
    }
  });

  useEffect(() => {
    // Data is already set in state
  }, [timeframe]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-600">Track shop performance metrics</p>
          </div>
          <div className="flex gap-3">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                ${data.revenue.total.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>{data.revenue.growth}% growth</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Shops</p>
              <p className="text-2xl font-bold text-gray-800">{data.shops.total}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Store className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {data.shops.active} active, {data.shops.inactive} inactive
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Shops</p>
              <p className="text-2xl font-bold text-purple-600">+{data.shops.newThisMonth}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">This month</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Rate</p>
              <p className="text-2xl font-bold text-indigo-600">
                {Math.round((data.shops.active / data.shops.total) * 100)}%
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">of total shops</div>
        </div>
      </div>

      {/* Revenue by Shop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Shop</h2>
          <div className="space-y-4">
            {data.revenue.byShop.map((shop, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{shop.name}</span>
                  <span className="text-gray-600">${shop.amount.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${shop.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{shop.percentage}% of total</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Revenue Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {data.revenue.monthly.map((item, index) => {
              const max = Math.max(...data.revenue.monthly.map(m => m.amount));
              const height = (item.amount / max) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                    style={{ height: `${height}%`, minHeight: '20px' }}
                  />
                  <span className="text-xs text-gray-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Subscription Distribution</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Premium</span>
              <span className="font-bold text-purple-600">{data.subscriptions.premium}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 rounded-full h-2" style={{ width: '40%' }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Standard</span>
              <span className="font-bold text-blue-600">{data.subscriptions.standard}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 rounded-full h-2" style={{ width: '40%' }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Basic</span>
              <span className="font-bold text-gray-600">{data.subscriptions.basic}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-600 rounded-full h-2" style={{ width: '20%' }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Shops (This Month)</span>
              <span className="font-bold text-green-600">+{data.shops.newThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Shops</span>
              <span className="font-bold text-green-600">{data.shops.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inactive Shops</span>
              <span className="font-bold text-red-600">{data.shops.inactive}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Revenue/Shop</span>
              <span className="font-bold">
                ${(data.revenue.total / data.shops.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Growth Indicators</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Revenue Growth</p>
                <p className="text-xl font-bold text-green-600">+{data.revenue.growth}%</p>
              </div>
              <ArrowUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Shop Growth</p>
                <p className="text-xl font-bold text-blue-600">+5.5%</p>
              </div>
              <Store className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Premium Adoption</p>
                <p className="text-xl font-bold text-purple-600">40%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
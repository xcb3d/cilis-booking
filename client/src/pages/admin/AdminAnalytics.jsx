import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BOOKING_STATUS } from '../../utils/constants';
import axiosClient from '../../utils/axiosClient';
import { useQuery } from '@tanstack/react-query';

const AdminAnalytics = () => {
  // Fetch analytics data from API
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      return await axiosClient.get('/admin/analytics');
    }
  });

  // Extract data or use defaults if loading
  const stats = analyticsData?.stats || {
    totalUsers: 0,
    totalExperts: 0,
    totalClients: 0,
    totalBookings: 0,
    totalRevenue: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    canceledBookings: 0
  };
  
  const bookingStatusData = analyticsData?.bookingStatusData || [
    { name: 'Đã xác nhận', value: 0, color: '#3b82f6' },
    { name: 'Đã hoàn thành', value: 0, color: '#10b981' },
    { name: 'Đã hủy', value: 0, color: '#ef4444' },
  ];
  
  const fieldData = analyticsData?.fieldData || [];
  const topExperts = analyticsData?.topExperts || [];
  const monthlyData = analyticsData?.monthlyData || [];
  
  // Format currency in VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Đang tải dữ liệu phân tích...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h2 className="text-lg font-medium text-red-800 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-red-700">{error.message || 'Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.'}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <ChartBarIcon className="h-8 w-8 text-blue-500 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Phân tích dữ liệu</h1>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Tổng người dùng" 
          value={stats.totalUsers} 
          icon={<UsersIcon className="h-6 w-6 text-blue-500" />} 
          change="+12%" 
        />
        <StatCard 
          title="Tổng chuyên gia" 
          value={stats.totalExperts} 
          icon={<BriefcaseIcon className="h-6 w-6 text-indigo-500" />} 
          change="+8%" 
        />
        <StatCard 
          title="Tổng khách hàng" 
          value={stats.totalClients} 
          icon={<UserGroupIcon className="h-6 w-6 text-purple-500" />} 
          change="+15%" 
        />
        <StatCard 
          title="Tổng lịch hẹn" 
          value={stats.totalBookings} 
          icon={<CalendarIcon className="h-6 w-6 text-green-500" />} 
          change="+24%" 
        />
      </div>
      
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Doanh thu</h2>
            <div className="text-sm text-gray-500">Năm 2023</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="text-sm text-green-500 flex items-center mb-4">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            <span>Tăng 23% so với tháng trước</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  name="Doanh thu"
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Top 5 chuyên gia</h2>
          </div>
          <div className="space-y-4">
            {topExperts.map((expert, index) => (
              <div key={expert.id} className="flex items-center border-b pb-3">
                <div className="flex-shrink-0">
                  <img 
                    src={expert.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=random`} 
                    alt={expert.name}
                    className="w-10 h-10 rounded-full" 
                  />
                </div>
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-medium text-gray-900">{expert.name}</p>
                  <p className="text-xs text-gray-500">{expert.field}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(expert.revenue)}</p>
                  <p className="text-xs text-gray-500">{expert.bookings} lịch hẹn</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Trạng thái đặt lịch</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                <span className="text-xs text-gray-500">Đã xác nhận</span>
              </div>
              <div className="text-xl font-bold mt-1">{stats.confirmedBookings}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalBookings > 0 
                  ? Math.round(stats.confirmedBookings / stats.totalBookings * 100) 
                  : 0}%
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="text-xs text-gray-500">Đã hoàn thành</span>
              </div>
              <div className="text-xl font-bold mt-1">{stats.completedBookings}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalBookings > 0 
                  ? Math.round(stats.completedBookings / stats.totalBookings * 100) 
                  : 0}%
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <XCircleIcon className="h-5 w-5 text-red-500" />
                <span className="text-xs text-gray-500">Đã hủy</span>
              </div>
              <div className="text-xl font-bold mt-1">{stats.canceledBookings}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalBookings > 0 
                  ? Math.round(stats.canceledBookings / stats.totalBookings * 100) 
                  : 0}%
              </div>
            </div>
          </div>
          
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Phân bố theo lĩnh vực</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fieldData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" name="Số lịch hẹn" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Xu hướng đặt lịch</h2>
          <div className="text-sm text-gray-500">12 tháng qua</div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="bookings" 
                name="Số lịch hẹn"
                stroke="#3b82f6" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="completionRate" 
                name="Tỷ lệ hoàn thành (%)"
                stroke="#10b981" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Helper component for stats card
const StatCard = ({ title, value, icon, change }) => {
  const isPositive = change.startsWith('+');
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className={`bg-gray-50 px-5 py-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        <div className="text-sm flex items-center">
          {isPositive ? (
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
          ) : (
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1 transform rotate-180" />
          )}
          <span>{change} so với tháng trước</span>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 
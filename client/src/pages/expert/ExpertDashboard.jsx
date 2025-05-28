import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UserIcon, StarIcon, DocumentIcon, XCircleIcon, CheckCircleIcon, ArrowUpTrayIcon, ExclamationTriangleIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import { VERIFICATION_STATUS, BOOKING_STATUS_DETAILS } from '../../utils/constants';
import axiosClient from '../../utils/axiosClient';
import { useQuery } from '@tanstack/react-query';
import VerificationDocuments from '../../components/expert/VerificationDocuments';

const ExpertDashboard = () => {
  const { user } = useAuthStore();
  const [showAll, setShowAll] = useState(false);
  const [showVerificationSection, setShowVerificationSection] = useState(
    user?.verified === VERIFICATION_STATUS.UNVERIFIED || 
    user?.verified === VERIFICATION_STATUS.REJECTED
  );
  
  // Fetch expert dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['expertDashboard'],
    queryFn: async () => {
      const response = await axiosClient.get('/experts/dashboard');
      return response;
    },
    enabled: !!user && user.role === 'expert'
  });
  
  // Destructure dashboard data
  const expert = dashboardData?.expert || user;
  const stats = dashboardData?.stats || { 
    totalBookings: 0, 
    completedBookings: 0,
    upcomingBookings: 0,
    totalEarnings: 0,
    reviewCount: 0,
    recentBookings: [],
    recentReviews: []
  };
  const rejectionReason = dashboardData?.expert?.verificationComment || "";
  const verificationStatus = expert?.verified || VERIFICATION_STATUS.UNVERIFIED;
  
  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  };
  
  // Render verification status section based on status
  const renderVerificationStatus = () => {
    switch (verificationStatus) {
      case VERIFICATION_STATUS.UNVERIFIED:
        return (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border-2 border-yellow-400">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <DocumentIcon className="h-6 w-6 text-gray-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Tài khoản chưa được xác minh</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Để bắt đầu nhận yêu cầu tư vấn từ khách hàng, bạn cần tải lên giấy tờ xác minh. 
                  Giấy tờ của bạn sẽ được xem xét bởi đội ngũ quản trị viên.
                </p>
                <button
                  onClick={() => setShowVerificationSection(true)}
                  className="mt-3 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  <ArrowUpTrayIcon className="mr-1 h-4 w-4" />
                  Tải lên giấy tờ xác minh
                </button>
              </div>
            </div>
          </div>
        );
        
      case VERIFICATION_STATUS.PENDING:
        return (
          <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-300">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">Đang chờ xét duyệt</h3>
                <p className="mt-2 text-sm text-yellow-700">
                  Giấy tờ của bạn đã được gửi và đang trong quá trình xem xét. 
                  Quá trình này có thể mất từ 1-3 ngày làm việc. Bạn sẽ nhận được thông báo khi có kết quả.
                </p>
              </div>
            </div>
          </div>
        );
        
      case VERIFICATION_STATUS.REJECTED:
        return (
          <div className="bg-red-50 rounded-lg p-4 mb-6 border-2 border-red-400">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Xác minh bị từ chối</h3>
                <p className="mt-2 text-sm text-red-700">
                  Rất tiếc, giấy tờ xác minh của bạn không được chấp nhận vì lý do sau:
                </p>
                <div className="mt-2 p-2 bg-white rounded border border-red-200 text-sm text-red-800">
                  {rejectionReason || "Không có lý do được cung cấp"}
                </div>
                <button
                  onClick={() => setShowVerificationSection(true)}
                  className="mt-3 flex items-center text-sm font-medium text-red-600 hover:text-red-500"
                >
                  <ArrowUpTrayIcon className="mr-1 h-4 w-4" />
                  Tải lại giấy tờ xác minh
                </button>
              </div>
            </div>
          </div>
        );
        
      case VERIFICATION_STATUS.VERIFIED:
        return (
          <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-300">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">Tài khoản đã được xác minh</h3>
                <p className="mt-2 text-sm text-green-700">
                  Chúc mừng! Tài khoản của bạn đã được xác minh. Bạn có thể bắt đầu nhận các yêu cầu tư vấn từ khách hàng.
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Hàm lấy lớp CSS cho trạng thái
  const getStatusColorClass = (color) => {
    switch (color) {
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Đang tải dữ liệu...</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Có lỗi xảy ra</h1>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error.message || 'Không thể tải dữ liệu. Vui lòng thử lại sau.'}</p>
        </div>
      </div>
    );
  }
  
  // Hiển thị giao diện khác nhau dựa trên trạng thái xác minh
  if (verificationStatus === VERIFICATION_STATUS.UNVERIFIED || 
      verificationStatus === VERIFICATION_STATUS.REJECTED || 
      verificationStatus === VERIFICATION_STATUS.PENDING) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Dashboard Chuyên Gia</h1>
        
        <div className="bg-yellow-50 p-6 rounded-lg shadow-md border-2 border-yellow-400 mb-8">
          <h2 className="text-xl font-bold text-yellow-800 flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
            {verificationStatus === VERIFICATION_STATUS.PENDING 
              ? "Tài khoản của bạn đang chờ xác minh" 
              : "Tài khoản của bạn cần được xác minh"}
          </h2>
          <p className="text-yellow-700 mb-4">
            {verificationStatus === VERIFICATION_STATUS.UNVERIFIED 
              ? "Để sử dụng đầy đủ tính năng của hệ thống và bắt đầu nhận yêu cầu tư vấn từ khách hàng, bạn cần tải lên giấy tờ xác minh danh tính và trình độ chuyên môn."
              : verificationStatus === VERIFICATION_STATUS.PENDING
                ? "Giấy tờ của bạn đã được gửi và đang trong quá trình xem xét. Quá trình này có thể mất từ 1-3 ngày làm việc. Bạn sẽ nhận được thông báo khi có kết quả."
                : "Giấy tờ xác minh của bạn đã bị từ chối. Vui lòng xem lý do bên dưới và tải lên lại giấy tờ để tiếp tục quy trình xác minh."
            }
          </p>
          <p className="text-sm text-yellow-600 mb-2">
            <strong>Lưu ý:</strong> Chỉ khi tài khoản của bạn được xác minh, bạn mới có thể:
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-600 mb-4 ml-2">
            <li>Quản lý lịch tư vấn của bạn</li>
            <li>Xem và quản lý các yêu cầu đặt lịch từ khách hàng</li>
            <li>Nhận đánh giá và phản hồi</li>
            <li>Nhận thanh toán cho các buổi tư vấn</li>
          </ul>
        </div>
        
        {/* Verification Status Section */}
        {renderVerificationStatus()}
        
        {/* Verification Documents Component */}
        {showVerificationSection && <VerificationDocuments />}
        
        {/* Thông tin hướng dẫn thêm */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
          <h3 className="text-lg font-medium text-blue-800 mb-3">Làm thế nào để được xác minh nhanh chóng?</h3>
          <ul className="space-y-2 text-blue-700">
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <span>Đảm bảo tất cả giấy tờ đều rõ ràng, không bị mờ hoặc khó đọc</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <span>Chứng chỉ và bằng cấp phải liên quan trực tiếp đến lĩnh vực tư vấn của bạn</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <span>Đảm bảo các tài liệu minh chứng kinh nghiệm có đầy đủ thông tin và có thể xác minh</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <span>Nếu có giấy phép hành nghề, hãy đảm bảo giấy phép còn hiệu lực</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
  
  // Giao diện bình thường khi đã xác minh
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Dashboard Chuyên Gia</h1>
      
      {/* Verification Status Section */}
      {renderVerificationStatus()}
      
      {/* Verification Documents Component */}
      {showVerificationSection && <VerificationDocuments />}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Upcoming Bookings card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Lịch sắp tới</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.upcomingBookings}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/expert/schedule" className="font-medium text-blue-600 hover:text-blue-900">
                Xem lịch của tôi
              </Link>
            </div>
          </div>
        </div>

        {/* Completed Bookings card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Lịch đã hoàn thành</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.completedBookings}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/expert/bookings" className="font-medium text-blue-600 hover:text-blue-900">
                Xem lịch sử tư vấn
              </Link>
            </div>
          </div>
        </div>

        {/* Revenue card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Doanh thu</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalEarnings)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/expert/profile" className="font-medium text-blue-600 hover:text-blue-900">
                Xem hồ sơ của tôi
              </Link>
            </div>
          </div>
        </div>

        {/* Total Bookings card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <StarIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng lịch hẹn</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalBookings}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/expert/reviews" className="font-medium text-blue-600 hover:text-blue-900">
                Xem {stats.reviewCount} đánh giá
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Appointments Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Lịch hẹn gần đây</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Các buổi tư vấn gần đây</p>
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {showAll ? 'Hiển thị ít hơn' : 'Xem tất cả'}
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {stats.recentBookings?.length === 0 ? (
            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
              Không có lịch hẹn nào gần đây
            </li>
          ) : (
            (showAll ? stats.recentBookings : stats.recentBookings?.slice(0, 3))?.map((booking) => (
              <li key={booking._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="sm:flex sm:items-center sm:justify-between w-full">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Mã đặt lịch: {booking._id}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500">
                        <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        {formatDate(booking.date)}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(booking.price)}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Trạng thái: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getStatusColorClass(BOOKING_STATUS_DETAILS[typeof booking.status === 'object' ? booking.status.status : booking.status]?.color || 'gray')
                        }`}>
                          {BOOKING_STATUS_DETAILS[typeof booking.status === 'object' ? booking.status.status : booking.status]?.name || (typeof booking.status === 'object' ? booking.status.status : booking.status)}
                        </span>
                      </p>
                      <div className="mt-2">
                        <Link
                          to={`/expert/bookings/${booking._id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Recent Reviews Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Đánh giá gần đây</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Đánh giá từ khách hàng của bạn</p>
        </div>
        <ul className="divide-y divide-gray-200">
          {stats.recentReviews.length === 0 ? (
            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
              Bạn chưa có đánh giá nào
            </li>
          ) : (
            stats.recentReviews.map((review) => (
              <li key={review._id} className="px-4 py-4 sm:px-6">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-5 w-5 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="ml-2 text-sm text-gray-500">
                      {review.createdAt ? formatDate(review.createdAt) : 'N/A'}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {review.clientName ? `Từ: ${review.clientName}` : ''}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
        <div className="px-4 py-4 sm:px-6">
          <Link
            to="/expert/reviews"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Xem tất cả đánh giá
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard; 
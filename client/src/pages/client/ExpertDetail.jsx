import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  StarIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  UserIcon,
  MapPinIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  TagIcon,
  PhoneIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import axiosClient from '../../utils/axiosClient';
import StartConversationButton from '../../components/chat/StartConversationButton';

const ExpertDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('about');
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [reviewsPerPage, setReviewsPerPage] = useState(10);
  
  // Lấy thông tin chi tiết chuyên gia
  const { data: expert, isLoading, error } = useQuery({
    queryKey: ['expertDetail', id],
    queryFn: async () => {
      const response = await axiosClient.get(`/clients/experts/${id}`);
      return response;
    }
  });
  
  // Lấy đánh giá của chuyên gia với phân trang
  const { 
    data: reviewsData, 
    isLoading: isReviewsLoading,
    refetch: refetchReviews
  } = useQuery({
    queryKey: ['expertReviews', id, currentReviewPage, reviewsPerPage],
    queryFn: async () => {
      const response = await axiosClient.get(`/clients/experts/${id}/reviews`, {
        params: {
          page: currentReviewPage,
          limit: reviewsPerPage
        }
      });
      return response;
    },
    enabled: selectedTab === 'reviews' // Chỉ lấy đánh giá khi tab reviews được hiển thị
  });
  
  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Format date to locale string
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Hàm render các sao đánh giá với hỗ trợ nửa sao (0.5)
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 1; i <= fullStars; i++) {
      stars.push(
        <StarSolidIcon
          key={`full-${i}`}
          className="h-5 w-5 text-yellow-400"
        />
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative inline-block h-5 w-5">
          <StarIcon className="absolute h-5 w-5 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <StarSolidIcon className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(
        <StarIcon
          key={`empty-${i}`}
          className="h-5 w-5 text-gray-300"
        />
      );
    }
    
    return stars;
  };
  
  // Hàm render các sao đánh giá với kích thước nhỏ hơn
  const renderSmallStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 1; i <= fullStars; i++) {
      stars.push(
        <StarSolidIcon
          key={`full-${i}`}
          className="h-4 w-4 text-yellow-400"
        />
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative inline-block h-4 w-4">
          <StarIcon className="absolute h-4 w-4 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
          </div>
        </div>
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(
        <StarIcon
          key={`empty-${i}`}
          className="h-4 w-4 text-gray-300"
        />
      );
    }
    
    return stars;
  };
  
  // Xử lý chuyển tab
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    // Nếu chuyển sang tab đánh giá và chưa có dữ liệu, refetch
    if (tab === 'reviews' && !reviewsData) {
      refetchReviews();
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!expert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Chuyên gia không tồn tại</h2>
          <p className="mt-2 text-gray-600">Chuyên gia bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link to="/client/experts" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            ← Quay lại danh sách chuyên gia
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <Link to="/client/experts" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          ← Quay lại danh sách chuyên gia
        </Link>
        
        {/* Expert header */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex">
              <img
                className="h-24 w-24 rounded-full object-cover mr-6"
                src={expert.avatar}
                alt={expert.name}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{expert.name}</h1>
                <p className="mt-1 text-lg text-blue-600">{expert.field}</p>
                <div className="mt-2 flex items-center">
                  <div className="flex items-center">
                    {renderStars(expert.rating || 0)}
                  </div>
                  <p className="ml-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">
  {typeof expert.rating === 'number' ? Number(expert.rating).toFixed(1) : '0.0'}
</span> trên 5
                  </p>
                  {expert.verified && (
                    <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckBadgeIcon className="h-4 w-4 mr-1" />
                      Đã xác thực
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col items-end">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(expert.price)}
                <span className="text-sm font-normal text-gray-500">/giờ</span>
              </p>
              <div className="mt-3 flex space-x-3">
                <StartConversationButton 
                  userId={expert._id} 
                  userName={expert.name}
                />
                <Link
                  to={`/client/booking/${expert._id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Đặt lịch ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('about')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'about'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Thông tin
            </button>
            <button
              onClick={() => handleTabChange('reviews')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Đánh giá ({expert.reviewCount})
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="mb-8">
          {/* About tab */}
          {selectedTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-lg font-medium text-gray-900">Giới thiệu</h2>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Chuyên môn</h3>
                        <p className="mt-1 text-sm text-gray-900">{expert.expertise}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Kinh nghiệm</h3>
                        <p className="mt-1 text-sm text-gray-900">{expert.experience}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Lĩnh vực</h3>
                        <p className="mt-1 text-sm text-gray-900">{expert.field}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow sm:rounded-lg mt-8">
                  <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-lg font-medium text-gray-900">Quy trình làm việc</h2>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="space-y-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                            <CalendarDaysIcon className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">1. Đặt lịch</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            Chọn ngày và giờ phù hợp với lịch trình của bạn.
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                            <CurrencyDollarIcon className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">2. Thanh toán</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            Thanh toán qua các phương thức an toàn và bảo mật.
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                            <ChatBubbleLeftRightIcon className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">3. Tư vấn</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            Tham gia buổi tư vấn trực tuyến với chuyên gia.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-lg font-medium text-gray-900">Thông tin liên hệ</h2>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="ml-3 text-sm text-gray-900">{expert.name}</div>
                      </div>
                      <div className="flex items-start">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="ml-3 text-sm text-gray-900">Hồ Chí Minh, Việt Nam</div>
                      </div>
                      <div className="flex items-start">
                        <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="ml-3 text-sm text-gray-900">
                          <p>Thời gian làm việc:</p>
                          {expert.availability && (
                            <p className="mt-1">
                              {expert.availability.weekdays.includes(1) && 'Thứ 2, '}
                              {expert.availability.weekdays.includes(2) && 'Thứ 3, '}
                              {expert.availability.weekdays.includes(3) && 'Thứ 4, '}
                              {expert.availability.weekdays.includes(4) && 'Thứ 5, '}
                              {expert.availability.weekdays.includes(5) && 'Thứ 6, '}
                              {expert.availability.weekdays.includes(6) && 'Thứ 7, '}
                              {expert.availability.weekdays.includes(0) && 'Chủ nhật'}
                            </p>
                          )}
                          <p className="mt-1">
                            {expert.availability ? `${expert.availability.startTime} - ${expert.availability.endTime}` : 'Không có thông tin'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow sm:rounded-lg mt-8">
                  <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-lg font-medium text-gray-900">Đặt lịch</h2>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <Link
                      to={`/client/booking/${expert._id}`}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Đặt lịch ngay
                    </Link>
                    <div className="mt-3">
                      <StartConversationButton 
                        userId={expert._id} 
                        userName={expert.name}
                        className="w-full flex justify-center"
                      />
                    </div>
                    <p className="mt-3 text-sm text-gray-500 text-center">
                      Giá: {formatCurrency(expert.price)}/giờ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Reviews tab */}
          {selectedTab === 'reviews' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Đánh giá từ khách hàng</h2>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {renderStars(expert.rating || 0)}
                    </div>
                    <p className="ml-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{expert.rating ? parseFloat(expert.rating).toFixed(1) : '0.0'}</span> trên 5
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Loading state */}
              {isReviewsLoading && (
                <div className="px-4 py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500">Đang tải đánh giá...</p>
                </div>
              )}
              
              {/* Empty state */}
              {!isReviewsLoading && (!reviewsData?.reviews || reviewsData.reviews.length === 0) && (
                <div className="px-4 py-12 text-center text-gray-500">
                  <p>Chưa có đánh giá nào.</p>
                </div>
              )}
              
              {/* Reviews content */}
              {!isReviewsLoading && reviewsData?.reviews && reviewsData.reviews.length > 0 && (
                <div>
                  {/* Hiển thị phân bố đánh giá */}
                  <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Phân bố đánh giá</h3>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        // Tính số đánh giá cho mỗi mức sao từ reviewsData.ratingCounts
                        const count = reviewsData.ratingCounts?.[star] || 0;
                        
                        // Tính phần trăm
                        const percentage = reviewsData.totalReviews ? (count / reviewsData.totalReviews) * 100 : 0;
                        
                        return (
                          <div key={star} className="flex items-center">
                            <div className="flex items-center w-24">
                              <span className="text-sm font-medium text-gray-600 mr-2">{star}</span>
                              <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="ml-2 w-10 text-xs text-gray-500 text-right">
                              {count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Danh sách đánh giá */}
                  <ul className="divide-y divide-gray-200">
                    {reviewsData.reviews.map((review) => (
                      <li key={review._id} className="px-4 py-5 sm:px-6 hover:bg-gray-50">
                        <div className="flex space-x-3">
                          <div className="flex-shrink-0">
                            {review.clientAvatar ? (
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={review.clientAvatar} 
                                alt="Avatar khách hàng" 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900">
                                {review.clientName || 'Khách hàng'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                            <div className="mt-1 flex items-center">
                              {renderSmallStars(review.rating)}
                              <span className="ml-1 text-sm text-gray-600">{parseFloat(review.rating).toFixed(1)}</span>
                            </div>
                            
                            {/* Hiển thị thông tin buổi tư vấn */}
                            {review.bookingInfo && (
                              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                <div className="flex flex-wrap gap-2">
                                  {review.bookingInfo.date && (
                                    <div className="flex items-center">
                                      <CalendarDaysIcon className="h-3 w-3 text-gray-400 mr-1" />
                                      {new Date(review.bookingInfo.date).toLocaleDateString('vi-VN')}
                                    </div>
                                  )}
                                  {review.bookingInfo.time && (
                                    <div className="flex items-center">
                                      <ClockIcon className="h-3 w-3 text-gray-400 mr-1" />
                                      {review.bookingInfo.time}
                                    </div>
                                  )}
                                  {review.bookingInfo.duration && (
                                    <div className="flex items-center">
                                      <span className="text-gray-400 font-medium">{review.bookingInfo.duration} phút</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-3 text-sm text-gray-700">
                              <p className="whitespace-pre-line">{review.comment}</p>
                            </div>
                            
                            {/* Hiển thị phản hồi của chuyên gia nếu có */}
                            {review.reply && (
                              <div className="mt-3 bg-blue-50 p-3 rounded-md">
                                <div className="flex items-center mb-1">
                                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500 mr-1" />
                                  <p className="text-xs font-medium text-blue-800">Phản hồi từ chuyên gia:</p>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{review.reply}</p>
                                {review.replyDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(review.replyDate).toLocaleDateString('vi-VN')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Phân trang */}
                  {reviewsData.pagination && reviewsData.pagination.totalPages > 1 && (
                    <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentReviewPage(Math.max(1, currentReviewPage - 1))}
                          disabled={currentReviewPage <= 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Trước
                        </button>
                        <button
                          onClick={() => setCurrentReviewPage(Math.min(reviewsData.pagination.totalPages, currentReviewPage + 1))}
                          disabled={currentReviewPage >= reviewsData.pagination.totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Sau
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:items-center sm:justify-between w-full">
                        <div>
                          <p className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{reviewsData.reviews.length}</span> trong{' '}
                            <span className="font-medium">{reviewsData.pagination.total}</span> đánh giá
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentReviewPage(Math.max(1, currentReviewPage - 1))}
                              disabled={currentReviewPage <= 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <span className="sr-only">Trang trước</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Render các trang */}
                            {Array.from({ length: Math.min(5, reviewsData.pagination.totalPages) }, (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentReviewPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border ${
                                    currentReviewPage === pageNum 
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                  } text-sm font-medium`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            <button
                              onClick={() => setCurrentReviewPage(Math.min(reviewsData.pagination.totalPages, currentReviewPage + 1))}
                              disabled={currentReviewPage >= reviewsData.pagination.totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <span className="sr-only">Trang sau</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertDetail; 
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  StarIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  CalendarIcon,
  ArrowPathIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import useAuthStore from '../../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import Pagination from '../../components/common/Pagination';

const ExpertReviews = () => {
  const { user } = useAuthStore();
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [replyText, setReplyText] = useState({});
  const [replying, setReplying] = useState({});
  const queryClient = useQueryClient();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Stats
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // Fetch expert reviews using React Query with pagination
  const { 
    data: reviewsData = { reviews: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } }, 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['expertReviews', currentPage, pageSize],
    queryFn: async () => {
      try {
        console.log(`Fetching expert reviews, page: ${currentPage}, limit: ${pageSize}...`);
        const data = await axiosClient.get('/experts/reviews', {
          params: {
            page: currentPage,
            limit: pageSize
          }
        });
        console.log('Reviews API response:', data);
        return data || { reviews: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } };
      } catch (error) {
        console.error('Error fetching expert reviews:', error);
        return { reviews: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } };
      }
    },
    enabled: !!user
  });

  // Submit reply mutation
  const submitReplyMutation = useMutation({
    mutationFn: (replyData) => {
      return axiosClient.post('/experts/reviews/reply', replyData);
    },
    onSuccess: () => {
      toast.success('Phản hồi của bạn đã được gửi thành công');
      queryClient.invalidateQueries({ queryKey: ['expertReviews'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể gửi phản hồi. Vui lòng thử lại sau.');
    }
  });

  // Update state based on reviewsData
  useEffect(() => {
    if (reviewsData) {
      // Lấy thông tin phân trang từ API response
      const { reviews, pagination } = reviewsData;
      
      // Cập nhật thông tin phân trang
      setTotalItems(pagination?.total || 0);
      setTotalPages(pagination?.totalPages || 1);
      
      // Lưu danh sách reviews gốc
      if (Array.isArray(reviews)) {
        setFilteredReviews(reviews);
        
        // Calculate stats
        const totalReviews = reviews.length;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        const avg = totalReviews > 0 ? sum / totalReviews : 0;
        
        // Count reviews by rating
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
          counts[review.rating] = (counts[review.rating] || 0) + 1;
        });
        
        // Cập nhật stats với dữ liệu mới
        setStats({
          totalReviews: pagination?.total || 0,
          averageRating: avg,
          ratingCounts: counts
        });
      }
    }
  }, [reviewsData]);
  
  // Xử lý khi filter hoặc sort thay đổi
  // Lưu ý: Vì đã có pagination từ backend, việc filter và sort sẽ áp dụng lọc thêm trên dữ liệu trang hiện tại
  // Trong triển khai thực tế, cần thêm filter và sort vào API call
  useEffect(() => {
    if (!reviewsData?.reviews?.length) return;
    
    let filtered = [...reviewsData.reviews];
    
    // Apply rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else if (sortOrder === 'oldest') {
        return dateA - dateB;
      } else if (sortOrder === 'highest') {
        return b.rating - a.rating;
      } else if (sortOrder === 'lowest') {
        return a.rating - b.rating;
      }
      return 0;
    });
    
    setFilteredReviews(filtered);
  }, [reviewsData?.reviews, ratingFilter, sortOrder]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }).format(date);
  };
  
  // Handle reply to review
  const handleReply = (reviewId) => {
    setReplying(prev => ({ ...prev, [reviewId]: true }));
  };
  
  // Submit reply
  const submitReply = (reviewId) => {
    if (!replyText[reviewId] || replyText[reviewId].trim() === '') {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    
    submitReplyMutation.mutate({
      reviewId,
      replyText: replyText[reviewId]
    });
    
    setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    setReplying(prev => ({ ...prev, [reviewId]: false }));
  };
  
  // Generate star rating display
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
  
  // Calculate percentage for rating bar
  const getRatingPercentage = (rating) => {
    if (stats.totalReviews === 0) return 0;
    return (stats.ratingCounts[rating] / stats.totalReviews) * 100;
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi số lượng hiển thị
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-700">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 flex-col">
        <p className="text-red-500 mb-2">Đã xảy ra lỗi khi tải đánh giá</p>
        <p className="text-gray-500 text-sm">{error.message || 'Vui lòng thử lại sau'}</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Đánh giá từ khách hàng</h1>
        <p className="mt-2 text-gray-600">Xem và phản hồi đánh giá từ khách hàng</p>
      </div>
      
      {/* Rating summary */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side - Average rating */}
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Đánh giá trung bình</h3>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center mb-2">
                {renderStars(stats.averageRating)}
              </div>
              <p className="text-sm text-gray-500">
                {stats.totalReviews} đánh giá
              </p>
            </div>
            
            {/* Right side - Rating distribution */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Phân bố đánh giá</h3>
              
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center mb-2">
                  <div className="flex items-center w-16">
                    <span className="text-sm font-medium text-gray-600 mr-2">{rating}</span>
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-yellow-400 h-2.5 rounded-full"
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-gray-500">
                      {stats.ratingCounts[rating] || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter and sort controls */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-0">
              <div>
                <label htmlFor="rating-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Lọc theo đánh giá
                </label>
                <select
                  id="rating-filter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                >
                  <option value="all">Tất cả đánh giá</option>
                  <option value="5">5 sao</option>
                  <option value="4.5">4.5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3.5">3.5 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2.5">2.5 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1.5">1.5 sao</option>
                  <option value="1">1 sao</option>
                  <option value="0.5">0.5 sao</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
                  Sắp xếp theo
                </label>
                <select
                  id="sort-order"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="highest">Đánh giá cao nhất</option>
                  <option value="lowest">Đánh giá thấp nhất</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {filteredReviews.length === 0 
                ? 'Không có đánh giá nào' 
                : `Hiển thị ${filteredReviews.length} trong tổng số ${totalItems} đánh giá`
              }
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {filteredReviews.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có đánh giá nào</h3>
            <p className="mt-1 text-sm text-gray-500">
              {ratingFilter !== 'all' 
                ? `Không có đánh giá nào với ${ratingFilter} sao.` 
                : 'Bạn chưa nhận được đánh giá nào từ khách hàng.'
              }
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <li key={review._id} className="px-4 py-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {review.clientAvatar ? (
                          <img 
                            src={review.clientAvatar} 
                            alt={review.clientName || 'Khách hàng'} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">{review.clientName || 'Khách hàng'}</h4>
                        <div className="ml-1 flex items-center">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                      
                      {/* Booking info */}
                      {review.bookingInfo && (
                        <div className="mt-2 bg-blue-50 p-2 rounded-md text-xs text-gray-700">
                          <div className="flex flex-wrap gap-2">
                            {review.bookingInfo.date && (
                              <div className="flex items-center">
                                <CalendarIcon className="h-3 w-3 text-blue-500 mr-1" />
                                Ngày: {new Date(review.bookingInfo.date).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                            {review.bookingInfo.time && (
                              <div className="flex items-center">
                                <ClockIcon className="h-3 w-3 text-blue-500 mr-1" />
                                {review.bookingInfo.time}
                              </div>
                            )}
                            {review.bookingInfo.service && (
                              <div className="flex items-center">
                                <TagIcon className="h-3 w-3 text-blue-500 mr-1" />
                                {review.bookingInfo.service}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 text-sm text-gray-700">
                        <p>{review.comment}</p>
                      </div>
                      
                      {/* Reply section */}
                      {review.reply ? (
                        <div className="mt-4 bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center">
                            <h5 className="text-sm font-medium text-gray-900">Phản hồi của bạn</h5>
                            <span className="ml-2 text-xs text-gray-500">
                              {formatDate(review.replyDate)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-700">{review.reply}</p>
                        </div>
                      ) : (
                        <div className="mt-3">
                          {replying[review._id] ? (
                            <div>
                              <textarea
                                rows={3}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="Viết phản hồi của bạn..."
                                value={replyText[review._id] || ''}
                                onChange={(e) => setReplyText(prev => ({ ...prev, [review._id]: e.target.value }))}
                              />
                              <div className="mt-2 flex space-x-2">
                                <button
                                  type="button"
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  onClick={() => submitReply(review._id)}
                                >
                                  Gửi phản hồi
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  onClick={() => setReplying(prev => ({ ...prev, [review._id]: false }))}
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              onClick={() => handleReply(review._id)}
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                              Phản hồi
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Pagination component */}
            <div className="px-4 py-4 border-t border-gray-200">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpertReviews; 
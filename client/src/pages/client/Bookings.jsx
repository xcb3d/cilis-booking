import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ExclamationCircleIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  EyeIcon,
  StarIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import { toast } from 'react-hot-toast';
import { BOOKING_STATUS, BOOKING_STATUS_DETAILS } from '../../utils/constants';
import ReviewModal from '../../components/client/ReviewModal';
import ReviewDetail from '../../components/client/ReviewDetail';

const Bookings = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const queryClient = useQueryClient();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReviewDetailModalOpen, setIsReviewDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Infinity scroll state
  const [pageSize] = useState(10);
  
  // Thêm state cho bộ lọc
  const [showFilters, setShowFilters] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  
  // Debounce search input
  const searchTimeout = useRef(null);
  
  // Từ danh sách EXPERT_FIELDS trong constants.js
  const expertFields = [
    'Tư vấn pháp lý',
    'Tư vấn tài chính',
    'Tư vấn tâm lý',
    'Tư vấn sức khỏe',
    'Gia sư',
    'Tư vấn công nghệ',
    'Tư vấn marketing',
    'Tư vấn kinh doanh'
  ];
  
  // Fetch booking stats
  const { data: bookingStats = { upcoming: 0, completed: 0, canceled: 0 } } = useQuery({
    queryKey: ['clientBookingStats'],
    queryFn: async () => {
      try {
        console.log('Fetching client booking stats...');
        const data = await axiosClient.get('/clients/bookings/stats');
        console.log('Booking stats API response:', data);
        return data;
      } catch (error) {
        console.error('Error fetching booking stats:', error);
        return { upcoming: 0, completed: 0, canceled: 0 };
      }
    }
  });
  
  // Fetch bookings from API using infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['clientBookings', activeTab, pageSize, searchQuery, dateFilter, fieldFilter, isFilterApplied],
    queryFn: async ({ pageParam = null }) => {
      try {
        console.log(`Fetching client bookings with filter: ${activeTab}, limit: ${pageSize}, cursor: ${pageParam}...`);
        const params = {
          filter: activeTab,
          limit: pageSize
        };
        
        // Thêm các tham số tìm kiếm và lọc
        if (searchQuery) params.search = searchQuery;
        if (dateFilter) params.date = dateFilter;
        if (fieldFilter) params.field = fieldFilter;
        
        // Thêm cursor nếu có
        if (pageParam) {
          params.cursor = pageParam;
        }
        
        const data = await axiosClient.get('/clients/bookings', { params });
        console.log('Filtered bookings API response:', data);
        
        return data;
      } catch (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.pagination?.nextCursor || undefined,
    enabled: true // Luôn chạy query
  });
  
  // Lấy tất cả bookings từ tất cả các trang
  const bookings = data ? data.pages.flatMap(page => page.bookings) : [];
  
  // Setup intersection observer for infinite scroll
  const observer = useRef();
  const lastBookingElementRef = useCallback(node => {
    if (isLoading || isFetchingNextPage) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasNextPage) {
        console.log('Last booking element is visible, fetching next page...');
        fetchNextPage();
      }
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Reset lại query khi chuyển tab hoặc áp dụng bộ lọc
  useEffect(() => {
    refetch();
  }, [activeTab, searchQuery, dateFilter, fieldFilter, isFilterApplied, refetch]);
  
  // Mutation để hủy booking
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId) => {
      return axiosClient.patch(`/clients/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      toast.success('Hủy lịch thành công!');
      // Refresh danh sách bookings và thống kê
      queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
      queryClient.invalidateQueries({ queryKey: ['clientBookingStats'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Hủy lịch thất bại. Vui lòng thử lại sau.');
    }
  });
  
  // Mutation để thêm đánh giá
  const addReviewMutation = useMutation({
    mutationFn: (reviewData) => {
      return axiosClient.post('/clients/reviews', reviewData);
    },
    onSuccess: () => {
      toast.success('Đánh giá thành công!');
      
      // Xóa cache để load lại dữ liệu mới từ server
      queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
      queryClient.invalidateQueries({ queryKey: ['clientBookingStats'] });
      
      setIsReviewModalOpen(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đánh giá thất bại. Vui lòng thử lại sau.');
    }
  });
  
  // Handle cancel booking
  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy lịch tư vấn này?')) {
      cancelBookingMutation.mutate(bookingId);
    }
  };
  
  // Open review modal
  const openReviewModal = (booking) => {
    // Kiểm tra thêm một lần nữa để đảm bảo rằng booking chưa được đánh giá
    if (booking.hasReview) {
      toast.error('Bạn đã đánh giá buổi tư vấn này rồi!');
      return;
    }
    
    setSelectedBooking(booking);
    setIsReviewModalOpen(true);
  };
  
  // Open review detail modal
  const openReviewDetailModal = (booking) => {
    setSelectedBooking(booking);
    setIsReviewDetailModalOpen(true);
  };
  
  // Handle review submission from modal
  const handleReviewSubmit = (reviewData) => {
    if (!selectedBooking) return;
    
    // Kiểm tra lại một lần nữa trước khi gửi đánh giá
    if (selectedBooking.hasReview) {
      toast.error('Bạn đã đánh giá buổi tư vấn này rồi!');
      setIsReviewModalOpen(false);
      setSelectedBooking(null);
      return;
    }
    
    addReviewMutation.mutate({
      expertId: selectedBooking.expertId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      bookingId: selectedBooking._id
    });
  };
  
  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', options);
  };

  // Tính toán thời lượng từ giờ bắt đầu đến giờ kết thúc
  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
    if (durationMinutes < 0) durationMinutes += 24 * 60; // Trường hợp qua ngày
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}p`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}p`;
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Áp dụng bộ lọc
  const applyFilters = () => {
    setIsFilterApplied(true);
    refetch();
  };
  
  // Reset bộ lọc
  const resetFilters = () => {
    setSearchInputValue('');
    setSearchQuery('');
    setDateFilter('');
    setFieldFilter('');
    setIsFilterApplied(false);
    refetch();
  };

  // Xử lý debounce cho ô tìm kiếm
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInputValue(value);
    
    // Xóa timeout cũ nếu có
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Tạo timeout mới (500ms)
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(value);
    }, 500);
  };
  
  // Clear timeout khi component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Lịch tư vấn của bạn</h1>
        <p className="text-gray-600">Quản lý tất cả các lịch tư vấn đã đặt</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex overflow-x-auto pb-1">
          <button
            className={`mr-4 py-2 px-1 ${
              activeTab === 'upcoming'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Sắp tới ({bookingStats.upcoming || 0})
          </button>
          <button
            className={`mr-4 py-2 px-1 ${
              activeTab === 'completed'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Đã hoàn thành ({bookingStats.completed || 0})
          </button>
          <button
            className={`py-2 px-1 ${
              activeTab === 'canceled'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('canceled')}
          >
            Đã hủy ({bookingStats.canceled || 0})
          </button>
        </div>
      </div>
      
      {/* Phần bộ lọc mới */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">
          {isFilterApplied && (searchQuery || dateFilter || fieldFilter) ? 
            'Lịch tư vấn đã lọc' : 
            activeTab === 'upcoming' ? 'Lịch tư vấn sắp tới' : 
            activeTab === 'completed' ? 'Lịch tư vấn đã hoàn thành' : 
            'Lịch tư vấn đã hủy'
          }
        </h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <FunnelIcon className="-ml-0.5 mr-2 h-4 w-4" />
          {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        </button>
      </div>
      
      {/* Giao diện bộ lọc */}
      {showFilters && (
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tìm kiếm theo tên chuyên gia */}
            <div>
              <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm theo tên chuyên gia
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search-filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Nhập tên chuyên gia..."
                  value={searchInputValue}
                  onChange={handleSearchInputChange}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Lọc theo ngày */}
            <div>
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Lọc theo ngày
              </label>
              <input
                type="date"
                id="date-filter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            
            {/* Lọc theo lĩnh vực */}
            <div>
              <label htmlFor="field-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Lĩnh vực chuyên môn
              </label>
              <select
                id="field-filter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
              >
                <option value="">Tất cả lĩnh vực</option>
                {expertFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
      
      {/* Loading and error states */}
      {isLoading && !data && (
        <div className="flex justify-center py-8">
          <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex">
            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            <span>Không thể tải dữ liệu. Vui lòng thử lại sau.</span>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && bookings.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch tư vấn</h3>
          <p className="text-gray-500 mb-4">
            {activeTab === 'upcoming' && "Bạn chưa có lịch tư vấn nào sắp tới."}
            {activeTab === 'completed' && "Bạn chưa có lịch tư vấn nào đã hoàn thành."}
            {activeTab === 'canceled' && "Bạn chưa có lịch tư vấn nào đã hủy."}
          </p>
          {activeTab !== 'upcoming' && (
            <button
              className="text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => setActiveTab('upcoming')}
            >
              Xem lịch tư vấn sắp tới
            </button>
          )}
        </div>
      )}
      
      {/* Bookings list */}
      {!isLoading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking, index) => {
            // Kiểm tra nếu đây là booking cuối cùng, gán ref cho infinity scroll
            const isLastElement = index === bookings.length - 1;
            
            return (
              <div 
                key={booking._id} 
                ref={isLastElement ? lastBookingElementRef : null}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="mb-2 md:mb-0">
                    <div className="flex items-center mb-1">
                      {booking.expertAvatar ? (
                        <img 
                          src={booking.expertAvatar} 
                          alt={booking.expertName} 
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                          {booking.expertName?.charAt(0) || 'E'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-lg">
                          {booking.expertName || 'Chuyên gia'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {booking.expertField || 'Lĩnh vực chuyên môn'}
                          {booking.expertRating !== undefined && (
                            <span className="ml-2 inline-flex items-center text-yellow-500">
                              <StarIcon className="h-4 w-4 mr-1" />
                              {typeof booking.expertRating === 'number' 
                                ? booking.expertRating.toFixed(1) 
                                : booking.expertRating}
                              {booking.expertReviewCount && (
                                <span className="text-gray-500 text-xs ml-1">
                                  ({booking.expertReviewCount})
                                </span>
                              )}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {booking.expertExpertise && (
                      <p className="text-sm text-gray-600 mt-1">
                        {booking.expertExpertise}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(BOOKING_STATUS_DETAILS[typeof booking.status === 'object' ? booking.status.status : booking.status]?.color)}`}>
                      {BOOKING_STATUS_DETAILS[typeof booking.status === 'object' ? booking.status.status : booking.status]?.name || (typeof booking.status === 'object' ? booking.status.status : booking.status)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium">{formatDate(booking.date).split(',')[0]}</div>
                      <div className="text-sm text-gray-500">{formatDate(booking.date).split(',')[1]}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium">{booking.startTime} - {booking.endTime}</div>
                      <div className="text-sm text-gray-500">
                        {booking.duration ? `${Math.floor(booking.duration / 60)}h${booking.duration % 60 > 0 ? ` ${booking.duration % 60}p` : ''}` : 
                        calculateDuration(booking.startTime, booking.endTime)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium">{formatCurrency(booking.price)}</div>
                      <div className="text-sm text-gray-500">{booking.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'}</div>
                    </div>
                  </div>
                </div>
                
                {booking.note && (
                  <div className="mt-3 bg-gray-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Ghi chú:</h4>
                    <p className="text-sm text-gray-600">{booking.note}</p>
                  </div>
                )}

                {booking.reviewDetails && (
                  <div className="mt-3 bg-blue-50 p-3 rounded-md">
                    <div className="flex items-center mb-1">
                      <h4 className="text-sm font-medium text-blue-700">Đánh giá của bạn:</h4>
                      <div className="ml-2 flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon 
                            key={i}
                            className={`h-4 w-4 ${i < booking.reviewDetails.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {booking.reviewDetails.comment && (
                      <p className="text-sm text-gray-600 italic">"{booking.reviewDetails.comment}"</p>
                    )}
                  </div>
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {/* Contact expert - hiển thị cho tất cả booking */}
                  {booking.expertEmail && (
                    <a 
                      href={`mailto:${booking.expertEmail}`}
                      className="inline-flex items-center px-3 py-1.5 border border-indigo-300 text-sm font-medium rounded text-indigo-700 bg-white hover:bg-indigo-50"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      Liên hệ
                    </a>
                  )}
                  
                  {/* Hủy lịch button - chỉ hiển thị cho booking sắp tới */}
                  {((typeof booking.status === 'object' ? booking.status.status : booking.status) === BOOKING_STATUS.PENDING || (typeof booking.status === 'object' ? booking.status.status : booking.status) === BOOKING_STATUS.CONFIRMED) && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Hủy lịch
                    </button>
                  )}
                  
                  {/* Đánh giá button - chỉ hiển thị cho booking đã hoàn thành và chưa đánh giá */}
                  {(typeof booking.status === 'object' ? booking.status.status : booking.status) === BOOKING_STATUS.COMPLETED && !booking.hasReview && (
                    <button
                      onClick={() => openReviewModal(booking)}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                      Đánh giá
                    </button>
                  )}
                  
                  {/* Xem đánh giá - chỉ hiển thị cho booking đã hoàn thành và đã đánh giá */}
                  {(typeof booking.status === 'object' ? booking.status.status : booking.status) === BOOKING_STATUS.COMPLETED && booking.hasReview && !booking.reviewDetails && (
                    <button
                      onClick={() => openReviewDetailModal(booking)}
                      className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded text-green-700 bg-white hover:bg-green-50"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Xem đánh giá
                    </button>
                  )}
                  
                  {/* Đặt lịch lại - chỉ hiển thị cho booking đã hoàn thành hoặc đã hủy */}
                  {((typeof booking.status === 'object' ? booking.status.status : booking.status) === BOOKING_STATUS.COMPLETED || (typeof booking.status === 'object' ? booking.status.status : booking.status) === BOOKING_STATUS.CANCELED) && (
                    <Link
                      to={`/client/experts/${booking.expertId}`}
                      className="inline-flex items-center px-3 py-1.5 border border-purple-300 text-sm font-medium rounded text-purple-700 bg-white hover:bg-purple-50"
                    >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Đặt lịch lại
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Loading indicator cho infinite scroll */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
          )}
          
          {/* Thông báo khi không còn dữ liệu */}
          {!hasNextPage && bookings.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              Bạn đã xem hết danh sách lịch {activeTab === 'upcoming' ? 'sắp tới' : activeTab === 'completed' ? 'đã hoàn thành' : 'đã hủy'}.
            </div>
          )}
        </div>
      )}
      
      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedBooking(null);
        }}
        onSubmit={handleReviewSubmit}
        expertName={selectedBooking?.expertName || 'Chuyên gia'}
      />
      
      {/* Review Detail Modal */}
      <ReviewDetail
        isOpen={isReviewDetailModalOpen}
        onClose={() => {
          setIsReviewDetailModalOpen(false);
          setSelectedBooking(null);
        }}
        bookingId={selectedBooking?._id}
      />
    </div>
  );
};

export default Bookings; 
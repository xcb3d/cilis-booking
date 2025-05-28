import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import { BOOKING_STATUS, BOOKING_STATUS_DETAILS } from '../../utils/constants';
import { useChat } from '../../context/ChatContext';

const ExpertBookingHistory = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const queryClient = useQueryClient();
  const observerTarget = useRef(null);
  const { setActiveConversation, toggleMessageDialog, fetchConversations } = useChat();
  
  // Fetch booking stats
  const { data: bookingStats = { upcoming: 0, completed: 0, canceled: 0 } } = useQuery({
    queryKey: ['expertBookingStats'],
    queryFn: async () => {
      try {
        console.log('Fetching expert booking stats...');
        const data = await axiosClient.get('/experts/bookings/stats');
        console.log('Booking stats API response:', data);
        return data;
      } catch (error) {
        console.error('Error fetching booking stats:', error);
        return { upcoming: 0, completed: 0, canceled: 0 };
      }
    }
  });
  
  // Fetch bookings using React Query Infinite Query with cursor-based pagination
  const { 
    data: bookingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error 
  } = useInfiniteQuery({
    queryKey: ['expertBookings', activeTab],
    queryFn: async ({ pageParam }) => {
      try {
        console.log(`Fetching expert bookings with filter: ${activeTab}, cursor: ${pageParam || 'initial'}...`);
        const data = await axiosClient.get(`/experts/bookings`, {
          params: {
            filter: activeTab,
            limit: 10,
            cursor: pageParam
          }
        });
        console.log('Filtered bookings API response:', data);
        
        // Đảm bảo luôn trả về định dạng chuẩn
        return data || { bookings: [], pagination: { hasMore: false, nextCursor: null } };
      } catch (error) {
        console.error('Error fetching expert bookings:', error);
        return { bookings: [], pagination: { hasMore: false, nextCursor: null } };
      }
    },
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextCursor || undefined,
    initialPageParam: undefined
  });

  // Intersection Observer để load thêm dữ liệu khi scroll xuống cuối
  const handleObserver = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Thiết lập observer khi component mount
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { 
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
    }
    };
  }, [handleObserver, observerTarget]);

  // Reset query khi thay đổi tab
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['expertBookings', activeTab] });
  }, [activeTab, queryClient]);

  // Mutation để cập nhật trạng thái booking
  const completeBookingMutation = useMutation({
    mutationFn: (bookingId) => {
      return axiosClient.put(`/experts/bookings/${bookingId}/complete`);
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái buổi tư vấn thành Hoàn thành');
      // Refresh danh sách bookings và thống kê
      queryClient.invalidateQueries({ queryKey: ['expertBookings'] });
      queryClient.invalidateQueries({ queryKey: ['expertBookingStats'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Cập nhật trạng thái thất bại. Vui lòng thử lại sau.');
    }
  });
  
  // Format currency to VND
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || 'N/A';
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

  // Change booking status to completed
  const handleCompleteBooking = (bookingId) => {
    if (window.confirm('Bạn có chắc chắn muốn đánh dấu buổi tư vấn này là đã hoàn thành?')) {
      completeBookingMutation.mutate(bookingId);
    }
  };

  // Send message to client
  const handleSendMessage = async (clientId, clientName) => {
    try {
      // Create or get a conversation with this client directly using API
      const conversation = await axiosClient.post('/chat/conversations', {
        participantId: clientId
      });
      
      // Fetch all conversations to update the list
      await fetchConversations();
      
      // Add otherParticipants information to ensure name shows up in the header
      const enrichedConversation = {
        ...conversation,
        otherParticipants: [
          {
            _id: clientId,
            name: clientName || 'Khách hàng'
          }
        ]
      };
      
      // Set it as the active conversation with enriched data
      await setActiveConversation(enrichedConversation);
      
      // Open the chat dialog
      toggleMessageDialog();
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Không thể kết nối với khách hàng. Vui lòng thử lại sau.');
    }
  };

  // Generate notes for client
  const handleGenerateNotes = () => {
    // In a real app, this would open a notes editor or generate a report
    toast.success('Đã tạo ghi chú cho buổi tư vấn');
    // TODO: Implement notes functionality when available
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
      <div className="flex flex-col items-center justify-center h-64">
        <XCircleIcon className="h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Đã xảy ra lỗi</h3>
        <p className="mt-1 text-base text-gray-500">
          {error.message || 'Không thể tải dữ liệu lịch sử tư vấn'}
        </p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['expertBookings'] })}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }
  
  // Lấy danh sách bookings từ tất cả các pages
  const bookings = bookingsData?.pages?.flatMap(page => page.bookings) || [];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lịch sử tư vấn</h1>
        <p className="mt-2 text-gray-600">Quản lý các buổi tư vấn của bạn</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sắp tới {bookingStats.upcoming > 0 && `(${bookingStats.upcoming})`}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Đã hoàn thành {bookingStats.completed > 0 && `(${bookingStats.completed})`}
          </button>
          <button
            onClick={() => setActiveTab('canceled')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'canceled'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Đã hủy {bookingStats.canceled > 0 && `(${bookingStats.canceled})`}
          </button>
        </nav>
      </div>
      
      {/* Booking list */}
        {bookings.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có lịch hẹn</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'upcoming' 
              ? 'Bạn không có lịch tư vấn nào sắp tới.'
                : activeTab === 'completed'
                ? 'Bạn chưa có buổi tư vấn nào đã hoàn thành.'
                : 'Bạn không có lịch tư vấn nào đã hủy.'}
            </p>
          </div>
        ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <li key={booking._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {booking.clientAvatar ? (
                        <img 
                          className="h-12 w-12 rounded-full"
                          src={booking.clientAvatar}
                          alt={booking.clientName || 'Client'} 
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        {booking.clientName || 'Khách hàng'}
                      </h4>
                      <div className="mt-1 flex items-center">
                        <p className="text-sm text-gray-500 mr-4">
                          <PhoneIcon className="mr-1 h-4 w-4 inline" />
                          {booking.clientPhone || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          <CurrencyDollarIcon className="mr-1 h-4 w-4 inline" />
                          {formatCurrency(booking.price)}
                        </p>
                      </div>
                    </div>
                      </div>
                  <div className="flex items-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      getStatusColorClass(BOOKING_STATUS_DETAILS[booking.status]?.color || 'gray')
                    }`}>
                      {BOOKING_STATUS_DETAILS[booking.status]?.name || 
                       (typeof booking.status === 'string' ? booking.status : 'Không xác định')}
                        </span>
                      </div>
                    </div>
                    
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center text-sm text-gray-700">
                      <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                      <span>{formatDate(booking.date)}</span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-700">
                      <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                    {booking.description && (
                      <div className="mt-2 text-sm text-gray-700">
                        <DocumentTextIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500 inline-block" />
                        <span className="italic">"{booking.description}"</span>
                      </div>
                    )}
                      </div>
                      
                  <div className="flex items-center justify-end space-x-3">
                    {booking.status === BOOKING_STATUS.CONFIRMED && (
                            <button
                        type="button"
                              onClick={() => handleCompleteBooking(booking._id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                            >
                        <CheckCircleIcon className="mr-1.5 h-5 w-5" />
                              Hoàn thành
                            </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSendMessage(booking.clientId, booking.clientName)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      <ChatBubbleLeftRightIcon className="mr-1.5 h-5 w-5 text-gray-500" />
                      Nhắn tin
                    </button>
                          <button
                      type="button"
                            onClick={() => handleGenerateNotes()}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                          >
                      <DocumentTextIcon className="mr-1.5 h-5 w-5 text-gray-500" />
                            Ghi chú
                          </button>
                      </div>
                    </div>
                  </li>
            ))}
            </ul>
            
          {/* Loading indicator and observer target for infinite scroll */}
          <div 
            ref={observerTarget} 
            className="py-4 flex justify-center items-center"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center">
                <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Đang tải thêm...</span>
              </div>
            ) : hasNextPage ? (
              <span className="text-sm text-gray-500">Kéo xuống để tải thêm</span>
            ) : bookings.length > 0 ? (
              <span className="text-sm text-gray-500">Đã hiển thị tất cả</span>
            ) : null}
          </div>
            </div>
        )}
    </div>
  );
};

export default ExpertBookingHistory; 
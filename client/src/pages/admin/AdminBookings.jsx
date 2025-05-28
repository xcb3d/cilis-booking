import { useState, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { BOOKING_STATUS } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import axiosClient from '../../utils/axiosClient';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

const AdminBookings = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const observerTarget = useRef(null);
  
  // Fetch bookings from API using infinite query
  const { 
    data: bookingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['adminBookings', statusFilter, searchQuery, dateFilter],
    queryFn: async ({ pageParam }) => {
      const params = {
        filter: statusFilter !== 'all' ? statusFilter : undefined,
        cursor: pageParam,
        limit: 15,
        search: searchQuery || undefined,
        date: dateFilter || undefined
      };
      
      // Remove undefined params
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      );
      
      const response = await axiosClient.get('/admin/bookings', { params: cleanParams });
      return response;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.nextCursor || undefined;
    },
    initialPageParam: undefined,
    refetchOnWindowFocus: false
  });
  
  // Apply search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };
  
  // Handle infinite scroll using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );
    
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }) => {
      return await axiosClient.patch(`/admin/bookings/${bookingId}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái lịch đặt thành công');
      // Invalidate and refetch bookings
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái lịch đặt');
    }
  });
  
  // Handle booking status change
  const handleStatusChange = (bookingId, newStatus) => {
    if (window.confirm('Bạn có chắc chắn muốn thay đổi trạng thái của lịch đặt này không?')) {
      updateBookingStatusMutation.mutate({
        bookingId,
        status: newStatus
      });
    }
  };
  
  // Flatten bookings data from all pages
  const bookings = bookingsData?.pages.flatMap(page => page.bookings) || [];
  
  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };
  
  // Helper function to normalize status values
  const getNormalizedStatus = (status) => {
    return typeof status === 'object' && status.status ? status.status : status;
  };
  
  // Get status badge color and text
  const getStatusBadge = (status) => {
    // Handle case where status is an object with status and updatedBy properties
    const statusValue = getNormalizedStatus(status);
    
    switch(statusValue) {
      case BOOKING_STATUS.CONFIRMED:
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Đã xác nhận' };
      case BOOKING_STATUS.COMPLETED:
        return { color: 'bg-green-100 text-green-800', text: 'Đã hoàn thành' };
      case BOOKING_STATUS.CANCELLED:
      case BOOKING_STATUS.CANCELED:
        return { color: 'bg-red-100 text-red-800', text: 'Đã hủy' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: statusValue || 'Không xác định' };
    }
  };
  
  // Get payment status badge
  const getPaymentBadge = (status) => {
    switch(status) {
      case 'paid':
      case 'completed':
        return { color: 'bg-green-100 text-green-800', text: 'Đã thanh toán' };
      case 'unpaid':
      case 'pending':
        return { color: 'bg-red-100 text-red-800', text: 'Chưa thanh toán' };
      case 'refunded':
        return { color: 'bg-blue-100 text-blue-800', text: 'Đã hoàn tiền' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status };
    }
  };

  // Loading state
  if (isLoading && !isFetchingNextPage) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h2 className="text-lg font-medium text-red-800 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-red-700">{error.message || 'Không thể tải dữ liệu đặt lịch. Vui lòng thử lại sau.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch đặt</h1>
          <p className="mt-1 text-sm text-gray-600">
            Đã tải: {bookings.length} lịch đặt {hasNextPage && '(còn thêm)'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Làm mới
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <AdjustmentsHorizontalIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Bộ lọc
          </button>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="mb-4">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Tìm kiếm lịch đặt theo tên khách hàng, chuyên gia hoặc nội dung..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                Trạng thái
              </label>
              <select
                id="status-filter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value={BOOKING_STATUS.CONFIRMED}>Đã xác nhận</option>
                <option value={BOOKING_STATUS.COMPLETED}>Đã hoàn thành</option>
                <option value={BOOKING_STATUS.CANCELED}>Đã hủy</option>
              </select>
            </div>
            <div>
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">
                Ngày đặt lịch
              </label>
              <input
                type="date"
                id="date-filter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Bookings table */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chi tiết đặt lịch
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lịch hẹn
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thanh toán
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {bookings.length > 0 ? bookings.map((booking) => {
                    const statusBadge = getStatusBadge(booking.status);
                    const paymentBadge = getPaymentBadge(booking.paymentStatus);
                    
                    return (
                      <tr key={booking._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">{booking.description}</div>
                            <div className="text-gray-500">
                              <span className="font-medium">Khách hàng:</span> {booking.client?.name}
                            </div>
                            <div className="text-gray-500">
                              <span className="font-medium">Chuyên gia:</span> {booking.expert?.name} ({booking.expert?.field})
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-5 w-5 text-gray-400 mr-1" />
                            <span>{formatDate(booking.date)}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <ClockIcon className="h-5 w-5 text-gray-400 mr-1" />
                            <span>{booking.startTime} - {booking.endTime}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusBadge.color}`}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-1" />
                            <span>{formatCurrency(booking.price)}</span>
                          </div>
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 mt-1 ${paymentBadge.color}`}>
                            {paymentBadge.text}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                          <div className="flex space-x-2 justify-end">
                            {getNormalizedStatus(booking.status) === BOOKING_STATUS.CONFIRMED && (
                              <button
                                onClick={() => handleStatusChange(booking._id, BOOKING_STATUS.COMPLETED)}
                                className="text-green-600 hover:text-green-900"
                                title="Đánh dấu hoàn thành"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                            {getNormalizedStatus(booking.status) === BOOKING_STATUS.CONFIRMED && (
                              <button
                                onClick={() => handleStatusChange(booking._id, BOOKING_STATUS.CANCELED)}
                                className="text-red-600 hover:text-red-900"
                                title="Hủy lịch đặt"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="Xem chi tiết"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              title="Nhắn tin"
                            >
                              <ChatBubbleLeftRightIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Không có lịch đặt nào được tìm thấy.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Infinite scroll observer */}
      {hasNextPage && (
        <div
          ref={observerTarget}
          className="flex justify-center items-center py-4"
        >
          {isFetchingNextPage ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          ) : (
            <p className="text-sm text-gray-500">Kéo xuống để tải thêm...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBookings; 
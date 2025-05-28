import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  CurrencyDollarIcon,
  DocumentIcon,
  XCircleIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import { toast } from 'react-hot-toast';
import { BOOKING_STATUS, BOOKING_STATUS_DETAILS } from '../../utils/constants';
import ReviewModal from '../../components/client/ReviewModal';
import ReviewDetail from '../../components/client/ReviewDetail';
import useAuthStore from '../../store/authStore';

const BookingDetail = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReviewDetailModalOpen, setIsReviewDetailModalOpen] = useState(false);
  
  // Fetch booking detail
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['clientBookingDetail', bookingId],
    queryFn: async () => {
      try {
        const response = await axiosClient.get(`/clients/bookings/${bookingId}`);
        return response;
      } catch (error) {
        console.error('Error fetching booking details:', error);
        throw new Error(error.response?.data?.message || 'Không thể tải thông tin buổi tư vấn');
      }
    },
    refetchOnWindowFocus: false
  });
  
  // Log trạng thái hasReview khi booking thay đổi
  useEffect(() => {
    if (booking) {
      console.log(`BookingDetail - Booking ${bookingId} - hasReview: ${booking.hasReview}`);
    }
  }, [booking, bookingId]);
  
  // Mutation để hủy booking
  const cancelBookingMutation = useMutation({
    mutationFn: () => {
      return axiosClient.patch(`/clients/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      toast.success('Hủy lịch thành công!');
      // Refresh detail và danh sách bookings
      queryClient.invalidateQueries({ queryKey: ['clientBookingDetail', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
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
      
      // Cập nhật cache React Query trực tiếp để đảm bảo UI cập nhật đúng
      queryClient.setQueryData(['clientBookingDetail', bookingId], (oldData) => {
        if (!oldData) return null;
        return {...oldData, hasReview: true};
      });
      
      // Sau đó mới invalidate để lấy dữ liệu mới từ server
      queryClient.invalidateQueries({ queryKey: ['clientBookingDetail', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
      
      setIsReviewModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đánh giá thất bại. Vui lòng thử lại sau.');
    }
  });
  
  // Handle cancel booking
  const handleCancelBooking = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy lịch tư vấn này?')) {
      cancelBookingMutation.mutate();
    }
  };
  
  // Open review modal
  const openReviewModal = () => {
    // Kiểm tra nếu booking đã có đánh giá qua hai nguồn
    const hasReviewedBooking = booking?.hasReview === true || 
                           queryClient.getQueryData(['clientBookingDetail', bookingId])?.hasReview === true;
    
    if (hasReviewedBooking) {
      toast.error('Bạn đã đánh giá buổi tư vấn này rồi!');
      return;
    }
    
    setIsReviewModalOpen(true);
  };
  
  // Handle review submission from modal
  const handleReviewSubmit = (reviewData) => {
    // Kiểm tra lại một lần nữa trước khi gửi đánh giá qua hai nguồn
    const hasReviewedBooking = booking?.hasReview === true || 
                           queryClient.getQueryData(['clientBookingDetail', bookingId])?.hasReview === true;
    
    if (hasReviewedBooking) {
      toast.error('Bạn đã đánh giá buổi tư vấn này rồi!');
      setIsReviewModalOpen(false);
      return;
    }
    
    addReviewMutation.mutate({
      expertId: booking.expertId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      bookingId: booking._id
    });
  };
  
  // Phần mới: mở modal xem chi tiết đánh giá
  const openReviewDetailModal = () => {
    setIsReviewDetailModalOpen(true);
  };
  
  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  };
  
  // Lấy lớp CSS cho trạng thái
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
  
  // Kiểm tra trạng thái booking để hiển thị các action tương ứng
  const renderActions = () => {
    if (!booking) return null;
    
    // Kiểm tra có đánh giá hay không qua hai cách
    const hasReviewedBooking = booking.hasReview === true || 
                            (queryClient.getQueryData(['clientBookingDetail', bookingId])?.hasReview === true);
    
    const actions = [];
    
    // Nếu booking đang chờ thanh toán
    if (booking.status === BOOKING_STATUS.PENDING) {
      actions.push(
        <Link
          key="payment"
          to={`/client/payment/${booking._id}`}
          className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Thanh toán ngay
        </Link>
      );
    }
    
    // Nếu booking đã xác nhận và chưa hoàn thành
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      actions.push(
        <button
          key="cancel"
          onClick={handleCancelBooking}
          className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <XCircleIcon className="h-5 w-5 mr-2" />
          Hủy lịch
        </button>
      );
      
      // Nếu booking có link meeting
      if (booking.meetingUrl) {
        actions.push(
          <a
            key="meeting"
            href={booking.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Tham gia buổi tư vấn
          </a>
        );
      }
    }
    
    // Nếu booking đã hoàn thành và chưa đánh giá
    if (booking.status === BOOKING_STATUS.COMPLETED && !hasReviewedBooking) {
      actions.push(
        <button
          key="review"
          onClick={openReviewModal}
          className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <DocumentIcon className="h-5 w-5 mr-2" />
          Đánh giá
        </button>
      );
    }
    
    // Nếu booking đã hoàn thành và đã đánh giá
    if (booking.status === BOOKING_STATUS.COMPLETED && hasReviewedBooking) {
      actions.push(
        <button
          key="reviewed"
          onClick={openReviewDetailModal}
          className="w-full sm:w-auto flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <EyeIcon className="h-5 w-5 mr-2 text-blue-500" />
          Xem đánh giá
        </button>
      );
    }
    
    return (
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {actions}
      </div>
    );
  };
  
  // Hiển thị loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Hiển thị error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-800">Không thể tải thông tin buổi tư vấn</h3>
          <p className="mt-1 text-sm text-gray-600">{error.message}</p>
          <div className="mt-6">
            <Link
              to="/client/bookings"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Quay lại danh sách lịch hẹn
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Hiển thị booking không tồn tại
  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Không tìm thấy thông tin buổi tư vấn</h3>
          <p className="mt-1 text-sm text-gray-600">Buổi tư vấn bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <div className="mt-6">
            <Link
              to="/client/bookings"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Quay lại danh sách lịch hẹn
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Lấy thông tin trạng thái từ constants
  const statusDetail = BOOKING_STATUS_DETAILS[booking.status] || {
    name: booking.status,
    color: 'gray'
  };
  
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Phần đầu */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/client/bookings"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Quay lại danh sách lịch hẹn
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Chi tiết buổi tư vấn</h1>
        </div>
        <div>
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full ${getStatusColorClass(statusDetail.color)}`}>
            {statusDetail.name}
          </span>
        </div>
      </div>
      
      {/* Thông tin chung */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Thông tin buổi tư vấn</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Mã buổi tư vấn: {booking._id}
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Thông tin thời gian */}
            <div className="col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-base font-medium text-gray-900 mb-4">Thời gian</h4>
                <div className="space-y-4">
                  <div className="flex">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="ml-3">
                      <span className="text-sm text-gray-500">Ngày</span>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {formatDate(booking.date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="ml-3">
                      <span className="text-sm text-gray-500">Giờ</span>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="ml-3">
                      <span className="text-sm text-gray-500">Giá</span>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {formatCurrency(booking.price || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Thông tin chuyên gia */}
            <div className="col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-base font-medium text-gray-900 mb-4">Chuyên gia</h4>
                <div className="flex items-start">
                  {booking.expertDetails?.avatar ? (
                    <img 
                      src={booking.expertDetails.avatar} 
                      alt={booking.expertDetails.name} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="ml-3 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.expertDetails?.name || 'Chuyên gia'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.expertDetails?.field || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <Link
                        to={`/client/experts/${booking.expertId}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Xem thông tin chuyên gia
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Nội dung tư vấn */}
            {booking.note && (
              <div className="col-span-1 sm:col-span-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Nội dung tư vấn</h4>
                  <div className="prose prose-sm max-w-none text-gray-900">
                    {booking.note}
                  </div>
                </div>
              </div>
            )}
            
            {/* Tệp đính kèm */}
            {booking.attachments && booking.attachments.length > 0 && (
              <div className="col-span-1 sm:col-span-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Tệp đính kèm</h4>
                  <ul className="divide-y divide-gray-200">
                    {booking.attachments.map((attachment, index) => (
                      <li key={index} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <PaperClipIcon className="h-5 w-5 text-gray-400" />
                          <span className="ml-2 flex-1 text-sm text-gray-700 truncate">
                            {attachment.name || `Tệp đính kèm ${index + 1}`}
                          </span>
                        </div>
                        {attachment.url && (
                          <a
                            href={attachment.url}
                            download
                            className="ml-4 flex-shrink-0 text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            Tải xuống
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Phần thanh toán */}
      {booking.payment && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Thông tin thanh toán</h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="col-span-1">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Phương thức</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {booking.payment.method === 'vnpay' ? 'VNPay' : booking.payment.method}
                    </dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                    <dd className="mt-1 text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.payment.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : booking.payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.payment.status === 'completed' ? 'Đã thanh toán' : 
                         booking.payment.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                      </span>
                    </dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Ngày thanh toán</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {booking.payment.date ? formatDate(booking.payment.date) : 'N/A'}
                    </dd>
                  </div>
                  
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Số tiền</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCurrency(booking.payment.amount || booking.price || 0)}
                    </dd>
                  </div>
                </dl>
              </div>
              
              {booking.payment.transactionId && (
                <div className="col-span-1">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Thông tin giao dịch</h4>
                    <p className="text-sm text-gray-500">
                      Mã giao dịch: <span className="font-mono text-gray-900">{booking.payment.transactionId}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      {renderActions()}
      
      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        expertName={booking?.expertDetails?.name || 'Chuyên gia'}
      />
      
      {/* Review Detail Modal */}
      <ReviewDetail
        isOpen={isReviewDetailModalOpen}
        onClose={() => setIsReviewDetailModalOpen(false)}
        bookingId={bookingId}
        expertName={booking?.expertDetails?.name || 'Chuyên gia'}
      />
    </div>
  );
};

export default BookingDetail; 
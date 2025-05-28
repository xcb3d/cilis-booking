import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, ClockIcon, UserIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import axiosClient from '../../utils/axiosClient';

const ReviewDetail = ({ isOpen, onClose, bookingId, expertName }) => {
  const [reviewData, setReviewData] = useState(null);
  
  // Fetch review data
  const { data: review, isLoading, error } = useQuery({
    queryKey: ['bookingReview', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      try {
        const data = await axiosClient.get(`/clients/bookings/${bookingId}/review`);
        return data;
      } catch (error) {
        console.error('Error fetching review:', error);
        throw new Error(error.response?.data?.message || 'Không thể tải thông tin đánh giá');
      }
    },
    enabled: isOpen && !!bookingId
  });
  
  // Update local state when data changes
  useEffect(() => {
    if (review) {
      setReviewData(review);
    }
  }, [review]);
  
  if (!isOpen) return null;
  
  // Render stars for rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Add full stars
    for (let i = 1; i <= fullStars; i++) {
      stars.push(<StarIcon key={`full-${i}`} className="h-5 w-5 text-yellow-400" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative inline-block h-5 w-5">
          <StarOutlineIcon className="absolute h-5 w-5 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <StarIcon className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(<StarOutlineIcon key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
    }
    
    return stars;
  };
  
  // Get rating text based on rating value
  const getRatingText = (rating) => {
    if (rating <= 1) return 'Rất không hài lòng';
    if (rating <= 2) return 'Không hài lòng';
    if (rating <= 3) return 'Bình thường';
    if (rating <= 4) return 'Hài lòng';
    return 'Rất hài lòng';
  };
  
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Chi tiết đánh giá của bạn
                </h3>
                
                {isLoading ? (
                  <div className="py-8 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="py-8 text-center">
                    <p className="text-red-500">{error.message}</p>
                  </div>
                ) : !reviewData ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">Không tìm thấy đánh giá</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Expert info */}
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-700">Đánh giá của bạn về</span>
                      <span className="text-sm font-medium text-gray-900">{expertName}</span>
                    </div>
                    
                    {/* Booking info if available */}
                    {reviewData.bookingInfo && (
                      <div className="bg-blue-50 p-3 rounded-md text-sm">
                        <div className="flex items-center mb-1">
                          <CalendarIcon className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="font-medium text-gray-900">Thông tin buổi tư vấn:</span>
                        </div>
                        <p className="text-gray-700 ml-6">
                          {reviewData.bookingInfo.date && (
                            <span className="block">
                              Ngày: {new Date(reviewData.bookingInfo.date).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                          {reviewData.bookingInfo.time && (
                            <span className="block">
                              Thời gian: {reviewData.bookingInfo.time}
                            </span>
                          )}
                          {reviewData.bookingInfo.service && (
                            <span className="block">
                              Dịch vụ: {reviewData.bookingInfo.service}
                            </span>
                          )}
                          {reviewData.bookingInfo.duration && (
                            <span className="block">
                              Thời lượng: {reviewData.bookingInfo.duration} phút
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {/* Rating stars */}
                    <div>
                      <div className="flex items-center">
                        <div className="flex">{renderStars(reviewData.rating)}</div>
                        <span className="ml-2 text-sm text-gray-700">
                          <span className="font-medium mr-1">{Number(reviewData.rating).toFixed(1)}</span>
                          {getRatingText(reviewData.rating)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Comment */}
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
                        <span className="ml-1 text-sm font-medium text-gray-700">Nhận xét của bạn</span>
                      </div>
                      <p className="text-sm text-gray-800">{reviewData.comment || 'Không có nhận xét'}</p>
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>Đánh giá vào: {reviewData.formattedDate || new Date(reviewData.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    
                    {/* Reply if exists */}
                    {reviewData.reply && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Phản hồi từ chuyên gia</h4>
                        <div className="bg-blue-50 p-4 rounded-md">
                          <p className="text-sm text-gray-800">{reviewData.reply}</p>
                          {reviewData.replyDate && (
                            <p className="text-xs text-gray-500 mt-2">
                              Phản hồi vào: {new Date(reviewData.replyDate).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetail; 
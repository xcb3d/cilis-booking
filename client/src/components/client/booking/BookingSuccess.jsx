import React from 'react';
import { CheckCircleIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

/**
 * Component hiển thị thông báo thành công sau khi hoàn tất đặt lịch
 * @param {Object} props
 * @param {Object} props.bookingData - Dữ liệu đặt lịch
 * @param {Function} props.formatDate - Hàm định dạng ngày
 */
const BookingSuccess = ({ bookingData, formatDate }) => {
  const formatTimeRange = (timeSlot) => {
    return `${timeSlot.startTime} - ${timeSlot.endTime}`;
  };

  return (
    <div className="text-center max-w-md mx-auto py-6">
      <div className="flex justify-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500" />
      </div>
      
      <h2 className="mt-4 text-2xl font-bold text-gray-900">Đặt lịch thành công!</h2>
      
      <p className="mt-2 text-sm text-gray-500">
        Cảm ơn bạn đã đặt lịch tư vấn. Chúng tôi đã gửi xác nhận đặt lịch vào email của bạn.
      </p>
      
      {bookingData && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg text-left">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Chi tiết lịch hẹn</h3>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              Đã xác nhận
            </span>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="font-medium">{formatDate(bookingData.date)}</div>
                <div className="text-gray-500">
                  {bookingData.timeSlots?.map((slot, index) => (
                    <div key={index}>{formatTimeRange(slot)}</div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div><span className="text-gray-500">Họ tên:</span> {bookingData.name}</div>
              <div><span className="text-gray-500">Email:</span> {bookingData.email}</div>
              <div><span className="text-gray-500">Điện thoại:</span> {bookingData.phone}</div>
              {bookingData.message && (
                <div className="mt-1">
                  <span className="text-gray-500">Nội dung tư vấn:</span>
                  <p className="mt-1 text-gray-700">{bookingData.message}</p>
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="font-medium">Tổng phí:</div>
              <div className="text-blue-600 font-medium">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingData.totalFee)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Phương thức thanh toán: {bookingData.paymentMethod === 'banking' 
                  ? 'Chuyển khoản ngân hàng' 
                  : 'VNPay'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex flex-col items-center space-y-3">
        <Link 
          to="/client/bookings" 
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <div className="flex items-center justify-center">
            <span>Xem lịch hẹn của tôi</span>
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </div>
        </Link>
        
        <Link 
          to="/" 
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
};

export default BookingSuccess; 
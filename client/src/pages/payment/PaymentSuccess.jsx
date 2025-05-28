import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import axiosClient from '../../utils/axiosClient';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const bookingId = searchParams.get('bookingId');
  
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        if (!bookingId) {
          setError('Không tìm thấy thông tin đặt lịch');
          setLoading(false);
          return;
        }
        
        // Gọi API để lấy thông tin booking
        const response = await axiosClient.get(`/payment/status/${bookingId}`);
        setBookingData(response);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching booking data:', error);
        setError('Không thể tải thông tin đặt lịch');
        setLoading(false);
      }
    };
    
    fetchBookingData();
  }, [bookingId]);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="bg-white shadow sm:rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">Lỗi</h1>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-4">
              <Link
                to="/client/bookings"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Xem lịch đặt của tôi
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="bg-white shadow sm:rounded-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Thanh toán thành công!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cảm ơn bạn đã đặt lịch và thanh toán. Chúng tôi đã gửi thông tin xác nhận vào email của bạn.
          </p>
        </div>
        
        {bookingData && (
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Thông tin đặt lịch</h2>
            
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-gray-500">Mã đặt lịch:</dt>
                <dd className="text-gray-900 col-span-2 font-medium">{bookingId}</dd>
              </div>
              
              {bookingData.date && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-gray-500">Ngày tư vấn:</dt>
                  <dd className="text-gray-900 col-span-2">{formatDate(bookingData.date)}</dd>
                </div>
              )}
              
              {bookingData.startTime && bookingData.endTime && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-gray-500">Thời gian:</dt>
                  <dd className="text-gray-900 col-span-2">{bookingData.startTime} - {bookingData.endTime}</dd>
                </div>
              )}
              
              {bookingData.paymentAmount && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-gray-500">Số tiền:</dt>
                  <dd className="text-gray-900 col-span-2 font-semibold">{formatCurrency(bookingData.paymentAmount)}</dd>
                </div>
              )}
              
              {bookingData.paymentMethod && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-gray-500">Thanh toán:</dt>
                  <dd className="text-gray-900 col-span-2">
                    VNPay
                  </dd>
                </div>
              )}
              
              {bookingData.paymentDate && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-gray-500">Ngày thanh toán:</dt>
                  <dd className="text-gray-900 col-span-2">{formatDate(bookingData.paymentDate)}</dd>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
          <Link
            to="/client/bookings"
            className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Xem lịch đặt của tôi
          </Link>
          <Link
            to="/client/home"
            className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 
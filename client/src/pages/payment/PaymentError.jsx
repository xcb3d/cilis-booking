import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/outline';

const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('code');
  
  const getErrorMessage = (code) => {
    switch (code) {
      case '01':
        return 'Giao dịch đã tồn tại';
      case '02':
        return 'Merchant không hợp lệ (kiểm tra lại vnp_TmnCode)';
      case '03':
        return 'Dữ liệu gửi sang không đúng định dạng';
      case '04':
        return 'Khởi tạo GD không thành công do Website đang bị tạm khóa';
      case '05':
        return 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch';
      case '13':
        return 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)';
      case '07':
        return 'Giao dịch bị nghi ngờ là giao dịch gian lận';
      case '09':
        return 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng';
      case '10':
        return 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần';
      case '11':
        return 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán';
      case '12':
        return 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa';
      case '24':
        return 'Giao dịch không thành công do: Khách hàng hủy giao dịch';
      case '51':
        return 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch';
      case '65':
        return 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày';
      case '75':
        return 'Ngân hàng thanh toán đang bảo trì';
      case '79':
        return 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán nhiều lần';
      case '99':
        return 'Lỗi không xác định';
      default:
        return 'Giao dịch thanh toán không thành công';
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="bg-white shadow sm:rounded-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Thanh toán thất bại</h1>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(errorCode)}
          </p>
        </div>
        
        <div className="mt-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Giao dịch của bạn không được hoàn thành. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
                </p>
              </div>
            </div>
          </div>
        </div>
        
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

export default PaymentError; 
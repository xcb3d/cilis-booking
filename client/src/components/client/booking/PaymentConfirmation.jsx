import React, { useEffect } from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';

/**
 * Component xác nhận và thanh toán đặt lịch
 * @param {Object} props
 * @param {string} props.selectedDate - Ngày đã chọn
 * @param {Array} props.selectedTimeSlots - Các khung giờ đã chọn
 * @param {Object} props.formData - Dữ liệu form từ bước 2
 * @param {number} props.fee - Phí dịch vụ
 * @param {string} props.formatDate - Hàm định dạng ngày
 * @param {string} props.paymentMethod - Phương thức thanh toán đã chọn
 * @param {Function} props.setPaymentMethod - Hàm cập nhật phương thức thanh toán
 */
const PaymentConfirmation = ({ 
  selectedDate, 
  selectedTimeSlots, 
  formData, 
  fee, 
  formatDate,
  paymentMethod,
  setPaymentMethod
}) => {
  // Tính thời gian tư vấn
  const totalDuration = selectedTimeSlots.length;
  const totalFee = fee * totalDuration;
  
  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };
  
  // Danh sách các slot đã chọn (sắp xếp theo thời gian)
  const sortedTimeSlots = [...selectedTimeSlots].sort((a, b) => {
    const aStart = a.startTime || a.start;
    const bStart = b.startTime || b.start;
    return aStart.localeCompare(bStart);
  });
  
  // Lấy thời gian bắt đầu và kết thúc
  const firstSlot = sortedTimeSlots[0];
  const lastSlot = sortedTimeSlots[sortedTimeSlots.length - 1];
  const startTime = firstSlot ? (firstSlot.startTime || firstSlot.start) : '';
  const endTime = lastSlot ? (lastSlot.endTime || lastSlot.end) : '';
  
  // Tự động chọn VNPay khi component được tải
  useEffect(() => {
    setPaymentMethod('vnpay');
  }, [setPaymentMethod]);
  
  return (
    <div>
      {/* Thông tin đặt lịch */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Thông tin đặt lịch
        </h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <dl className="divide-y divide-gray-200">
            <div className="py-2 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Ngày tư vấn:</dt>
              <dd className="text-sm text-gray-900 col-span-2">{formatDate(selectedDate)}</dd>
            </div>
            <div className="py-2 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Thời gian:</dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {startTime} - {endTime} ({totalDuration} giờ)
              </dd>
            </div>
            <div className="py-2 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Họ tên:</dt>
              <dd className="text-sm text-gray-900 col-span-2">{formData.name}</dd>
            </div>
            <div className="py-2 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Email:</dt>
              <dd className="text-sm text-gray-900 col-span-2">{formData.email}</dd>
            </div>
            <div className="py-2 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Điện thoại:</dt>
              <dd className="text-sm text-gray-900 col-span-2">{formData.phone}</dd>
            </div>
            {formData.message && (
              <div className="py-2 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Ghi chú:</dt>
                <dd className="text-sm text-gray-900 col-span-2">{formData.message}</dd>
              </div>
            )}
            <div className="py-2 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Phí tư vấn:</dt>
              <dd className="text-sm text-gray-900 font-semibold col-span-2">
                {formatCurrency(fee)}/giờ × {totalDuration} giờ = {formatCurrency(totalFee)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Phương thức thanh toán */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Phương thức thanh toán
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {/* VNPay */}
          <div 
            className="border rounded-md p-4 border-blue-500 bg-blue-50"
          >
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full border border-blue-500 bg-blue-500 flex items-center justify-center mr-3">
                <span className="h-2 w-2 rounded-full bg-white"></span>
              </div>
              <div className="flex items-center">
                <CreditCardIcon className="h-6 w-6 text-gray-400 mr-2" />
                <span className="font-medium text-gray-900">Thanh toán trực tuyến (VNPay)</span>
              </div>
            </div>
            
            <div className="mt-3 ml-8">
              <p className="text-sm text-gray-700 mb-2">
                Thanh toán an toàn qua cổng VNPay với thẻ ATM nội địa, Visa, Master, JCB
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png" alt="VNPay" className="h-8" />
                <div className="border-r border-gray-300 h-8"></div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6" />
                <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/02/Logo-JCB.png" alt="JCB" className="h-6" />
              </div>
              
              <p className="mt-2 text-gray-600 italic text-xs">
                Bạn sẽ được chuyển đến trang thanh toán VNPay để chọn phương thức thanh toán phù hợp sau khi xác nhận đặt lịch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation; 
import React from 'react';

/**
 * Component hiển thị các bước đặt lịch
 * @param {Object} props
 * @param {number} props.currentStep - Bước hiện tại (1-3)
 */
const BookingSteps = ({ currentStep }) => {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            <span>1</span>
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${
              currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
            }`}>Chọn lịch</p>
          </div>
        </div>
        <div className={`flex-1 border-t-2 mx-4 ${
          currentStep >= 2 ? 'border-blue-600' : 'border-gray-200'
        }`}></div>
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            <span>2</span>
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${
              currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
            }`}>Thông tin</p>
          </div>
        </div>
        <div className={`flex-1 border-t-2 mx-4 ${
          currentStep >= 3 ? 'border-blue-600' : 'border-gray-200'
        }`}></div>
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            <span>3</span>
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${
              currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'
            }`}>Thanh toán</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSteps; 
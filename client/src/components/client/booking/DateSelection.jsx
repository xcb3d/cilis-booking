import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Component chọn ngày đặt lịch
 * @param {Object} props
 * @param {Date} props.selectedDate - Ngày đã chọn
 * @param {Function} props.onDateSelect - Hàm xử lý khi chọn ngày
 * @param {Object} props.availability - Thông tin về lịch làm việc của chuyên gia
 * @param {Function} props.getAvailableDays - Hàm lấy các ngày có thể đặt lịch
 * @param {Function} props.formatDate - Hàm format date thành string
 */
const DateSelection = ({ 
  selectedDate, 
  onDateSelect, 
  availability, 
  getAvailableDays,
  formatDate
}) => {
  return (
    <div className="mb-8">      
      {availability ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {getAvailableDays().map((date, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onDateSelect(date)}
              className={`p-3 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                selectedDate && date.toDateString() === selectedDate.toDateString()
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-xs uppercase">
                {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
              </div>
              <div className="font-semibold">
                {date.getDate()}/{date.getMonth() + 1}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <div className="text-sm text-yellow-700">
              <p>
                Không có dữ liệu lịch làm việc của chuyên gia. Vui lòng thử lại sau.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateSelection; 
import React from 'react';

/**
 * Component chọn khung giờ đặt lịch
 * @param {Object} props
 * @param {Date} props.selectedDate - Ngày đã chọn
 * @param {Array} props.timeSlots - Danh sách các khung giờ có sẵn
 * @param {Array} props.selectedTimeSlots - Danh sách các khung giờ đã chọn
 * @param {Function} props.onTimeSlotSelect - Hàm xử lý khi chọn khung giờ
 * @param {Function} props.formatDate - Hàm format date thành string
 * @param {boolean} props.isScheduleLoading - Trạng thái đang tải lịch
 */
const TimeSlotSelection = ({ 
  selectedDate, 
  timeSlots, 
  selectedTimeSlots, 
  onTimeSlotSelect,
  formatDate,
  isScheduleLoading 
}) => {
  if (!selectedDate) {
    return null;
  }

  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Giờ tư vấn - {formatDate(selectedDate)}
      </label>
      <p className="text-sm text-gray-500 mb-3">
        Chọn các khung giờ liên tiếp nhau để đặt lịch dài hơn. Thời lượng và tổng giá sẽ được tính dựa trên số khung giờ bạn chọn.
      </p>
      <p className="text-xs text-blue-600 mb-3">
        <strong>Lưu ý:</strong> Chỉ có thể chọn các khung giờ liên tiếp nhau. Ví dụ: bạn có thể chọn 8:00-9:00 và 9:00-10:00, nhưng không thể chọn 8:00-9:00 và 10:00-11:00.
      </p>
      
      {timeSlots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {timeSlots.map((slot, index) => {
            // Kiểm tra xem slot này đã được chọn chưa
            const isSelected = selectedTimeSlots.some(
              s => (s.startTime || s.start) === (slot.startTime || slot.start) && 
                   (s.endTime || s.end) === (slot.endTime || slot.end)
            );
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => onTimeSlotSelect(slot)}
                className={`p-3 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-green-300 bg-green-50 hover:bg-green-100 text-green-800'
                }`}
              >
                {slot.startTime || slot.start} - {slot.endTime || slot.end}
              </button>
            );
          })}
        </div>
      ) : isScheduleLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Đang tải lịch làm việc...</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Không có khung giờ nào trong ngày này.</p>
      )}
    </div>
  );
};

export default TimeSlotSelection; 
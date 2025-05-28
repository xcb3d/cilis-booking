import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import { format, startOfWeek, endOfWeek, addDays, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { BOOKING_STATUS_DETAILS } from '../../utils/constants';

const ExpertWeeklyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Tuần bắt đầu từ thứ 2
  const endDateObj = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  // Tạo mảng 7 ngày của tuần
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));
  
  // Format dates for API
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDateObj, 'yyyy-MM-dd');
  
  // Truy vấn API để lấy lịch làm việc trong tuần
  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ['expertWeekSchedule', startDateStr, endDateStr],
    queryFn: async () => {
      try {
        const response = await axiosClient.get(`/experts/schedule-week?startDate=${startDateStr}&endDate=${endDateStr}`);
        console.log('API response data:', response);
        // Đảm bảo trả về một mảng dữ liệu
        return Array.isArray(response) ? response : (response.data || []);
      } catch (error) {
        console.error('Error fetching expert week schedule:', error);
        return [];
      }
    }
  });
  
  // Thêm log để debug dữ liệu trong component
  console.log("Schedule data in component:", scheduleData);
  
  // Kiểm tra lỗi khi gọi API
  if (error) {
    console.error("Error in useQuery:", error);
  }
  
  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      if (direction === 'prev') {
        return addDays(prev, -7);
      } else {
        return addDays(prev, 7);
      }
    });
  };
  
  // Hàm lấy thông tin hiển thị trạng thái booking
  const getBookingStatusInfo = (booking) => {
    if (!booking || !booking.status) return null;
    
    const statusDetail = BOOKING_STATUS_DETAILS[booking.status];
    if (!statusDetail) return null;
    
    return {
      name: statusDetail.name,
      color: statusDetail.color,
      description: statusDetail.description
    };
  };
  
  // Hàm tạo lớp CSS cho booking status
  const getStatusColorClass = (color) => {
    if (!color) return 'bg-gray-100 text-gray-800';
    
    switch (color) {
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
      case 'green':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'red':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Lịch làm việc tuần</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-md border border-gray-300"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-sm">
            {format(startDate, 'dd/MM/yyyy', { locale: vi })} - {format(endDateObj, 'dd/MM/yyyy', { locale: vi })}
          </span>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-md border border-gray-300"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        {/* Header row with days */}
        <div className="grid grid-cols-7 bg-gray-50">
          {weekDays.map((day, i) => (
            <div key={i} className="px-4 py-3 text-center border-b border-r border-gray-200">
              <div className="font-medium">{format(day, 'EEEE', { locale: vi })}</div>
              <div className={`text-sm ${isToday(day) ? 'bg-blue-100 rounded-full px-2' : ''}`}>
                {format(day, 'dd/MM', { locale: vi })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Calendar content */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {isLoading ? (
            <div className="col-span-7 flex items-center justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="col-span-7 p-6 text-center">
              <p className="text-red-500">Có lỗi khi tải dữ liệu: {error.message || 'Không thể kết nối đến máy chủ'}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Thử lại
              </button>
            </div>
          ) : !scheduleData || scheduleData.length === 0 ? (
            <div className="col-span-7 p-6 text-center">
              <p className="text-gray-500">Không tìm thấy dữ liệu lịch làm việc cho tuần này</p>
            </div>
          ) : (
            <>
              {weekDays.map((day, dayIndex) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const daySchedule = scheduleData?.find(s => s.date === dateStr) || {};
                
                console.log(`Day ${dateStr} schedule:`, daySchedule);
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`p-4 border-r border-b border-gray-200 ${isToday(day) ? 'bg-blue-50' : ''}`}
                  >
                    {daySchedule.isUnavailable ? (
                      <div className="text-center py-4">
                        <p className="text-red-500 font-medium">Ngày nghỉ</p>
                      </div>
                    ) : daySchedule.timeSlots && daySchedule.timeSlots.length > 0 ? (
                      <div className="space-y-2">
                        {daySchedule.timeSlots.map((slot, slotIndex) => {
                          // Lấy thông tin trạng thái booking nếu có
                          const bookingStatusInfo = slot.booking ? getBookingStatusInfo(slot.booking) : null;
                          
                          // Xác định lớp CSS dựa trên trạng thái
                          let slotClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300'; // Khung giờ available
                          
                          if (!slot.available) {
                            if (slot.isOverridden) {
                              slotClass = 'bg-orange-100 text-orange-800 border border-orange-300'; // Ngoại lệ
                            } else if (bookingStatusInfo) {
                              slotClass = getStatusColorClass(bookingStatusInfo.color); // Booking với trạng thái cụ thể
                            } else {
                              // Mặc định xem như một ngoại lệ nếu không available và không có booking
                              slotClass = 'bg-orange-100 text-orange-800 border border-orange-300';
                            }
                          }
                          
                          return (
                            <div 
                              key={slotIndex} 
                              className={`px-3 py-2 rounded-md text-sm ${slotClass}`}
                            >
                              <div>{slot.startTime} - {slot.endTime}</div>
                              {!slot.available && !slot.isOverridden && slot.booking && (
                                <div className="text-xs mt-1">
                                  <div className="font-medium">{bookingStatusInfo?.name || 'Đã đặt lịch'}</div>
                                  {bookingStatusInfo?.description && (
                                    <div className="text-xs opacity-75">{bookingStatusInfo.description}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400">Chưa có lịch</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
      
      {/* Chú thích */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-emerald-100 border border-emerald-300 rounded mr-2"></span>
            <span>Khung giờ trống</span>
          </div>
          {Object.values(BOOKING_STATUS_DETAILS).map((status, index) => {
            // Bỏ qua trạng thái "cancelled" vì không sử dụng trong lịch
            if (status.color === 'red') return null;
            
            return (
              <div key={index} className="flex items-center">
                <span className={`inline-block w-4 h-4 ${getStatusColorClass(status.color).split(' ')[0]} border rounded mr-2`}></span>
                <span>{status.name}</span>
              </div>
            );
          })}
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-orange-100 border border-orange-300 rounded mr-2"></span>
            <span>Không khả dụng (ngoại lệ)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertWeeklyCalendar; 
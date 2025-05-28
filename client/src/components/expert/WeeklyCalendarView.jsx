import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isToday, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';

const WeeklyCalendarView = () => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Tuần bắt đầu từ thứ 2

  // Tạo mảng 7 ngày của tuần
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));

  // Truy vấn API để lấy lịch làm việc của chuyên gia trong tuần
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['expertWeeklySchedule', user?.expertId, format(startDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user?.expertId) return [];
      
      // Gọi API lấy lịch làm việc cho từng ngày trong tuần
      const schedules = await Promise.all(
        weekDays.map(async (day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const response = await axiosClient.get(`/api/client/expert-schedule/${user.expertId}/${dateStr}`);
          return {
            date: dateStr,
            ...response.data
          };
        })
      );
      
      return schedules;
    },
    enabled: !!user?.expertId,
  });

  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      if (direction === 'prev') {
        return addDays(prev, -7);
      } else {
        return addDays(prev, 7);
      }
    });
  };

  const formatTimeSlot = (slot) => {
    if (!slot) return '';
    return `${slot.startTime} - ${slot.endTime}`;
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Lịch làm việc tuần
        </h3>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigateWeek('prev')}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {format(startDate, "dd/MM/yyyy", { locale: vi })} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM/yyyy", { locale: vi })}
          </span>
          <button
            type="button"
            onClick={() => navigateWeek('next')}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        <div className="grid grid-cols-7 bg-gray-50">
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className="px-6 py-3 text-center text-sm font-semibold text-gray-900 border-b border-r border-gray-200 last:border-r-0"
            >
              <div>{format(day, 'EEEE', { locale: vi })}</div>
              <div className={`text-sm mt-1 ${isToday(day) ? 'bg-blue-100 rounded-full px-2 py-1 inline-block' : ''}`}>
                {format(day, 'dd/MM', { locale: vi })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 min-h-[300px]">
          {isLoading ? (
            <div className="col-span-7 p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Đang tải lịch làm việc...</p>
            </div>
          ) : (
            <>
              {weekDays.map((day, dayIndex) => {
                const daySchedule = scheduleData?.find(s => isSameDay(parseISO(s.date), day)) || {};
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`p-4 border-r border-b border-gray-200 last:border-r-0 ${
                      isToday(day) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {daySchedule.unavailable ? (
                      <div className="text-center py-4">
                        <p className="text-red-500 font-medium">Không lịch làm việc</p>
                      </div>
                    ) : daySchedule.timeSlots && daySchedule.timeSlots.length > 0 ? (
                      <div className="space-y-2">
                        {daySchedule.timeSlots.map((slot, slotIndex) => (
                          <div 
                            key={slotIndex} 
                            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm"
                          >
                            {formatTimeSlot(slot)}
                          </div>
                        ))}
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
    </div>
  );
};

export default WeeklyCalendarView; 
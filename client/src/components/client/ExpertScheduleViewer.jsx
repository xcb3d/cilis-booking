import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import ScheduleCalendar from '../expert/ScheduleCalendar';
import axiosClient from '../../utils/axiosClient';

/**
 * Component hiển thị lịch làm việc của chuyên gia cho khách hàng
 * Khách hàng có thể xem ngày nào chuyên gia có lịch trống và chọn khung giờ phù hợp
 * 
 * @param {Object} props
 * @param {String} props.expertId - ID của chuyên gia
 * @param {Object} props.expert - Thông tin của chuyên gia
 * @param {Function} props.onTimeSlotSelect - Callback khi chọn khung giờ
 */
const ExpertScheduleViewer = ({ expertId, expert, onTimeSlotSelect }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [formattedDate, setFormattedDate] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [highlightDates, setHighlightDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Lấy ngày có lịch trống trong 1 tháng tới
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        // Tính ngày hiện tại và ngày 30 ngày sau
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);
        
        const formatDateParam = (date) => date.toISOString().split('T')[0];
        
        // Gọi API để lấy các ngày có lịch trống trong khoảng thời gian
        const response = await axiosClient.get(`/clients/experts/${expertId}/available-dates`, {
          params: {
            startDate: formatDateParam(startDate),
            endDate: formatDateParam(endDate)
          }
        });
        
        if (response && response.availableDates) {
          setHighlightDates(response.availableDates);
        }
      } catch (err) {
        console.error('Error fetching available dates:', err);
        setError('Không thể tải lịch làm việc. Vui lòng thử lại sau.');
      }
    };
    
    if (expertId) {
      fetchAvailableDates();
    }
  }, [expertId]);
  
  // Lấy lịch làm việc khi chọn ngày
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedDate) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const dateString = selectedDate.split('T')[0];
        
        // Gọi API để lấy lịch làm việc của chuyên gia theo ngày
        const response = await axiosClient.get(`/clients/experts/${expertId}/schedule`, {
          params: { date: dateString }
        });
        
        // Định dạng ngày hiển thị
        const date = new Date(dateString);
        setFormattedDate(
          date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
          })
        );
        
        if (response) {
          if (response.isUnavailable) {
            setAvailableTimeSlots([]);
          } else if (response.timeSlots && Array.isArray(response.timeSlots)) {
            // Chuẩn hóa dữ liệu từ API để phù hợp với cấu trúc hiển thị
            // API có thể trả về start/end hoặc startTime/endTime
            const normalizedSlots = response.timeSlots.map(slot => ({
              startTime: slot.startTime || slot.start,
              endTime: slot.endTime || slot.end,
              available: slot.available !== undefined ? slot.available : true // Nếu không có trường available, mặc định là true
            }));
            
            // Lọc ra các slot còn trống (nếu có trường available)
            const availableSlots = response.timeSlots.some(slot => slot.available !== undefined) 
              ? normalizedSlots.filter(slot => slot.available)
              : normalizedSlots; // Nếu không có trường available nào, lấy tất cả slots
            
            setAvailableTimeSlots(availableSlots);
            
            console.log('Normalized timeslots:', availableSlots);
          } else {
            setAvailableTimeSlots([]);
          }
        } else {
          setAvailableTimeSlots([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Không thể tải lịch làm việc. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchSchedule();
  }, [expertId, selectedDate]);
  
  // Xử lý khi chọn ngày
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };
  
  // Xử lý khi chọn khung giờ
  const handleTimeSlotSelect = (timeSlot) => {
    if (onTimeSlotSelect) {
      // Đảm bảo timeslot có cấu trúc đúng
      const normalizedTimeSlot = {
        startTime: timeSlot.startTime || timeSlot.start,
        endTime: timeSlot.endTime || timeSlot.end,
        available: timeSlot.available !== undefined ? timeSlot.available : true
      };
      
      onTimeSlotSelect({
        date: selectedDate,
        timeSlot: normalizedTimeSlot
      });
    }
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Lịch làm việc</h2>
        <p className="mt-1 text-sm text-gray-500">
          Chọn ngày và giờ phù hợp với bạn để đặt lịch tư vấn với chuyên gia
        </p>
      </div>
      
      <div className="p-4 md:p-6 space-y-6">
        {/* Hiển thị lịch */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Chọn ngày tư vấn</label>
          <div className="overflow-hidden">
            <ScheduleCalendar
              selectedDate={selectedDate}
              onChange={handleDateSelect}
              highlightDates={highlightDates}
              disablePastDates={true}
            />
          </div>
        </div>
        
        {/* Hiển thị khung giờ */}
        {selectedDate && (
          <div>
            <div className="flex items-center mb-4">
              <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-md font-medium text-gray-900">
                Khung giờ trống ngày {formattedDate}
              </h3>
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Đang tải lịch làm việc...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">{error}</div>
            ) : availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableTimeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimeSlotSelect(slot)}
                    className="flex flex-col items-center justify-center p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-green-800 relative group"
                  >
                    <div className="text-base font-medium">{slot.startTime}</div>
                    <div className="text-xs text-gray-500">đến {slot.endTime}</div>
                    <CheckCircleIcon className="absolute right-2 top-2 h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 px-4 border border-gray-200 rounded-lg bg-gray-50">
                <XCircleIcon className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 text-center">Không có khung giờ trống nào trong ngày này.</p>
                <p className="text-sm text-gray-400 text-center mt-1">Vui lòng chọn một ngày khác.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Nút đặt lịch */}
        {selectedDate && availableTimeSlots.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              to={`/client/booking/${expertId}?date=${selectedDate}&time=${availableTimeSlots[0].startTime || availableTimeSlots[0].start}`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Đặt lịch ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertScheduleViewer; 
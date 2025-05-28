import { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

/**
 * Component lịch chọn ngày với giao diện đẹp
 * @param {Object} props
 * @param {Date|null} props.selectedDate - Ngày đang được chọn
 * @param {Function} props.onChange - Callback khi chọn ngày
 * @param {Array} props.highlightDates - Mảng các ngày đặc biệt cần đánh dấu
 * @param {Boolean} props.disablePastDates - Có vô hiệu hóa các ngày trong quá khứ không
 */
const ScheduleCalendar = ({ selectedDate, onChange, highlightDates = [], disablePastDates = true }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const [animating, setAnimating] = useState('');
  const calendarRef = useRef(null);
  
  // Xử lý đóng lịch khi nhấp ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        // Gọi callback để đóng lịch từ component cha
        // Lưu ý: Component cha phải tự xử lý đóng lịch
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Chuyển sang tháng trước
  const prevMonth = () => {
    setAnimating('left');
    setTimeout(() => {
      setCurrentMonth(subMonths(currentMonth, 1));
      setAnimating('');
    }, 150);
  };
  
  // Chuyển sang tháng sau
  const nextMonth = () => {
    setAnimating('right');
    setTimeout(() => {
      setCurrentMonth(addMonths(currentMonth, 1));
      setAnimating('');
    }, 150);
  };
  
  // Chuyển sang tháng hiện tại
  const goToToday = () => {
    setCurrentMonth(new Date());
  };
  
  // Lấy các ngày trong tháng hiện tại
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Lấy ngày đầu tiên trong tuần đầu tiên của tháng (0 = Chủ nhật, 1 = Thứ 2,...)
  const startDay = getDay(monthStart);
  
  // Mảng tên các ngày trong tuần
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  // Kiểm tra một ngày có được đánh dấu không
  const isHighlighted = (date) => {
    return highlightDates.some(highlightDate => 
      isSameDay(new Date(highlightDate), date)
    );
  };
  
  // Lấy giá trị date mà không có thời gian
  const getDateValue = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // CSS classes cho animation
  const animationClasses = {
    left: 'animate-slide-left',
    right: 'animate-slide-right',
    '': ''
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden" ref={calendarRef}>
      <style jsx="true">{`
        @keyframes slideLeft {
          0% { transform: translateX(10%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideRight {
          0% { transform: translateX(-10%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-left {
          animation: slideLeft 0.2s ease-out forwards;
        }
        .animate-slide-right {
          animation: slideRight 0.2s ease-out forwards;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .day-selected {
          animation: pulse 1s ease-in-out;
        }
      `}</style>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-white mb-3 md:mb-0 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: vi })}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium rounded-md bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
            >
              Hôm nay
            </button>
            <div className="flex rounded-md overflow-hidden shadow-sm">
              <button
                onClick={prevMonth}
                type="button"
                className="flex items-center justify-center w-12 h-12 bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <span className="sr-only">Tháng trước</span>
                <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                onClick={nextMonth}
                type="button"
                className="flex items-center justify-center w-12 h-12 bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <span className="sr-only">Tháng sau</span>
                <ChevronRightIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className={`grid grid-cols-7 gap-3 ${animationClasses[animating]}`}>
          {/* Header - Ngày trong tuần */}
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="text-center py-3 text-sm font-semibold text-gray-600"
            >
              {day}
            </div>
          ))}
          
          {/* Ngày trống trước ngày đầu tháng */}
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-start-${index}`} className="bg-white h-16 p-0.5" />
          ))}
          
          {/* Ngày trong tháng */}
          {daysInMonth.map((day) => {
            const isDisabled = disablePastDates && isBefore(day, new Date()) && !isToday(day);
            const isSelected = selectedDate ? isSameDay(day, new Date(selectedDate)) : false;
            const dateValue = getDateValue(day);
            const highlighted = isHighlighted(day);
            
            return (
              <button
                key={day.toString()}
                onClick={() => !isDisabled && onChange(dateValue)}
                disabled={isDisabled}
                type="button"
                className={`relative h-16 p-0.5 border-none focus:z-10 focus:outline-none ${
                  isDisabled 
                    ? 'cursor-not-allowed' 
                    : 'cursor-pointer'
                }`}
              >
                <div
                  className={`flex flex-col items-center justify-center h-full rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 transform hover:scale-105 day-selected'
                      : isToday(day)
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:scale-105'
                      : highlighted 
                      ? 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 hover:scale-105'
                      : isDisabled
                      ? 'bg-gray-100 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-800 hover:scale-105'
                  }`}
                >
                  <span className={`text-lg ${isSelected || isToday(day) ? 'font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Hiển thị dấu chấm nếu ngày được đánh dấu */}
                  {highlighted && !isSelected && (
                    <span className="absolute bottom-2 w-2 h-2 rounded-full bg-indigo-500"></span>
                  )}
                  
                  {/* Đánh dấu hôm nay */}
                  {isToday(day) && !isSelected && (
                    <span className="absolute top-2 right-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          
          {/* Ngày trống sau ngày cuối tháng (để lấp đầy grid) */}
          {Array.from({ length: (7 - ((daysInMonth.length + startDay) % 7)) % 7 }).map((_, index) => (
            <div key={`empty-end-${index}`} className="bg-white h-16 p-0.5" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar; 
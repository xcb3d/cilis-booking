import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import ScheduleCalendar from './ScheduleCalendar';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// Add CSS animation
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fadeIn 0.2s ease-in-out;
  }
  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slide-up {
    animation: slideUp 0.25s ease-out;
  }
`;

/**
 * Component quản lý pattern lịch làm việc của chuyên gia
 */
const SchedulePatternManager = () => {
  const queryClient = useQueryClient();
  const [patterns, setPatterns] = useState([]);
  const [expandedPattern, setExpandedPattern] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    daysOfWeek: [],
    timeSlots: [],
    validFrom: '',
    validTo: '',
    isActive: true
  });

  // Thêm state để quản lý trạng thái hiển thị lịch
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);

  // Fetch patterns
  const { data: patternsData, isLoading: isLoadingPatterns } = useQuery({
    queryKey: ['schedulePatterns'],
    queryFn: async () => {
      try {
        const response = await axiosClient.get('/experts/schedule-patterns');
        return response;
      } catch (error) {
        console.error('Error fetching schedule patterns:', error);
        throw error;
      }
    }
  });

  // Effect to update patterns when data is loaded
  useEffect(() => {
    if (patternsData) {
      setPatterns(patternsData);
    }
  }, [patternsData]);

  // Create pattern mutation
  const createPatternMutation = useMutation({
    mutationFn: async (patternData) => {
      const response = await axiosClient.post('/experts/schedule-patterns', patternData);
      return response;
    },
    onSuccess: () => {
      toast.success('Mẫu lịch làm việc đã được tạo thành công');
      queryClient.invalidateQueries({ queryKey: ['schedulePatterns'] });
      resetForm();
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo mẫu lịch làm việc');
    }
  });

  // Update pattern mutation
  const updatePatternMutation = useMutation({
    mutationFn: async ({ patternId, patternData }) => {
      const response = await axiosClient.put(`/experts/schedule-patterns/${patternId}`, patternData);
      return response;
    },
    onSuccess: () => {
      toast.success('Mẫu lịch làm việc đã được cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['schedulePatterns'] });
      resetForm();
      setIsEditing(null);
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật mẫu lịch làm việc');
    }
  });

  // Delete pattern mutation
  const deletePatternMutation = useMutation({
    mutationFn: async (patternId) => {
      const response = await axiosClient.delete(`/experts/schedule-patterns/${patternId}`);
      return response;
    },
    onSuccess: () => {
      toast.success('Mẫu lịch làm việc đã được xóa thành công');
      queryClient.invalidateQueries({ queryKey: ['schedulePatterns'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa mẫu lịch làm việc');
    }
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle days of week selection
  const handleDaySelection = (day) => {
    const daysOfWeek = [...formData.daysOfWeek];
    if (daysOfWeek.includes(day)) {
      // Remove day if already selected
      setFormData({
        ...formData,
        daysOfWeek: daysOfWeek.filter((d) => d !== day)
      });
    } else {
      // Add day if not selected
      setFormData({
        ...formData,
        daysOfWeek: [...daysOfWeek, day].sort()
      });
    }
  };

  // Remove time slot
  const removeTimeSlot = (index) => {
    const timeSlots = [...formData.timeSlots];
    timeSlots.splice(index, 1);
    setFormData({ ...formData, timeSlots });
  };

  // Submit form to create or update pattern
  const submitForm = () => {
    // Validate form
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên mẫu lịch làm việc');
      return;
    }
    
    if (formData.daysOfWeek.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày trong tuần');
      return;
    }
    
    if (formData.timeSlots.length === 0) {
      toast.error('Vui lòng chọn ít nhất một khung giờ');
      return;
    }
    
    if (!formData.validFrom || !formData.validTo) {
      toast.error('Vui lòng chọn thời gian hiệu lực');
      return;
    }
    
    // Kiểm tra xem đã đến ngày validTo chưa
    const today = new Date().toISOString().split('T')[0];
    if (formData.validTo < today) {
      toast.error('Ngày kết thúc hiệu lực không được nhỏ hơn ngày hiện tại');
      return;
    }
    
    // Kiểm tra validFrom <= validTo
    if (formData.validFrom > formData.validTo) {
      toast.error('Ngày bắt đầu phải trước hoặc cùng ngày với ngày kết thúc');
      return;
    }
    
    // Kiểm tra điều kiện thêm mới
    if (!isEditing && patterns.length > 0) {
      toast.error('Bạn chỉ có thể chỉnh sửa mẫu lịch hiện có, không thể tạo mẫu mới');
      return;
    }
    
    // Create or update pattern
    if (isEditing) {
      updatePatternMutation.mutate({
        patternId: isEditing,
        patternData: formData
      });
    } else {
      createPatternMutation.mutate(formData);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      daysOfWeek: [],
      timeSlots: [],
      validFrom: '',
      validTo: '',
      isActive: true
    });
  };

  // Start editing a pattern
  const startEditing = (pattern) => {
    setIsEditing(pattern._id);
    setFormData({
      name: pattern.name,
      daysOfWeek: pattern.daysOfWeek,
      timeSlots: pattern.timeSlots,
      validFrom: pattern.validFrom.slice(0, 10), // Format for input date
      validTo: pattern.validTo.slice(0, 10),
      isActive: pattern.isActive
    });
    setIsCreating(true);
  };

  // Cancel creating or editing
  const cancelForm = () => {
    setIsCreating(false);
    setIsEditing(null);
    resetForm();
  };

  // Thêm hàm formatDate
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format day of week
  const formatDayOfWeek = (day) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[day === 7 ? 0 : day]; // Convert 7 to 0 for Sunday
  };

  // Hàm tạo các khung giờ cố định 1 tiếng
  const generateFixedTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 23; hour++) {
      const startHour = hour.toString().padStart(2, '0');
      const endHour = (hour + 1).toString().padStart(2, '0');
      
      slots.push({
        start: `${startHour}:00`,
        end: `${endHour}:00`
      });
    }
    return slots;
  };

  // Thêm useEffect để đóng lịch khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      const calendarElements = document.querySelectorAll('.calendar-dropdown');
      let clickedOutside = true;
      
      calendarElements.forEach(element => {
        if (element.contains(event.target)) {
          clickedOutside = false;
        }
      });
      
      if (clickedOutside) {
        if (showFromCalendar) setShowFromCalendar(false);
        if (showToCalendar) setShowToCalendar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFromCalendar, showToCalendar]);

  if (isLoadingPatterns) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-700">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add animation styles */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Mẫu lịch làm việc</h2>
        {!isCreating && patterns.length === 0 && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Tạo mẫu mới
          </button>
        )}
      </div>

      {/* Form to create/edit pattern */}
      {isCreating && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {isEditing ? 'Chỉnh sửa mẫu lịch làm việc' : 'Tạo mẫu lịch làm việc mới'}
            </h3>
          </div>

          <div className="px-4 py-5 sm:p-6 space-y-4">
            {/* Pattern name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Tên mẫu
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ví dụ: Lịch làm việc thông thường"
              />
            </div>

            {/* Days of week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày trong tuần
              </label>
              <div className="grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDaySelection(day)}
                    className={`py-2.5 px-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                      formData.daysOfWeek.includes(day)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatDayOfWeek(day)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Khung giờ làm việc
                </label>
              </div>

              {/* Hiển thị các khung giờ đã chọn */}
              {formData.timeSlots.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Khung giờ đã chọn:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                    {formData.timeSlots.map((slot, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-3 bg-white rounded-lg border border-indigo-200 bg-indigo-50 shadow-sm"
                      >
                        <span className="text-sm font-medium text-indigo-800">{slot.start} - {slot.end}</span>
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                          disabled={formData.timeSlots.length <= 1}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Khung chọn các khung giờ cố định */}
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 transition-colors">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Chọn khung giờ làm việc:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {generateFixedTimeSlots().map((slot, index) => {
                    // Kiểm tra xem khung giờ này đã được chọn chưa
                    const isSelected = formData.timeSlots.some(
                      ts => ts.start === slot.start && ts.end === slot.end
                    );
                    
                    return (
                      <button
                        key={`slot-${index}`}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            // Xóa khung giờ đã chọn
                            setFormData({
                              ...formData,
                              timeSlots: formData.timeSlots.filter(
                                ts => !(ts.start === slot.start && ts.end === slot.end)
                              )
                            });
                          } else {
                            // Thêm khung giờ mới
                            setFormData({
                              ...formData,
                              timeSlots: [...formData.timeSlots, slot]
                            });
                          }
                        }}
                        className={`p-3 border rounded-lg text-center transition-colors hover:shadow-md ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                            : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        <span className="font-medium">{slot.start} - {slot.end}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Valid date range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700">
                  Có hiệu lực từ
                </label>
                <div className="mt-1 relative">
                  <div 
                    onClick={() => setShowFromCalendar(!showFromCalendar)}
                    className="block w-full cursor-pointer border border-gray-300 rounded-md shadow-sm py-2.5 px-4 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:bg-gray-50 hover:border-blue-300"
                  >
                    <div className="flex justify-between items-center">
                      <span className={formData.validFrom ? "text-gray-900 font-medium" : "text-gray-500"}>
                        {formData.validFrom ? formatDate(formData.validFrom) : 'Chọn ngày bắt đầu'}
                      </span>
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  
                  {showFromCalendar && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto py-10">
                      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm" onClick={() => setShowFromCalendar(false)}></div>
                      <div className="relative bg-white rounded-lg shadow-xl calendar-dropdown w-full max-w-3xl mx-auto animate-slide-up">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Chọn ngày bắt đầu</h3>
                            <button 
                              onClick={() => setShowFromCalendar(false)}
                              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            >
                              <span className="sr-only">Đóng</span>
                              <XCircleIcon className="h-7 w-7" />
                            </button>
                          </div>
                          <ScheduleCalendar
                            selectedDate={formData.validFrom || null}
                            onChange={(date) => {
                              setFormData({
                                ...formData,
                                validFrom: date
                              });
                              setShowFromCalendar(false);
                            }}
                            disablePastDates={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="validTo" className="block text-sm font-medium text-gray-700">
                  Đến ngày
                </label>
                <div className="mt-1 relative">
                  <div 
                    onClick={() => setShowToCalendar(!showToCalendar)}
                    className="block w-full cursor-pointer border border-gray-300 rounded-md shadow-sm py-2.5 px-4 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:bg-gray-50 hover:border-blue-300"
                  >
                    <div className="flex justify-between items-center">
                      <span className={formData.validTo ? "text-gray-900 font-medium" : "text-gray-500"}>
                        {formData.validTo ? formatDate(formData.validTo) : 'Chọn ngày kết thúc'}
                      </span>
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  
                  {showToCalendar && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto py-10">
                      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm" onClick={() => setShowToCalendar(false)}></div>
                      <div className="relative bg-white rounded-lg shadow-xl calendar-dropdown w-full max-w-3xl mx-auto animate-slide-up">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Chọn ngày kết thúc</h3>
                            <button 
                              onClick={() => setShowToCalendar(false)}
                              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            >
                              <span className="sr-only">Đóng</span>
                              <XCircleIcon className="h-7 w-7" />
                            </button>
                          </div>
                          <ScheduleCalendar
                            selectedDate={formData.validTo || null}
                            onChange={(date) => {
                              setFormData({
                                ...formData,
                                validTo: date
                              });
                              setShowToCalendar(false);
                            }}
                            disablePastDates={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active status */}
            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Kích hoạt mẫu này
              </label>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={cancelForm}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={submitForm}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isEditing ? 'Cập nhật' : 'Tạo mẫu'}
            </button>
          </div>
        </div>
      )}

      {/* List of patterns */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {patterns.length > 0 ? (
          <>
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center text-sm text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p>
                  Bạn chỉ có thể chỉnh sửa mẫu lịch hiện có, không thể tạo mẫu mới. Nhấn vào biểu tượng <PencilIcon className="inline-block h-4 w-4 text-blue-600" /> để sửa mẫu lịch.
                </p>
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {patterns.map((pattern) => (
                <li key={pattern._id} className="border-b last:border-0">
                  <div className="flex items-center justify-between px-5 py-5 sm:px-6 hover:bg-gray-50 cursor-pointer">
                    <div className="flex-1" onClick={() => setExpandedPattern(expandedPattern === pattern._id ? null : pattern._id)}>
                      <div className="flex items-center">
                        <h3 className="text-base font-semibold text-gray-900">{pattern.name}</h3>
                        <span className={`ml-2 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pattern.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pattern.isActive ? 'Đang kích hoạt' : 'Không kích hoạt'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Áp dụng: {pattern.daysOfWeek.map(formatDayOfWeek).join(', ')} | 
                        Hiệu lực: {formatDate(pattern.validFrom)} - {formatDate(pattern.validTo)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setExpandedPattern(expandedPattern === pattern._id ? null : pattern._id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        {expandedPattern === pattern._id ? (
                          <ChevronUpIcon className="h-6 w-6" />
                        ) : (
                          <ChevronDownIcon className="h-6 w-6" />
                        )}
                      </button>
                      <button
                        onClick={() => startEditing(pattern)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        <PencilIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Bạn có chắc chắn muốn xóa mẫu lịch làm việc này?')) {
                            deletePatternMutation.mutate(pattern._id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded view */}
                  {expandedPattern === pattern._id && (
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Khung giờ làm việc:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {pattern.timeSlots.map((slot, index) => (
                          <div key={index} className="bg-white rounded-lg px-4 py-3 text-sm border-2 border-gray-200 shadow-sm">
                            {slot.start} - {slot.end}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-500 mb-4">Chưa có mẫu lịch làm việc nào</p>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Tạo mẫu mới
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePatternManager; 
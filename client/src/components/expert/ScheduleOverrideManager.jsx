import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';
import ScheduleCalendar from './ScheduleCalendar';

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
 * Component quản lý override lịch làm việc (ngoại lệ) cho các ngày cụ thể
 */
const ScheduleOverrideManager = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [overrides, setOverrides] = useState([]);
  const [focusDate, setFocusDate] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    date: '',
    type: 'override', // 'override' hoặc 'unavailable'
    timeSlots: []
  });
  
  // Options cho time slots
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  
  // New state for showing calendar
  const [showCalendar, setShowCalendar] = useState(false);
  
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
      
      if (clickedOutside && showCalendar) {
        setShowCalendar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);
  
  // Fetch schedule overrides
  const { data: overridesData, isLoading: isLoadingOverrides } = useQuery({
    queryKey: ['scheduleOverrides'],
    queryFn: async () => {
      try {
        const response = await axiosClient.get('/experts/schedule-overrides');
        return response;
      } catch (error) {
        console.error('Error fetching schedule overrides:', error);
        throw error;
      }
    }
  });
  
  // Fetch schedule pattern time slots khi chọn ngày
  const { data: patternTimeSlots, isLoading: isLoadingPattern, refetch: refetchPatternTimeSlots } = useQuery({
    queryKey: ['patternTimeSlots', formData.date],
    queryFn: async () => {
      if (!formData.date) return [];
      try {
        const response = await axiosClient.get(`/experts/schedule-pattern-slots?date=${formData.date}`);
        return response?.timeSlots || [];
      } catch (error) {
        console.error('Error fetching pattern time slots:', error);
        return [];
      }
    },
    enabled: !!formData.date
  });
  
  // Effect to update overrides when data is loaded
  useEffect(() => {
    if (overridesData) {
      setOverrides(overridesData);
    }
  }, [overridesData]);
  
  // Effect to update available time slots when pattern slots are loaded
  useEffect(() => {
    if (patternTimeSlots && !isEditing) {
      // Chỉ cập nhật nếu không đang trong chế độ chỉnh sửa
      // Chuẩn hóa patternTimeSlots để đảm bảo có các trường start và end
      const normalizedPatternTimeSlots = patternTimeSlots.map(slot => ({
        ...slot,
        start: slot.start || slot.startTime,
        end: slot.end || slot.endTime
      }));
      
      setAvailableTimeSlots(normalizedPatternTimeSlots);
      // Mặc định tất cả đều có sẵn
      setSelectedTimeSlots(normalizedPatternTimeSlots.map(slot => ({
        ...slot,
        available: true
      })));
    }
  }, [patternTimeSlots, isEditing]);
  
  // Create override mutation
  const createOverrideMutation = useMutation({
    mutationFn: async (overrideData) => {
      const response = await axiosClient.post('/experts/schedule-overrides', overrideData);
      return response;
    },
    onSuccess: () => {
      toast.success('Lịch ngoại lệ đã được tạo thành công');
      queryClient.invalidateQueries({ queryKey: ['scheduleOverrides'] });
      resetForm();
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo lịch ngoại lệ');
    }
  });
  
  // Add update override mutation
  const updateOverrideMutation = useMutation({
    mutationFn: async ({ overrideId, overrideData }) => {
      const response = await axiosClient.put(`/experts/schedule-overrides/${overrideId}`, overrideData);
      return response;
    },
    onSuccess: () => {
      toast.success('Lịch ngoại lệ đã được cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['scheduleOverrides'] });
      resetForm();
      setIsCreating(false);
      setIsEditing(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật lịch ngoại lệ');
    }
  });
  
  // Delete override mutation
  const deleteOverrideMutation = useMutation({
    mutationFn: async (overrideId) => {
      const response = await axiosClient.delete(`/experts/schedule-overrides/${overrideId}`);
      return response;
    },
    onSuccess: () => {
      toast.success('Lịch ngoại lệ đã được xóa thành công');
      queryClient.invalidateQueries({ queryKey: ['scheduleOverrides'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa lịch ngoại lệ');
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      // Check if date already exists in overrides
      const dateExists = overrides.some(override => 
        override.date === value && (!isEditing || override._id !== isEditing)
      );
      
      if (dateExists) {
        toast.error('Ngày này đã có lịch ngoại lệ');
        return;
      }
      
      // Khi chọn ngày mới, phải lấy lại timeSlots từ pattern
      setFormData({
        ...formData,
        date: value,
        timeSlots: [] // Reset timeSlots
      });
    } else if (name === 'type') {
      if (isEditing && value === 'override') {
        // Nếu đang chỉnh sửa và chuyển sang loại override, giữ lại timeSlots nếu có
        const currentOverride = overrides.find(o => o._id === isEditing);
        const hasTimeSlots = currentOverride && currentOverride.timeSlots && currentOverride.timeSlots.length > 0;
        
        if (hasTimeSlots && currentOverride.type === 'override') {
          // Nếu đã có timeSlots và loại cũ cũng là override, giữ nguyên
          setFormData({
            ...formData,
            type: value
          });
        } else {
          // Nếu không có timeSlots hoặc chuyển từ unavailable sang override
          // Lấy lại timeSlots từ pattern hoặc dùng slots cố định
          const slots = generateFixedTimeSlots();
          setSelectedTimeSlots(slots);
          setFormData({
            ...formData,
            type: value,
            timeSlots: slots
          });
        }
      } else {
        // Các trường hợp khác xử lý mặc định
        setFormData({
          ...formData,
          type: value,
          // Reset timeSlots nếu chọn unavailable
          timeSlots: value === 'unavailable' ? [] : formData.timeSlots
        });
        
        if (value === 'unavailable') {
          setSelectedTimeSlots([]);
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle time slot selection
  const handleTimeSlotChange = (slotIndex, available) => {
    const updatedTimeSlots = [...selectedTimeSlots];
    updatedTimeSlots[slotIndex] = {
      ...updatedTimeSlots[slotIndex],
      available
    };
    setSelectedTimeSlots(updatedTimeSlots);
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      date: '',
      type: 'override',
      timeSlots: []
    });
    setSelectedTimeSlots([]);
    setIsEditing(null);
  };
  
  // Start editing an override
  const startEditing = (override) => {
    console.log("startEditing called with override:", override);
    setIsEditing(override._id);
    setIsCreating(true);
    
    // Chuẩn hóa timeSlots để đảm bảo có các trường start và end
    const normalizedTimeSlots = override.timeSlots ? override.timeSlots.map(slot => ({
      ...slot,
      start: slot.start || slot.startTime,
      end: slot.end || slot.endTime,
      available: slot.available !== undefined ? slot.available : true,
      ...(slot.isCustom ? { isCustom: true } : {})
    })) : [];
    
    // Log ra để kiểm tra dữ liệu
    console.log("Original override data:", override);
    console.log("Normalized time slots:", normalizedTimeSlots);
    
    setFormData({
      date: override.date,
      type: override.type,
      timeSlots: normalizedTimeSlots
    });
    
    if (override.type === 'override' && override.timeSlots) {
      setSelectedTimeSlots(normalizedTimeSlots);
      // Cập nhật mảng availableTimeSlots khi chỉnh sửa
      setAvailableTimeSlots(normalizedTimeSlots.filter(slot => !slot.isCustom));
    } else {
      setSelectedTimeSlots([]);
    }
  };
  
  // Submit form to create or update override
  const submitForm = () => {
    // Validate form
    if (!formData.date.trim()) {
      toast.error('Vui lòng chọn ngày');
      return;
    }
    
    // Prepare data
    const data = {
      date: formData.date,
      type: formData.type
    };
    
    // If override, include time slots
    if (formData.type === 'override') {
      if (selectedTimeSlots.length === 0) {
        toast.error('Không có khung giờ nào được chọn');
        return;
      }
      
      // Chuẩn hóa time slots trước khi gửi lên API
      data.timeSlots = selectedTimeSlots.map(slot => {
        // Đảm bảo có cả start/startTime và end/endTime và trạng thái available
        return {
          start: slot.start || slot.startTime,
          end: slot.end || slot.endTime,
          startTime: slot.start || slot.startTime,
          endTime: slot.end || slot.endTime,
          available: slot.available !== undefined ? slot.available : true,
          ...(slot.isCustom ? { isCustom: true } : {})
        };
      });
    }
    
    console.log('Submitting data:', data);
    
    // Submit to server
    if (isEditing) {
      // Log để kiểm tra dữ liệu gửi đi khi cập nhật
      console.log(`Updating override ${isEditing} with data:`, data);
      updateOverrideMutation.mutate({
        overrideId: isEditing,
        overrideData: data
      });
    } else {
      createOverrideMutation.mutate(data);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Sort overrides by date
  const sortedOverrides = [...overrides].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  
  // Group overrides by month for display
  const groupedOverrides = sortedOverrides.reduce((groups, override) => {
    const date = new Date(override.date);
    const monthYear = date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(override);
    return groups;
  }, {});
  
  // Hàm tạo các khung giờ cố định 1 tiếng
  const generateFixedTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 23; hour++) {
      const startHour = hour.toString().padStart(2, '0');
      const endHour = (hour + 1).toString().padStart(2, '0');
      
      slots.push({
        start: `${startHour}:00`,
        end: `${endHour}:00`,
        available: true
      });
    }
    return slots;
  };
  
  if (isLoadingOverrides) {
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
        <h2 className="text-lg font-medium text-gray-900">Lịch làm việc ngoại lệ</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Tạo lịch ngoại lệ
          </button>
        )}
      </div>
      
      {/* Form to create/edit override */}
      {isCreating && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {isEditing ? 'Chỉnh sửa lịch làm việc ngoại lệ' : 'Tạo lịch làm việc ngoại lệ'}
            </h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6 space-y-4">
            {/* Date selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn ngày
              </label>
              <div className="mt-1 relative">
                <div 
                  onClick={() => {
                    if (!isEditing) { // Only allow changing date when creating new override
                      setShowCalendar(!showCalendar);
                    } else {
                      toast.info('Không thể thay đổi ngày khi chỉnh sửa. Hãy tạo lịch ngoại lệ mới nếu muốn thay đổi ngày.');
                    }
                  }}
                  className={`block w-full cursor-pointer border border-gray-300 rounded-md shadow-sm py-2.5 px-4 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 hover:bg-gray-50 hover:border-blue-300 ${isEditing ? 'opacity-75' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={formData.date ? "text-gray-900 font-medium" : "text-gray-500"}>
                      {formData.date ? formatDate(formData.date) : 'Chọn ngày'}
                    </span>
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* Thêm lại modal lịch */}
              {showCalendar && !isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto py-10">
                  <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm" onClick={() => setShowCalendar(false)}></div>
                  <div className="relative bg-white rounded-lg shadow-xl calendar-dropdown w-full max-w-3xl mx-auto animate-slide-up">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Chọn ngày</h3>
                        <button 
                          onClick={() => setShowCalendar(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        >
                          <span className="sr-only">Đóng</span>
                          <XCircleIcon className="h-7 w-7" />
                        </button>
                      </div>
                      <ScheduleCalendar
                        selectedDate={formData.date || null}
                        onChange={(date) => {
                          // Check if date already exists in overrides
                          const dateExists = overrides.some(override => override.date === date);
                          
                          if (dateExists) {
                            toast.error('Ngày này đã có lịch ngoại lệ');
                            return;
                          }
                          
                          setFormData({
                            ...formData,
                            date: date,
                            timeSlots: []
                          });
                          // Sau khi chọn ngày, lấy timeSlots từ pattern
                          if (formData.type === 'override') {
                            refetchPatternTimeSlots();
                          }
                          setShowCalendar(false);
                        }}
                        disablePastDates={true}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Override type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại ngoại lệ
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-sm">
                  <input
                    type="radio"
                    name="type"
                    value="override"
                    checked={formData.type === 'override'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Thay đổi khung giờ</span>
                </label>
                <label className="inline-flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-sm">
                  <input
                    type="radio"
                    name="type"
                    value="unavailable"
                    checked={formData.type === 'unavailable'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Không làm việc</span>
                </label>
              </div>
            </div>
            
            {/* Time slots */}
            {formData.type === 'override' && formData.date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khung giờ làm việc
                </label>
                
                {isLoadingPattern ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500">Đang tải khung giờ...</span>
                  </div>
                ) : (
                  <>
                    {/* Existing time slots */}
                    {availableTimeSlots.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">Khung giờ từ mẫu lịch:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {selectedTimeSlots.filter(slot => !slot.isCustom).map((slot, index) => (
                            <div
                              key={index}
                              className={`border-2 rounded-xl p-4 cursor-pointer flex justify-between items-center transition-all duration-200 ${
                                slot.available
                                  ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:shadow-md transform hover:scale-105'
                                  : 'bg-red-50 border-red-200 hover:bg-red-100 hover:shadow-md transform hover:scale-105'
                              }`}
                              onClick={() => handleTimeSlotChange(selectedTimeSlots.indexOf(slot), !slot.available)}
                            >
                              <span className="text-base font-medium">{slot.start} - {slot.end}</span>
                              {slot.available ? (
                                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                              ) : (
                                <XCircleIcon className="h-6 w-6 text-red-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
                        <div className="flex">
                          <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                          <span className="text-sm text-yellow-700">
                            {isEditing 
                              ? 'Không tìm thấy khung giờ trong lịch ngoại lệ này. Bạn có thể thêm khung giờ mới bên dưới.'
                              : 'Không tìm thấy lịch làm việc cho ngày này. Bạn có thể thêm khung giờ mới bên dưới.'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Custom time slots */}
                    {selectedTimeSlots.some(slot => slot.isCustom) && (
                      <div className="mt-6 space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">Khung giờ đã thêm:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {selectedTimeSlots.filter(slot => slot.isCustom).map((slot, index) => (
                            <div
                              key={`custom-${index}`}
                              className="border-2 rounded-xl p-4 flex justify-between items-center bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:shadow-md transition-all duration-200"
                            >
                              <span className="text-base font-medium">{slot.start} - {slot.end}</span>
                              <div className="flex items-center">
                                <button
                                  onClick={() => {
                                    const updatedSlots = selectedTimeSlots.filter(s => s !== slot);
                                    setSelectedTimeSlots(updatedSlots);
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Add new time slot */}
                    <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Thêm khung giờ mới:</h4>
                      
                      {(() => {
                        // Lọc ra các khung giờ cố định chưa được thêm
                        const fixedSlots = generateFixedTimeSlots();
                        const availableSlots = fixedSlots.filter(slot => 
                          !selectedTimeSlots.some(selectedSlot => 
                            selectedSlot.start === slot.start && selectedSlot.end === slot.end
                          )
                        );
                        
                        if (availableSlots.length === 0) {
                          return (
                            <div className="text-center py-3 text-gray-500">
                              <p>Tất cả khung giờ đã được thêm</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {availableSlots.map((slot, index) => (
                              <button
                                key={`fixed-slot-${index}`}
                                type="button"
                                onClick={() => {
                                  // Thêm khung giờ mới
                                  setSelectedTimeSlots([...selectedTimeSlots, { 
                                    ...slot, 
                                    isCustom: true 
                                  }]);
                                  
                                  toast.success('Đã thêm khung giờ mới');
                                }}
                                className="p-3 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 text-center transition-colors hover:shadow-md"
                              >
                                <span className="font-medium text-blue-800">{slot.start} - {slot.end}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setIsEditing(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={submitForm}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isEditing ? 'Cập nhật' : 'Tạo lịch ngoại lệ'}
            </button>
          </div>
        </div>
      )}
      
      {/* List of overrides */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {Object.keys(groupedOverrides).length > 0 ? (
          <div className="divide-y divide-gray-200">
            {Object.entries(groupedOverrides).map(([monthYear, monthOverrides]) => (
              <div key={monthYear} className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{monthYear}</h3>
                <ul className="space-y-3">
                  {monthOverrides.map((override) => (
                    <li 
                      key={override._id} 
                      className={`p-5 rounded-xl border-2 ${
                        override.type === 'unavailable'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-6 w-6 text-gray-500 mr-2" />
                            <span className="font-semibold text-base">{formatDate(override.date)}</span>
                            <span className={`ml-2 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              override.type === 'unavailable'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {override.type === 'unavailable' ? 'Nghỉ làm' : 'Thay đổi khung giờ'}
                            </span>
                          </div>
                          
                          {override.type === 'override' && override.timeSlots && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Khung giờ:</h4>
                              <div className="flex flex-wrap gap-2">
                                {override.timeSlots.map((slot, index) => (
                                  <div 
                                    key={index}
                                    className={`text-sm px-3 py-1.5 rounded-lg border ${
                                      slot.available
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : 'bg-red-50 border-red-200 text-red-700 line-through'
                                    }`}
                                  >
                                    {slot.start} - {slot.end}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              console.log("Edit button clicked for override:", override);
                              startEditing(override);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 transition-colors hover:bg-blue-50 rounded-full"
                          >
                            <PencilIcon className="h-6 w-6" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa lịch ngoại lệ này?')) {
                                deleteOverrideMutation.mutate(override._id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 p-1 transition-colors hover:bg-red-50 rounded-full"
                          >
                            <TrashIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-500 mb-4">Chưa có lịch ngoại lệ nào</p>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Tạo lịch ngoại lệ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleOverrideManager; 
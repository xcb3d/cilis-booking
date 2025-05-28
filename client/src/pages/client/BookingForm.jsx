import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../utils/axiosClient';

// Import các component con đã tách
import BookingSteps from '../../components/client/booking/BookingSteps';
import DateSelection from '../../components/client/booking/DateSelection';
import TimeSlotSelection from '../../components/client/booking/TimeSlotSelection';
import ContactForm from '../../components/client/booking/ContactForm';
import FileUpload from '../../components/client/booking/FileUpload';
import PaymentConfirmation from '../../components/client/booking/PaymentConfirmation';
import BookingSuccess from '../../components/client/booking/BookingSuccess';

const BookingForm = () => {
  const { expertId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State for booking information
  const [expert, setExpert] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingNote, setBookingNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [vnpayOption, setVnpayOption] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  
  // State để lưu trữ file đính kèm
  const [attachments, setAttachments] = useState([]);
  
  // Get date and time from URL query params if available
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');
    
    if (dateParam) {
      setSelectedDate(new Date(dateParam));
    }
    
    if (timeParam) {
      setSelectedTimeSlots(JSON.parse(timeParam));
    }
  }, [searchParams]);
  
  // Form handling
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      paymentMethod: 'vnpay'
    }
  });
  
  // Tự động điền form với thông tin người dùng hiện tại
  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('phone', user.phone || '');
    }
  }, [user, setValue]);
  
  // Load expert data
  const { data: expertData, isLoading: isExpertLoading, error: expertError } = useQuery({
    queryKey: ['expert', expertId],
    queryFn: async () => {
      const response = await axiosClient.get(`/clients/experts/${expertId}`);
      return response;
    }
  });
  
  // Cập nhật thông tin expert và availability từ kết quả API
  useEffect(() => {
    if (expertData) {
      setExpert(expertData);
      
      // Khởi tạo mẫu đối tượng availability nếu không có từ API
      const defaultAvailability = {
        weekdays: [0, 1, 2, 3, 4, 5, 6], // Bao gồm cả thứ 7 (6) và chủ nhật (0)
        startTime: "08:00",
        endTime: "23:00"
      };
      
      // Khởi tạo đối tượng availability từ dữ liệu chuyên gia
      if (expertData.availability && Array.isArray(expertData.availability.weekdays)) {
        setAvailability(expertData.availability);
      } else if (expertData.availability) {
        // Trường hợp availability không có đúng cấu trúc
        const fixedAvailability = {
          ...expertData.availability
        };
        
        // Nếu weekdays không phải là array, thử chuyển đổi
        if (!Array.isArray(fixedAvailability.weekdays)) {
          try {
            if (typeof fixedAvailability.weekdays === 'string') {
              fixedAvailability.weekdays = JSON.parse(fixedAvailability.weekdays);
            } else {
              // Nếu không thể sửa, dùng mặc định
              fixedAvailability.weekdays = defaultAvailability.weekdays;
            }
          } catch (e) {
            fixedAvailability.weekdays = defaultAvailability.weekdays;
          }
        }
        
        setAvailability(fixedAvailability);
      } else {
        // Không có dữ liệu availability, dùng mặc định
        setAvailability(defaultAvailability);
      }
    }
  }, [expertData]);
  
  // Lấy lịch làm việc của chuyên gia nếu đã chọn ngày
  const { data: scheduleData, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['expertSchedule', expertId, selectedDate],
    queryFn: async () => {
      if (!selectedDate) {
        return null;
      }
      // Fix the timezone issue by using specific date components instead of toISOString()
      const dateParam = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      
      // Sử dụng endpoint client để lấy lịch chuyên gia
      try {
        const response = await axiosClient.get(`/clients/experts/${expertId}/schedule`, {
          params: {
            date: dateParam
          }
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!selectedDate
  });
  
  // Cập nhật time slots khi có dữ liệu schedule
  useEffect(() => {
    if (scheduleData && scheduleData.timeSlots) {
      // Chỉ lấy những slot có available = true
      const availableSlots = scheduleData.timeSlots
        .filter(slot => slot.available)
        .map(slot => ({
          ...slot,
          startTime: slot.start || slot.startTime,
          endTime: slot.end || slot.endTime
        }));
      
      setTimeSlots(availableSlots);
    } else {
      setTimeSlots([]);
    }
  }, [scheduleData]);
  
  // Update total price when selected time slots change or expert changes
  useEffect(() => {
    if (expertData && selectedTimeSlots.length > 0) {
      // Tính giá tiền dựa trên số lượng khung giờ đã chọn
      setTotalPrice(expertData.price * selectedTimeSlots.length);
    } else {
      setTotalPrice(0);
    }
  }, [selectedTimeSlots, expertData]);
  
  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  // Format date to locale string
  const formatDate = (date) => {
    if (!date) return '';
    const dayOfWeek = date.getDay(); // Get day of week (0 = Sunday, 1 = Monday, etc.)
    return `${new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`;
  };
  
  // Get next 7 available days
  const getAvailableDays = () => {
    if (!availability) {
      return [];
    }
    
    const days = [];
    const today = new Date();
    
    // Look ahead for the next 14 days to find 7 available days
    for (let i = 0; i < 14 && days.length < 7; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      
      const dayOfWeek = nextDate.getDay();
      
      // Check if this day is a working day
      if (availability.weekdays.includes(dayOfWeek)) {
        days.push(nextDate);
      }
    }
    
    return days;
  };
  
  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlots([]);
  };
  
  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    // Kiểm tra xem slot đã được chọn chưa
    const isSelected = selectedTimeSlots.some(
      s => (s.startTime || s.start) === (slot.startTime || slot.start) && 
           (s.endTime || s.end) === (slot.endTime || slot.end)
    );
    
    if (isSelected) {
      // Nếu đã chọn, bỏ chọn slot này
      setSelectedTimeSlots(selectedTimeSlots.filter(
        s => !((s.startTime || s.start) === (slot.startTime || slot.start) && 
               (s.endTime || s.end) === (slot.endTime || slot.end))
      ));
    } else {
      // Nếu chưa chọn, kiểm tra xem slot có liên tiếp với các slot đã chọn không
      if (selectedTimeSlots.length === 0 || areTimeSlotsConsecutive([...selectedTimeSlots, slot])) {
        // Nếu liên tiếp, thêm vào danh sách đã chọn
        setSelectedTimeSlots([...selectedTimeSlots, slot]);
      } else {
        // Nếu không liên tiếp, hiển thị thông báo
        toast.error('Vui lòng chỉ chọn các khung giờ liên tiếp nhau');
      }
    }
  };
  
  // Kiểm tra xem danh sách các slot có liên tiếp nhau không
  const areTimeSlotsConsecutive = (slots) => {
    if (slots.length <= 1) return true;
    
    // Sắp xếp slots theo thời gian bắt đầu
    const sortedSlots = [...slots].sort((a, b) => {
      const aStart = a.startTime || a.start;
      const bStart = b.startTime || b.start;
      return aStart.localeCompare(bStart);
    });
    
    // Kiểm tra từng cặp slot liên tiếp
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentSlotEnd = sortedSlots[i].endTime || sortedSlots[i].end;
      const nextSlotStart = sortedSlots[i + 1].startTime || sortedSlots[i + 1].start;
      
      // Nếu thời gian kết thúc của slot hiện tại không bằng thời gian bắt đầu của slot tiếp theo
      if (currentSlotEnd !== nextSlotStart) {
        return false;
      }
    }
    
    return true;
  };
  
  // Go to next step
  const nextStep = () => {
    if (bookingStep === 1) {
      if (!selectedDate) {
        toast.error('Vui lòng chọn ngày tư vấn');
        return;
      }
      
      if (selectedTimeSlots.length === 0) {
        toast.error('Vui lòng chọn ít nhất một khung giờ tư vấn');
        return;
      }
    }
    
    setBookingStep(bookingStep + 1);
    window.scrollTo(0, 0);
  };
  
  // Go to previous step
  const prevStep = () => {
    setBookingStep(bookingStep - 1);
    window.scrollTo(0, 0);
  };
  
  // Xử lý khi người dùng thêm file đính kèm
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Kiểm tra kích thước file (giới hạn 5MB mỗi file)
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length < files.length) {
      toast.error('Một số file quá lớn và đã bị bỏ qua. Giới hạn 5MB mỗi file.');
    }
    
    // Thêm file mới vào danh sách file hiện tại
    setAttachments([...attachments, ...validFiles]);
    
    // Reset input file để có thể chọn lại file đã chọn nếu cần
    e.target.value = null;
  };
  
  // Xóa file đính kèm
  const handleRemoveFile = (index) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  // Mutation để tạo booking
  const createBookingMutation = useMutation({
    mutationFn: (bookingData) => {
      setIsSubmitting(true);
      
      return axiosClient.post('/clients/bookings', bookingData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Quan trọng cho FormData
        },
      });
    },
    onSuccess: (response) => {
      setIsSubmitting(false);
      
      // Lấy dữ liệu booking từ phản hồi
      const bookingData = response.data.booking;
      const bookingId = response.data._id || (bookingData && bookingData._id);
      
      setBookingSuccess(true);
      
      // Chuẩn bị dữ liệu cho trang success
      const formValues = getValues();
      setSuccessData({
        date: selectedDate,
        timeSlots: selectedTimeSlots,
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone,
        message: formValues.message,
        totalFee: totalPrice,
        paymentMethod: paymentMethod,
        bookingId: bookingId
      });
      
      toast.success('Đặt lịch thành công!');
      // Thay đổi sang hiển thị trang thành công thay vì chuyển hướng
      setBookingStep(4);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.response?.data?.message || error.message || 'Đặt lịch thất bại. Vui lòng thử lại sau.');
    }
  });
  
  // Tạo URL thanh toán VNPay
  const createVnpayUrlMutation = useMutation({
    mutationFn: (paymentData) => {
      return axiosClient.post('/payment/create-payment', paymentData);
    },
    onSuccess: (response) => {
      // Đảm bảo truy cập đúng cấu trúc dữ liệu
      const responseData = response.data || response;
      const paymentUrl = responseData.paymentUrl;
      
      if (!paymentUrl) {
        toast.error('Không tìm thấy URL thanh toán trong phản hồi. Vui lòng thử lại.');
        throw new Error('Không tìm thấy URL thanh toán trong phản hồi');
      }
      
      // Hiện thông báo trước khi chuyển hướng
      toast.success('Đang chuyển hướng đến cổng thanh toán VNPay...');
      
      // Chuyển hướng đến trang thanh toán VNPay sau một khoảng thời gian ngắn
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1500);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.response?.data?.message || error.message || 'Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.');
    }
  });
  
  // Hàm xử lý submit form
  const handleSubmitBooking = async () => {
    try {
      if (!selectedDate || selectedTimeSlots.length === 0) {
        toast.error('Vui lòng chọn ngày và khung giờ');
        return;
      }
      
      // Sắp xếp các slots đã chọn theo thời gian bắt đầu
      const sortedSlots = [...selectedTimeSlots].sort((a, b) => {
        const aStart = a.startTime || a.start;
        const bStart = b.startTime || b.start;
        return aStart.localeCompare(bStart);
      });
      
      // Lấy thời gian bắt đầu từ slot đầu tiên và thời gian kết thúc từ slot cuối cùng
      const firstSlot = sortedSlots[0];
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      
      const startTime = firstSlot.startTime || firstSlot.start;
      const endTime = lastSlot.endTime || lastSlot.end;
      
      if (!startTime || !endTime) {
        toast.error('Khung giờ không hợp lệ');
        return;
      }
      
      // Chuyển đổi ngày một cách đúng đắn, tránh lỗi múi giờ
      const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      
      // Tạo FormData để gửi cả dữ liệu và file
      const formData = new FormData();
      const formValues = getValues();
      
      formData.append('expertId', expertId);
      formData.append('date', dateString);
      formData.append('startTime', startTime);
      formData.append('endTime', endTime);
      formData.append('note', bookingNote);
      formData.append('name', formValues.name);
      formData.append('email', formValues.email);
      formData.append('phone', formValues.phone);
      formData.append('message', formValues.message || '');
      formData.append('paymentMethod', 'vnpay');
      
      // Thêm file vào FormData
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      
      setIsSubmitting(true);
      
      // Luôn xử lý thanh toán qua VNPay
      try {
        // Step 1: Tạo booking
        const bookingResponse = await axiosClient.post('/clients/bookings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (!bookingResponse) {
          throw new Error('Không nhận được phản hồi từ máy chủ khi tạo đặt lịch');
        }
        
        // Step 2: Trích xuất booking ID
        // Cấu trúc phản hồi: { message, booking: {...}, _id }
        const bookingId = bookingResponse._id || 
                          (bookingResponse.booking && bookingResponse.booking._id);
        
        if (!bookingId) {
          throw new Error('Không tìm thấy ID đặt lịch trong phản hồi');
        }
        
        // Step 3: Tạo thanh toán VNPay với booking ID
        const paymentData = {
          bookingId: bookingId,
          amount: totalPrice
        };
        
        // Sử dụng mutation để tạo URL thanh toán
        createVnpayUrlMutation.mutate(paymentData);
        
      } catch (error) {
        setIsSubmitting(false);
        toast.error(`Lỗi xử lý đặt lịch: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      setIsSubmitting(false);
      toast.error(`Lỗi xử lý đặt lịch: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`);
    }
  };
  
  if (isExpertLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin chuyên gia...</p>
        </div>
      </div>
    );
  }
  
  if (expertError || !expertData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Chuyên gia không tồn tại</h2>
          <p className="mt-2 text-gray-600">Chuyên gia bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link to="/client/experts" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            ← Quay lại danh sách chuyên gia
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <Link to={`/client/experts/${expertId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Quay lại thông tin chuyên gia
        </Link>
        
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Đặt lịch tư vấn</h1>
            <p className="mt-2 text-lg text-gray-600">
              Đặt lịch tư vấn với {expertData.name} - Chuyên gia {expertData.field}
            </p>
          </div>
          
          {/* Progress steps */}
          <div className="mb-10">
            <BookingSteps currentStep={bookingStep} />
          </div>
          
          {/* Step 1: Choose date and time */}
          {bookingStep === 1 && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Chọn ngày và giờ</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Vui lòng chọn ngày và giờ phù hợp với lịch trình của bạn
                </p>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                {/* Date selection */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày tư vấn</label>
                  
                  <DateSelection 
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    availability={availability}
                    getAvailableDays={getAvailableDays}
                    formatDate={formatDate}
                  />
                </div>
                
                {/* Time slots */}
                <TimeSlotSelection 
                  selectedDate={selectedDate}
                  timeSlots={timeSlots}
                  selectedTimeSlots={selectedTimeSlots}
                  onTimeSlotSelect={handleTimeSlotSelect}
                  formatDate={formatDate}
                  isScheduleLoading={isScheduleLoading}
                />
              </div>
              
              <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Giá: <span className="font-semibold">{formatCurrency(expertData.price)}</span>/giờ
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    Tổng: <span className="font-bold">{formatCurrency(totalPrice)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          )}
          
          {/* Step 2: Enter contact information */}
          {bookingStep === 2 && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Thông tin liên hệ</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Thông tin đã được điền tự động từ hồ sơ của bạn. Bạn có thể chỉnh sửa nếu cần.
                </p>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <ContactForm 
                  register={register}
                  errors={errors}
                  user={user}
                />
                
                <div className="mt-6">
                  <FileUpload 
                    attachments={attachments}
                    handleFileChange={handleFileChange}
                    removeAttachment={handleRemoveFile}
                  />
                </div>
              </div>
              
              <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Payment */}
          {bookingStep === 3 && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Xác nhận và thanh toán</h2>
                <p className="mt-1 text-sm text-gray-500">Vui lòng xác nhận thông tin đặt lịch của bạn</p>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <PaymentConfirmation 
                  selectedDate={selectedDate}
                  selectedTimeSlots={selectedTimeSlots}
                  formData={getValues()}
                  fee={expertData.price}
                  formatDate={formatDate}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                />
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú cho buổi tư vấn
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Thêm ghi chú cho buổi tư vấn (không bắt buộc)"
                    value={bookingNote}
                    onChange={e => setBookingNote(e.target.value)}
                  />
                </div>
                
                {/* File attachments section */}
                <div className="mt-6">
                  <FileUpload 
                    attachments={attachments}
                    handleFileChange={handleFileChange}
                    removeAttachment={handleRemoveFile}
                  />
                </div>
                
                {/* Hiển thị thông báo đang xử lý khi isSubmitting=true */}
                {isSubmitting && (
                  <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          {attachments.length > 0 
                            ? `Đang xử lý đặt lịch và tải lên ${attachments.length} tệp đính kèm. Vui lòng đợi một lát...` 
                            : 'Đang xử lý đặt lịch. Vui lòng đợi một lát...'}
                        </p>
                        {attachments.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            Quá trình tải lên tệp đính kèm có thể mất vài phút tùy thuộc vào kích thước file và tốc độ mạng.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {attachments.length > 0 ? 'Đang xử lý và tải file...' : 'Đang xử lý...'}
                    </>
                  ) : (
                    'Xác nhận đặt lịch'
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Step 4: Success */}
          {bookingStep === 4 && bookingSuccess && successData && (
            <BookingSuccess 
              bookingData={successData}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm; 
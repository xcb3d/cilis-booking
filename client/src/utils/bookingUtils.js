/**
 * BOOKING UTILITIES - Logic xử lý booking phía frontend
 */

// Format thời gian booking
export const formatBookingTime = (date, timeSlot) => {
  const bookingDate = new Date(date);
  const [hours, minutes] = timeSlot.split(':');
  bookingDate.setHours(parseInt(hours), parseInt(minutes));
  
  return {
    date: bookingDate.toLocaleDateString('vi-VN'),
    time: timeSlot,
    fullDateTime: bookingDate.toLocaleString('vi-VN'),
    timestamp: bookingDate.getTime()
  };
};

// Tính toán tổng tiền booking
export const calculateBookingPrice = (basePrice, duration, discountPercent = 0) => {
  if (basePrice < 0 || duration < 0 || discountPercent < 0 || discountPercent > 100) {
    return null;
  }
  
  const subtotal = basePrice * duration;
  const discount = subtotal * (discountPercent / 100);
  const total = subtotal - discount;
  
  return {
    subtotal,
    discount,
    total,
    formatted: {
      subtotal: subtotal.toLocaleString('vi-VN') + ' VNĐ',
      discount: discount.toLocaleString('vi-VN') + ' VNĐ', 
      total: total.toLocaleString('vi-VN') + ' VNĐ'
    }
  };
};

// Kiểm tra slot thời gian có available không
export const isTimeSlotAvailable = (timeSlot, bookedSlots, expertSchedule) => {
  // Kiểm tra slot đã bị book chưa
  if (bookedSlots.includes(timeSlot)) {
    return false;
  }
  
  // Kiểm tra trong schedule của expert
  const [hours] = timeSlot.split(':');
  const slotHour = parseInt(hours);
  
  if (expertSchedule) {
    const workingHours = expertSchedule.workingHours || {};
    const startHour = parseInt(workingHours.start?.split(':')[0] || 8);
    const endHour = parseInt(workingHours.end?.split(':')[0] || 17);
    
    return slotHour >= startHour && slotHour < endHour;
  }
  
  return true;
};

// Lấy available time slots cho 1 ngày
export const getAvailableTimeSlots = (date, bookedSlots = [], expertSchedule = null) => {
  const allSlots = [
    '08:00', '09:00', '10:00', '11:00', 
    '14:00', '15:00', '16:00', '17:00'
  ];
  
  const availableSlots = allSlots.filter(slot => 
    isTimeSlotAvailable(slot, bookedSlots, expertSchedule)
  );
  
  return availableSlots;
};

// Validate booking data
export const validateBookingData = (bookingData) => {
  const errors = [];
  
  if (!bookingData.expertId) {
    errors.push('Vui lòng chọn chuyên gia');
  }
  
  if (!bookingData.date) {
    errors.push('Vui lòng chọn ngày');
  } else {
    const bookingDate = new Date(bookingData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate <= today) {
      errors.push('Ngày booking phải là ngày trong tương lai');
    }
  }
  
  if (!bookingData.timeSlot) {
    errors.push('Vui lòng chọn giờ');
  }
  
  if (!bookingData.duration || bookingData.duration <= 0) {
    errors.push('Thời lượng phải lớn hơn 0');
  }
  
  if (!bookingData.clientInfo?.name) {
    errors.push('Vui lòng nhập tên');
  }
  
  if (!bookingData.clientInfo?.phone) {
    errors.push('Vui lòng nhập số điện thoại');
  } else {
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(bookingData.clientInfo.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }
  }
  
  if (!bookingData.clientInfo?.email) {
    errors.push('Vui lòng nhập email');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.clientInfo.email)) {
      errors.push('Email không hợp lệ');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format booking status for display
export const formatBookingStatus = (status) => {
  const statusMap = {
    'pending': { text: 'Chờ thanh toán', color: 'orange', icon: '⏳' },
    'confirmed': { text: 'Đã xác nhận', color: 'blue', icon: '✅' },
    'completed': { text: 'Đã hoàn thành', color: 'green', icon: '✅' },
    'canceled': { text: 'Đã hủy', color: 'red', icon: '❌' }
  };
  
  return statusMap[status] || { text: 'Không xác định', color: 'gray', icon: '❓' };
};
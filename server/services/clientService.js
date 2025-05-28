// server/services/clientService.js
import clientModel from '../models/clientModel.js';
import expertModel from '../models/expertModel.js';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { BOOKING_STATUS } from '../utils/constants.js';

// Helper function to calculate duration between two time strings (format: "HH:00")
function calculateDuration(startTime, endTime) {
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  
  // Return duration in hours
  return endHour - startHour;
}

// Lấy danh sách booking của khách hàng
async function getClientBookings(clientId, filterParams, page = 1, limit = 10, cursor = null) {
  try {
    // Phân tách các tham số lọc
    const { filter, search, date, field } = filterParams || {};
    
    console.log('Client service getClientBookings with params:', {
      clientId,
      filter,
      search,
      date,
      field,
      page,
      limit,
      cursor
    });
    
    // Sử dụng hàm mới getClientBookingsWithDetails với aggregation để lọc trực tiếp từ DB
    // và tự động join với thông tin expert
    const result = await clientModel.getClientBookingsWithDetails(
      clientId, 
      filter,  // Chỉ truyền giá trị filter, không phải toàn bộ filterParams
      page, 
      limit, 
      cursor
    );
    
    // Trả về kết quả đã được lọc và bổ sung thông tin chi tiết
    return result;
  } catch (error) {
    console.error('Error getting client bookings:', error);
    throw error;
  }
}

// Tạo booking mới
async function createBooking(clientId, bookingData) {
  try {
    console.log(`ClientService - Creating booking for client ${clientId} with expert ${bookingData.expertId}`);
    
    const { expertId, date, startTime, endTime } = bookingData;
    
    // Kiểm tra đầu vào
    if (!expertId || !date || !startTime || !endTime) {
      throw new Error('Thiếu thông tin cần thiết');
    }
    
    // Kiểm tra xem expert có tồn tại không
    const expert = await clientModel.getExpertById(expertId);
    if (!expert) {
      throw new Error('Chuyên gia không tồn tại');
    }
    
    // Tạo booking mới
    const newBooking = {
      clientId: new ObjectId(clientId),
      expertId: new ObjectId(expertId),
      date,
      startTime,
      endTime,
      duration: calculateDuration(startTime, endTime),
      price: expert.price || 0,
      note: bookingData.note || '',
      attachments: bookingData.attachments || [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Lưu booking vào database
    const booking = await clientModel.createBooking(newBooking);
    
    // Cập nhật thống kê sau khi tạo booking mới
    const { updateBookingStats } = await import('../utils/bookingStatsUtil.js');
    await updateBookingStats(clientId, expertId, null, 'pending');
    
    console.log(`ClientService - Created booking with ID: ${booking._id}`);
    return booking;
    
  } catch (error) {
    console.error(`ClientService - Create booking error:`, error);
    throw error;
  }
}

// Hủy booking
async function cancelBooking(clientId, bookingId) {
  try {
    console.log(`ClientService - Canceling booking ${bookingId} for client ${clientId}`);
    
    // Kiểm tra booking tồn tại và thuộc về client đang gọi
    const booking = await clientModel.getBookingById(bookingId);
    
    if (!booking) {
      throw new Error('Booking không tồn tại');
    }
    
    if (booking.clientId.toString() !== clientId.toString()) {
      throw new Error('Bạn không có quyền hủy booking này');
    }
    
    // Chỉ cho phép hủy booking có trạng thái là pending hoặc confirmed
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new Error(`Không thể hủy booking với trạng thái ${booking.status}`);
    }
    
    // Cập nhật trạng thái thành "canceled"
    const oldStatus = booking.status;
    await clientModel.cancelBooking(bookingId, clientId);
    
    // Cập nhật thống kê sau khi hủy booking
    const { updateBookingStats } = await import('../utils/bookingStatsUtil.js');
    await updateBookingStats(clientId, booking.expertId, oldStatus, 'canceled');
    
    return { success: true };
  } catch (error) {
    console.error(`ClientService - Cancel booking error:`, error);
    throw error;
  }
}

// Lấy danh sách chuyên gia
async function getAllExperts() {
  try {
    const experts = await clientModel.getAllExperts();
    
    // Loại bỏ thông tin nhạy cảm
    return experts.map(expert => {
      const { password, ...expertWithoutPassword } = expert;
      return expertWithoutPassword;
    });
  } catch (error) {
    throw error;
  }
}

// Tìm kiếm chuyên gia
async function searchExperts(query) {
  try {
    const experts = await clientModel.searchExperts(query);
    
    // Loại bỏ thông tin nhạy cảm
    return experts.map(expert => {
      const { password, ...expertWithoutPassword } = expert;
      return expertWithoutPassword;
    });
  } catch (error) {
    throw error;
  }
}

// Lọc chuyên gia theo lĩnh vực
async function filterExpertsByField(field) {
  try {
    const experts = await clientModel.filterExpertsByField(field);
    
    // Loại bỏ thông tin nhạy cảm
    return experts.map(expert => {
      const { password, ...expertWithoutPassword } = expert;
      return expertWithoutPassword;
    });
  } catch (error) {
    throw error;
  }
}

// Lấy thông tin chi tiết của chuyên gia
async function getExpertDetail(expertId) {
  try {
    const expert = await clientModel.getExpertById(expertId);
    
    if (!expert) {
      throw new Error('Chuyên gia không tồn tại');
    }
    
    // Loại bỏ thông tin nhạy cảm
    const { password, ...expertWithoutPassword } = expert;
    
    return expertWithoutPassword;
  } catch (error) {
    throw error;
  }
}

// Cập nhật hồ sơ khách hàng
async function updateClientProfile(clientId, profileData) {
  try {
    // Không cho phép cập nhật role qua API này
    delete profileData.role;
    
    // Không cập nhật password qua API này
    delete profileData.password;
    
    const result = await clientModel.updateClientProfile(clientId, profileData);
    
    if (result.modifiedCount === 0) {
      throw new Error('Cập nhật hồ sơ thất bại');
    }
    
    return { success: true, message: 'Cập nhật hồ sơ thành công' };
  } catch (error) {
    throw error;
  }
}

// Thêm đánh giá cho chuyên gia
async function addReview(clientId, reviewData) {
  try {
    // Kiểm tra booking có tồn tại không
    if (reviewData.bookingId) {
      const booking = await clientModel.getBookingById(reviewData.bookingId);
      
      if (!booking) {
        throw new Error('Booking không tồn tại');
      }
      
      // Kiểm tra booking có thuộc về client này không
      if (booking.clientId.toString() !== clientId.toString()) {
        throw new Error('Bạn không có quyền đánh giá booking này');
      }
      
      // Kiểm tra booking đã hoàn thành chưa
      if (booking.status !== 'completed') {
        throw new Error('Chỉ có thể đánh giá booking đã hoàn thành');
      }
    }
    
    // Thêm đánh giá
    await clientModel.addReview({
      clientId,
      expertId: reviewData.expertId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      bookingId: reviewData.bookingId ? new ObjectId(reviewData.bookingId) : null
    });
    
    return { success: true, message: 'Thêm đánh giá thành công' };
  } catch (error) {
    throw error;
  }
}

// Lấy lịch làm việc của chuyên gia theo ngày
async function getExpertScheduleByDate(expertId, date) {
  try {
    console.log(`ClientService - Getting expert schedule for date: ${date}, expertId: ${expertId}`);
    
    // Kiểm tra chuyên gia có tồn tại không
    const expert = await clientModel.getExpertById(expertId);
    
    if (!expert) {
      throw new Error('Chuyên gia không tồn tại');
    }
    
    // Lấy ngày trong tuần (0-6, với 0 là chủ nhật)
    const dayOfWeek = new Date(date).getDay();
    
    // Lấy patterns cho ngày trong tuần này (cả default pattern và các pattern khác)
    const patterns = await expertModel.getSchedulePatternsByDayOfWeek(expertId, dayOfWeek);
    
    // Lấy time slots từ patterns
    let timeSlots = [];
    
    if (patterns && patterns.length > 0) {
      // Kết hợp tất cả time slots từ các pattern
      patterns.forEach(pattern => {
        if (pattern.timeSlots && Array.isArray(pattern.timeSlots)) {
          const normalizedSlots = pattern.timeSlots.map(slot => ({
            startTime: slot.startTime || slot.start,
            endTime: slot.endTime || slot.end,
            available: true // Mặc định đặt available là true
          }));
          
          timeSlots = [...timeSlots, ...normalizedSlots];
        }
      });
      
      // Sắp xếp theo thời gian bắt đầu
      timeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    
    // Kiểm tra xem ngày này có override không
    const override = await expertModel.getScheduleOverrideByDate(expertId, date);
    
    // Biến đánh dấu loại lịch
    let scheduleType = 'pattern';
    
    if (override) {
      console.log(`ClientService - Found override for date ${date}:`, override);
      
      // Nếu là ngày unavailable
      if (override.type === 'unavailable') {
        return { 
          date, 
          timeSlots: [], 
          type: 'unavailable'
        };
      }
      
      // Nếu là override, hợp nhất với time slots từ pattern
      if (override.type === 'override' && override.timeSlots && Array.isArray(override.timeSlots)) {
        console.log('ClientService - Merging override slots with pattern slots');
        
        // Tạo một Map từ time slots trong pattern
        // Sử dụng cặp start-end làm key
        const timeSlotsMap = new Map();
        
        timeSlots.forEach(slot => {
          const key = `${slot.startTime}-${slot.endTime}`;
          timeSlotsMap.set(key, slot);
        });
        
        // Áp dụng override lên các time slots
        override.timeSlots.forEach(overrideSlot => {
          const startTime = overrideSlot.startTime || overrideSlot.start;
          const endTime = overrideSlot.endTime || overrideSlot.end;
          const key = `${startTime}-${endTime}`;
          
          // Chuẩn hóa override slot
          const normalizedOverrideSlot = {
            startTime: startTime,
            endTime: endTime,
            available: overrideSlot.available !== undefined ? overrideSlot.available : true
          };
          
          // Kiểm tra xem slot này có tồn tại trong pattern không
          if (!timeSlotsMap.has(key)) {
            // Nếu không tồn tại, đánh dấu là khung giờ tùy chỉnh
            normalizedOverrideSlot.isCustom = true;
          }
          
          // Thay thế time slot trong map nếu có, hoặc thêm mới
          timeSlotsMap.set(key, normalizedOverrideSlot);
        });
        
        // Chuyển Map trở lại thành mảng
        timeSlots = Array.from(timeSlotsMap.values());
        
        // Sắp xếp lại
        timeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        scheduleType = 'override';
      }
    }
    
    // Kiểm tra xem đã có booking nào cho ngày này chưa
    const bookings = await clientModel.getBookingsByExpertAndDate(expertId, date);
    
    if (bookings && bookings.length > 0) {
      // Cập nhật trạng thái available của các time slots dựa trên booking
      for (const booking of bookings) {
        for (let i = 0; i < timeSlots.length; i++) {
          const slot = timeSlots[i];
          
          // Kiểm tra xem slot này có nằm trong khoảng thời gian của booking không
          if (slot.startTime >= booking.startTime && slot.endTime <= booking.endTime) {
            // Đánh dấu slot này là không khả dụng
            timeSlots[i] = { ...slot, available: false };
          }
        }
      }
    }
    
    // Trả về kết quả đã được tối ưu hóa
    return { 
      date, 
      timeSlots,
      type: scheduleType
    };
  } catch (error) {
    console.error('ClientService - Error getting expert schedule by date:', error);
    throw error;
  }
}

// Cập nhật thông tin thanh toán của booking
async function updateBookingPayment(bookingId, paymentData) {
  try {
    console.log('ClientService - Updating booking payment for ID:', bookingId);
    
    // Kiểm tra booking tồn tại
    const booking = await clientModel.getBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }
    
    // Gọi hàm updateBookingPayment của clientModel
    const result = await clientModel.updateBookingPayment(bookingId, paymentData);
    
    console.log('ClientService - Payment update result:', result);
    
    // Kiểm tra kết quả cập nhật
    if (!result || result.modifiedCount === 0) {
      console.warn('ClientService - No documents were modified in updateBookingPayment');
      return false;
    }
    
    // Lưu ý: Không cập nhật stats ở đây để tránh cập nhật 2 lần
    // Stats sẽ được cập nhật trong updateBookingStatus khi status thay đổi
    
    return true;
  } catch (error) {
    console.error('ClientService - Error updating booking payment:', error);
    throw error;
  }
}

// Lấy thông tin booking theo ID
async function getBookingById(bookingId) {
  try {
    console.log(`ClientService - Getting booking with ID: ${bookingId}`);
    
    if (!bookingId) {
      console.error('ClientService - Invalid bookingId:', bookingId);
      throw new Error('ID đặt lịch không hợp lệ');
    }
    
    const booking = await clientModel.getBookingById(bookingId);
    
    if (!booking) {
      console.error(`ClientService - Booking with ID ${bookingId} not found`);
      throw new Error('Không tìm thấy thông tin đặt lịch');
    }
    
    console.log(`ClientService - Found booking:`, {
      id: booking._id,
      date: booking.date,
      status: booking.status,
      paymentStatus: booking.paymentStatus || 'not set'
    });
    
    return booking;
  } catch (error) {
    console.error(`ClientService - Error getting booking by ID: ${bookingId}`, error);
    throw error;
  }
}

// Cập nhật trạng thái booking
async function updateBookingStatus(bookingId, status, updatedBy) {
  try {
    console.log(`[STATUS DEBUG] clientService.updateBookingStatus - Start updating booking ${bookingId} to status ${status}`);
    console.log(`[STATUS DEBUG] Stack trace:`, new Error().stack);
    
    const booking = await clientModel.getBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }
    
    if (booking.status === status) {
      console.log(`[STATUS DEBUG] clientService.updateBookingStatus - Booking ${bookingId} already has status ${status}, skipping update`);
      return { 
        success: false, 
        message: `Booking đã có trạng thái ${status}` 
      };
    }
    
    // Nếu trạng thái là "completed", cập nhật thời gian hoàn thành
    const updateData = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    // Cập nhật người cập nhật
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }
    
    const oldStatus = booking.status;
    console.log(`[STATUS DEBUG] clientService.updateBookingStatus - Calling clientModel.updateBookingStatus for booking ${bookingId}, old status: ${oldStatus}, new status: ${status}`);
    const result = await clientModel.updateBookingStatus(bookingId, updateData);
    
    // Sau khi cập nhật trạng thái booking, cập nhật thống kê
    // Sử dụng utility function từ file riêng
    console.log(`[STATUS DEBUG] clientService.updateBookingStatus - Calling updateBookingStats for booking ${bookingId}, client: ${booking.clientId}, expert: ${booking.expertId}`);
    const { updateBookingStats } = await import('../utils/bookingStatsUtil.js');
    await updateBookingStats(booking.clientId, booking.expertId, oldStatus, status);
    
    console.log(`[STATUS DEBUG] clientService.updateBookingStatus - Completed updating booking ${bookingId} to status ${status}`);
    return { 
      success: true, 
      message: `Cập nhật trạng thái booking thành ${status} thành công` 
    };
  } catch (error) {
    console.error(`ClientService - Error updating booking status:`, error);
    throw error;
  }
}

// Hàm cập nhật thống kê booking đã được chuyển sang utils/bookingStatsUtil.js

// Lấy các ngày có lịch trống của chuyên gia trong khoảng thời gian
async function getExpertAvailableDates(expertId, startDate, endDate) {
  try {
    // Thay vì lấy từ collection schedules, tạo danh sách các ngày và kiểm tra pattern/override
    const start = new Date(startDate);
    const end = new Date(endDate);
    return await getAvailableDatesInRange(expertId, start, end);
  } catch (error) {
    console.error('Error in getExpertAvailableDates service:', error);
    throw error;
  }
}

// Lấy đánh giá của chuyên gia
async function getExpertReviews(expertId, page = 1, limit = 10) {
  try {
    // Sử dụng hàm getReviews từ expertModel
    const result = await expertModel.getReviews(expertId, page, limit);
    
    // Thêm tính toán phân bố đánh giá theo số sao
    const reviews = result.reviews || [];
    const totalReviews = result.pagination.total || 0;
    
    // Tính toán số lượng đánh giá cho mỗi mức sao (1-5)
    const ratingCounts = {};
    
    // Khởi tạo mặc định là 0 cho mỗi rating
    for (let i = 1; i <= 5; i++) {
      ratingCounts[i] = 0;
    }
    
    // Đếm số đánh giá cho mỗi mức sao
    for (const review of reviews) {
      const rating = Math.round(review.rating); // Làm tròn rating đến số nguyên gần nhất
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating]++;
      }
    }
    
    return {
      ...result,
      ratingCounts,
      totalReviews
    };
  } catch (error) {
    console.error('Error in getExpertReviews service:', error);
    throw error;
  }
}

// Kiểm tra xem booking đã có đánh giá chưa
async function checkBookingHasReview(clientId, bookingId) {
  try {
    console.log(`Checking if booking ${bookingId} has review from client ${clientId}`);
    
    // Lấy review với bookingId và clientId cụ thể
    const review = await clientModel.getReviewByBookingId(bookingId);
    
    // Nếu có review, trả về true, ngược lại trả về false
    const hasReview = !!review;
    console.log(`Booking ${bookingId} has review: ${hasReview}`);
    
    return hasReview;
  } catch (error) {
    console.error(`Error checking if booking has review: ${error.message}`);
    // Nếu có lỗi, giả định là chưa có đánh giá
    return false;
  }
}

// Lấy đánh giá dựa theo booking ID
async function getReviewByBookingId(bookingId) {
  try {
    // Lấy review từ model
    const review = await clientModel.getReviewByBookingId(bookingId);
    
    // Nếu không tìm thấy review
    if (!review) {
      return null;
    }
    
    // Thêm thông tin định dạng về thời gian tạo
    if (review.createdAt) {
      review.formattedDate = new Intl.DateTimeFormat('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      }).format(new Date(review.createdAt));
    }
    
    return review;
  } catch (error) {
    console.error(`Error getting review by bookingId ${bookingId}: ${error.message}`);
    throw error;
  }
}

// Lấy thống kê số lượng booking theo từng loại
async function getBookingStats(clientId) {
  try {
    // Sử dụng hàm mới getClientBookingStats để đếm trực tiếp từ database
    return clientModel.getClientBookingStats(clientId);
  } catch (error) {
    console.error('Error getting booking stats:', error);
    throw error;
  }
}

// Lấy danh sách chuyên gia với filters và limit (cursor-based pagination)
async function getExpertsWithFilters(filters = {}, limit = 12) {
  try {
    console.log('=== START: getExpertsWithFilters ===');
    // Đảm bảo chỉ lấy expert đã được xác thực
    const finalFilters = {
      ...filters,
      role: 'expert',
      verified: 'verified'
    };
    
    console.log('Final filters in getExpertsWithFilters:', JSON.stringify(finalFilters, null, 2));

    const experts = await clientModel.getExpertsWithFilters(finalFilters, limit);
    console.log(`Retrieved ${experts.length} experts from database`);
    
    // Loại bỏ thông tin nhạy cảm
    const sanitizedExperts = experts.map(expert => {
      const { password, ...expertWithoutPassword } = expert;
      return expertWithoutPassword;
    });
    
    console.log('=== END: getExpertsWithFilters ===');
    return sanitizedExperts;
  } catch (error) {
    console.error('Error in getExpertsWithFilters:', error);
    throw error;
  }
}

// Tìm kiếm chuyên gia với filters và limit (cursor-based pagination)
async function searchExpertsWithFilters(query, filters = {}, limit = 12) {
  try {
    // Đảm bảo chỉ lấy expert đã được xác thực
    const finalFilters = {
      ...filters,
      role: 'expert',
      verified: 'verified',
      // Chỉ tìm kiếm theo trường name
      name: { $regex: query, $options: 'i' }
    };

    // Xóa _id filter nếu có trong $or để tránh xung đột
    if (finalFilters._id) {
      // Không cần xử lý $or nữa vì chỉ tìm theo name
    }
    
    const experts = await clientModel.getExpertsWithFilters(finalFilters, limit);
    
    // Loại bỏ thông tin nhạy cảm
    return experts.map(expert => {
      const { password, ...expertWithoutPassword } = expert;
      return expertWithoutPassword;
    });
  } catch (error) {
    throw error;
  }
}

export default {
  getClientBookings,
  createBooking,
  cancelBooking,
  getAllExperts,
  searchExperts,
  filterExpertsByField,
  getExpertDetail,
  updateClientProfile,
  addReview,
  getExpertScheduleByDate,
  updateBookingPayment,
  getBookingById,
  getExpertAvailableDates,
  updateBookingStatus,
  checkBookingHasReview,
  getReviewByBookingId,
  getBookingStats,
  getExpertReviews,
  getExpertsWithFilters,
  searchExpertsWithFilters
};
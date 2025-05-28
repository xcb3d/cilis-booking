import { ObjectId } from 'mongodb';
import expertModel from '../models/expertModel.js';
import userModel from '../models/userModel.js';
import { getDB } from '../config/db.js';

// Service lấy thông tin dashboard của chuyên gia
const getExpertDashboard = async (expertId) => {
  try {
    // Lấy thông tin chuyên gia
    const expert = await userModel.findById(expertId);
    if (!expert || expert.role !== 'expert') {
      throw new Error('Chuyên gia không tồn tại');
    }
    
    // Lấy thống kê từ model
    const stats = await expertModel.getDashboardStats(expertId);
    
    return {
      expert,
      stats
    };
  } catch (error) {
    throw error;
  }
};

// Service lấy danh sách bookings của chuyên gia
const getExpertBookings = async (expertId, filter = null, limit = 10, cursor = null) => {
  try {
    // Validate giới hạn
    limit = parseInt(limit) || 10;
    if (limit < 1 || limit > 50) {
      limit = 10; // Giá trị mặc định an toàn
    }
    
    // Sử dụng hàm mới getExpertBookingsWithDetails với cursor-based pagination
    const result = await expertModel.getExpertBookingsWithDetails(expertId, filter, limit, cursor);
    
    // Trả về kết quả đã được lọc và bổ sung thông tin chi tiết
    return result;
  } catch (error) {
    console.error('Error in getExpertBookings service:', error);
    throw error;
  }
};

// Service lấy danh sách reviews của chuyên gia
const getExpertReviews = async (expertId, page = 1, limit = 10) => {
  try {
    // Lấy danh sách review từ model với pagination
    const result = await expertModel.getReviews(expertId, page, limit);
    
    // Danh sách reviews đã được thêm thông tin client từ model layer
    return result;
  } catch (error) {
    console.error('Error in getExpertReviews service:', error);
    throw error;
  }
};

// Service upload tài liệu xác minh
const uploadVerificationDocuments = async (expertId, documents) => {
  try {
    // Cập nhật trạng thái verified và documents trực tiếp vào collection users
    await userModel.update(expertId, { 
      verified: 'pending',
      documents: documents
    });
    
    return { success: true };
  } catch (error) {
    throw error;
  }
};

// Service cập nhật thông tin chuyên gia
const updateExpertProfile = async (expertId, profileData) => {
  try {
    // Validate thông tin
    if (profileData.email) {
      const existingUser = await userModel.findByEmail(profileData.email);
      if (existingUser && existingUser._id.toString() !== expertId) {
        throw new Error('Email đã được sử dụng bởi tài khoản khác');
      }
    }
    
    // Cập nhật thông tin qua model
    await expertModel.updateProfile(expertId, profileData);
    
    // Lấy thông tin expert đã cập nhật
    const updatedExpert = await userModel.findById(expertId);
    
    // Đồng bộ dữ liệu với Elasticsearch nếu expert đã được xác minh
    if (updatedExpert && updatedExpert.verified === 'verified') {
      try {
        const elasticSearchService = (await import('../services/elasticSearchService.js')).default;
        await elasticSearchService.indexExpert(updatedExpert);
        console.log(`Đã đồng bộ expert ${expertId} vào Elasticsearch`);
      } catch (elasticError) {
        console.error('Lỗi khi đồng bộ expert vào Elasticsearch:', elasticError);
        // Không throw lỗi để không ảnh hưởng đến luồng chính
      }
    }
    
    return updatedExpert;
  } catch (error) {
    throw error;
  }
};

// Service lấy thông tin lịch làm việc
const getExpertSchedule = async (expertId, date) => {
  try {
    // Lấy lịch làm việc từ patterns và overrides
    const schedule = await getSchedulePatternTimeSlotsByDate(expertId, date);
    
    // Lấy danh sách booking cho ngày này
    const bookings = await expertModel.getBookingsByDateRange(expertId, date, date);
    
    // Nếu có booking, cập nhật trạng thái của time slots
    if (bookings && bookings.length > 0 && schedule.timeSlots && schedule.timeSlots.length > 0) {
      // Cập nhật trạng thái available của các time slots dựa trên booking
      for (const booking of bookings) {
        // Đảm bảo booking có startTime và endTime
        if (!booking.startTime || !booking.endTime) continue;
        
        for (let i = 0; i < schedule.timeSlots.length; i++) {
          const slot = schedule.timeSlots[i];
          
          // Đảm bảo slot có startTime và endTime
          if (!slot.startTime || !slot.endTime) continue;
            
          // Kiểm tra xem slot này có nằm trong khoảng thời gian của booking không
          if (slot.startTime >= booking.startTime && slot.endTime <= booking.endTime) {
            // Thêm thông tin chi tiết về booking cho chuyên gia
            const bookingDetails = {
              id: booking._id,
              clientId: booking.clientId,
              status: booking.status,
              createdAt: booking.createdAt,
              notes: booking.notes || '',
              price: booking.price
            };
            
            // Trạng thái chi tiết dựa trên booking.status
            let statusDetail;
            
            switch(booking.status) {
              case 'pending':
                statusDetail = {
                  statusName: 'Chờ thanh toán',
                  statusColor: 'orange',
                  description: 'Người dùng đang trong quá trình thanh toán'
                };
                break;
              case 'confirmed':
                statusDetail = {
                  statusName: 'Đã xác nhận',
                  statusColor: 'green',
                  description: 'Đã thanh toán thành công, chờ tư vấn'
                };
                break;
              case 'completed':
                statusDetail = {
                  statusName: 'Đã hoàn thành',
                  statusColor: 'blue',
                  description: 'Buổi tư vấn đã kết thúc'
                };
                break;
              default:
                statusDetail = {
                  statusName: 'Không xác định',
                  statusColor: 'gray',
                  description: 'Trạng thái không xác định'
                };
            }
            
            // Cập nhật thông tin slot
            schedule.timeSlots[i] = {
              ...slot,
              available: false,
              booking: bookingDetails,
              statusDetail: statusDetail
            };
          }
        }
      }
    }
    
    return {
      date,
      timeSlots: schedule.timeSlots || [],
      type: schedule.type,
      reason: schedule.reason
    };
  } catch (error) {
    console.error('ExpertService - Error getting expert schedule:', error);
    throw error;
  }
};

// Service cập nhật lịch làm việc
const updateExpertSchedule = async (expertId, date, timeSlots) => {
  try {
    // Validate timeSlots
    if (!Array.isArray(timeSlots)) {
      throw new Error('Dữ liệu khung giờ không hợp lệ!');
    }
    
    // Validate từng timeSlot
    timeSlots.forEach(slot => {
      if (!slot.startTime || !slot.endTime) {
        throw new Error('Khung giờ phải có thời gian bắt đầu và kết thúc!');
      }
    });
    
    // Kiểm tra override cho ngày này
    const existingOverride = await expertModel.getScheduleOverrideByDate(expertId, date);
    
    // Nếu chưa có override, tạo mới
    if (!existingOverride) {
      const override = {
        expertId,
        date,
        type: 'override',
        timeSlots: timeSlots.map(slot => ({
          start: slot.startTime,
          end: slot.endTime,
          available: slot.available
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await expertModel.createScheduleOverride(override);
    } else {
      // Nếu đã có override, cập nhật
      const updatedOverride = {
        type: 'override',
        timeSlots: timeSlots.map(slot => ({
          start: slot.startTime,
          end: slot.endTime,
          available: slot.available
        })),
        updatedAt: new Date()
      };
      
      await expertModel.updateScheduleOverride(existingOverride._id, updatedOverride);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating expert schedule:', error);
    throw error;
  }
};

// Service lấy danh sách ngày có lịch làm việc
const getAvailableDates = async (expertId, startDate, endDate) => {
  try {
    // Thay vì lấy từ collection schedules, tạo danh sách các ngày và kiểm tra pattern/override
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDates = [];
    const availableDates = [];
    
    // Tạo mảng tất cả các ngày trong khoảng
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      allDates.push(dateStr);
      
      // Kiểm tra xem ngày này có lịch làm việc không
      const daySchedule = await getSchedulePatternTimeSlotsByDate(expertId, dateStr);
      
      // Nếu ngày này có ít nhất một khung giờ trống
      if (daySchedule.timeSlots && daySchedule.timeSlots.some(slot => slot.available) && !daySchedule.isUnavailable) {
        availableDates.push(dateStr);
      }
      
      // Chuyển sang ngày tiếp theo
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      allDates,
      availableDates
    };
  } catch (error) {
    throw error;
  }
};

// Helper function to validate time slots
const validateTimeSlots = (timeSlots) => {
  if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
    throw new Error('Danh sách khung giờ không hợp lệ');
  }
  
  // Kiểm tra từng time slot
  for (let i = 0; i < timeSlots.length; i++) {
    const currentSlot = timeSlots[i];
    
    // Kiểm tra các trường bắt buộc
      if (!currentSlot.start || !currentSlot.end) {
        throw new Error('Thời gian bắt đầu và kết thúc không được để trống');
      }
      
    // Kiểm tra định dạng thời gian (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(currentSlot.start) || !timeRegex.test(currentSlot.end)) {
      throw new Error(`Định dạng thời gian không hợp lệ: ${currentSlot.start} hoặc ${currentSlot.end}. Sử dụng định dạng HH:MM`);
    }
    
    // Chuyển đổi sang Date để so sánh thời gian
      const currentStart = new Date(`2000-01-01T${currentSlot.start}`);
      const currentEnd = new Date(`2000-01-01T${currentSlot.end}`);
      
    // Kiểm tra thời gian bắt đầu phải trước thời gian kết thúc
      if (currentStart >= currentEnd) {
        throw new Error(`Thời gian bắt đầu phải trước thời gian kết thúc: ${currentSlot.start} - ${currentSlot.end}`);
      }
      
    // Kiểm tra chồng lấp giữa các time slots
    for (let j = i + 1; j < timeSlots.length; j++) {
      const nextSlot = timeSlots[j];
        const nextStart = new Date(`2000-01-01T${nextSlot.start}`);
        const nextEnd = new Date(`2000-01-01T${nextSlot.end}`);
        
      // Kiểm tra chồng lấp
        if (
          (currentStart < nextEnd && currentEnd > nextStart) ||
          (nextStart < currentEnd && nextEnd > currentStart)
        ) {
          throw new Error(`Các khung giờ bị chồng lấp: ${currentSlot.start}-${currentSlot.end} và ${nextSlot.start}-${nextSlot.end}`);
        }
      }
    }
};

// Service lấy tất cả mẫu lịch làm việc
const getAllSchedulePatterns = async (expertId) => {
  try {
    return await expertModel.getAllSchedulePatterns(expertId);
  } catch (error) {
    throw error;
  }
};

// Service tạo mẫu lịch làm việc mới
const createSchedulePattern = async (expertId, patternData) => {
  try {
    // Validate dữ liệu đầu vào
    if (!patternData || !patternData.timeSlots || !Array.isArray(patternData.timeSlots) || patternData.timeSlots.length === 0) {
      throw new Error('Dữ liệu mẫu lịch không hợp lệ!');
    }
    
    // Xác thực các time slots
    validateTimeSlots(patternData.timeSlots);
    
    // Thêm trường expertId và đảm bảo isActive = true
    const pattern = {
      ...patternData,
      expertId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Tạo mẫu lịch trong DB
    const result = await expertModel.createSchedulePattern(pattern);
    
    return result;
  } catch (error) {
    console.error('Error creating schedule pattern:', error);
    throw error;
  }
};

// Service cập nhật mẫu lịch làm việc
const updateSchedulePattern = async (expertId, patternId, patternData) => {
  try {
    // Validate dữ liệu đầu vào
    if (!patternData) {
      throw new Error('Dữ liệu cập nhật không hợp lệ!');
    }
    
    // Kiểm tra time slots nếu có
    if (patternData.timeSlots && Array.isArray(patternData.timeSlots)) {
      validateTimeSlots(patternData.timeSlots);
    }
    
    // Kiểm tra mẫu lịch tồn tại và thuộc về expert
    const existingPattern = await expertModel.getSchedulePatternById(patternId);
    
    if (!existingPattern) {
      throw new Error('Mẫu lịch không tồn tại!');
    }
    
    if (existingPattern.expertId.toString() !== expertId) {
      throw new Error('Không có quyền cập nhật mẫu lịch này!');
    }
    
    // Thêm trường updatedAt
    const updatedPattern = {
      ...patternData,
      updatedAt: new Date()
    };
    
    // Cập nhật mẫu lịch trong DB
    const result = await expertModel.updateSchedulePattern(patternId, updatedPattern);
    
    return result;
  } catch (error) {
    console.error('Error updating schedule pattern:', error);
    throw error;
  }
};

// Service xóa mẫu lịch làm việc
const deleteSchedulePattern = async (expertId, patternId) => {
  try {
    // Kiểm tra mẫu lịch tồn tại và thuộc về expert
    const existingPattern = await expertModel.getSchedulePatternById(patternId);
    
    if (!existingPattern) {
      throw new Error('Mẫu lịch không tồn tại!');
    }
    
    if (existingPattern.expertId.toString() !== expertId) {
      throw new Error('Không có quyền xóa mẫu lịch này!');
    }
    
    // Xóa mẫu lịch khỏi DB
    const result = await expertModel.deleteSchedulePattern(patternId);
    
    return result;
  } catch (error) {
    console.error('Error deleting schedule pattern:', error);
    throw error;
  }
};

// Service lấy tất cả lịch ngoại lệ
const getAllScheduleOverrides = async (expertId) => {
  try {
    return await expertModel.getAllScheduleOverrides(expertId);
  } catch (error) {
    throw error;
  }
};

// Service tạo lịch ngoại lệ mới
const createScheduleOverride = async (expertId, overrideData) => {
  try {
    // Validate dữ liệu đầu vào
    if (!overrideData || !overrideData.date || !overrideData.type) {
      throw new Error('Dữ liệu lịch ngoại lệ không hợp lệ!');
    }
    
    // Kiểm tra loại override
    if (!['override', 'unavailable'].includes(overrideData.type)) {
      throw new Error('Loại lịch ngoại lệ không hợp lệ!');
    }
    
    // Nếu là override, kiểm tra timeSlots
    if (overrideData.type === 'override') {
      if (!overrideData.timeSlots || !Array.isArray(overrideData.timeSlots) || overrideData.timeSlots.length === 0) {
        throw new Error('Khung giờ cho lịch ngoại lệ không hợp lệ!');
      }
      
      // Validate timeSlots
      validateTimeSlots(overrideData.timeSlots);
    }
    
    // Kiểm tra override đã tồn tại cho ngày này chưa
    const existingOverride = await expertModel.getScheduleOverrideByDate(expertId, overrideData.date);
    
    if (existingOverride) {
      throw new Error('Đã tồn tại lịch ngoại lệ cho ngày này!');
    }
    
    // Tạo dữ liệu override
    const override = {
      ...overrideData,
      expertId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Lưu lịch ngoại lệ vào DB
    const result = await expertModel.createScheduleOverride(override);
    
    return result;
  } catch (error) {
    console.error('Error creating schedule override:', error);
    throw error;
  }
};

// Service cập nhật lịch ngoại lệ
const updateScheduleOverride = async (expertId, overrideId, overrideData) => {
  try {
    // Kiểm tra override có tồn tại không
    const existingOverride = await expertModel.getScheduleOverrideByDate(expertId, overrideData.date);
    
    if (!existingOverride) {
      throw new Error('Lịch ngoại lệ không tồn tại');
    }
    
    // Kiểm tra quyền chỉnh sửa
    if (existingOverride.expertId.toString() !== expertId.toString()) {
      throw new Error('Bạn không có quyền chỉnh sửa lịch ngoại lệ này');
    }
    
    // Validate dữ liệu giống như khi tạo mới
    if (!overrideData.type || !['override', 'unavailable'].includes(overrideData.type)) {
      throw new Error('Loại ngoại lệ không hợp lệ');
    }
    
    // Nếu là override, phải có timeSlots
    if (overrideData.type === 'override') {
      if (!overrideData.timeSlots || !Array.isArray(overrideData.timeSlots) || overrideData.timeSlots.length === 0) {
        throw new Error('Khung giờ làm việc không hợp lệ');
      }
      
      // Kiểm tra timeSlots
      for (const slot of overrideData.timeSlots) {
        if (!slot.start || !slot.end) {
          throw new Error('Thời gian bắt đầu và kết thúc không được để trống');
        }
        
        if (slot.available === undefined) {
          throw new Error('Trạng thái khả dụng không được để trống');
        }
      }
    } else {
      // Nếu là unavailable, không cần timeSlots
      overrideData.timeSlots = [];
    }
    
    // Update override
    await expertModel.updateScheduleOverride(overrideId, overrideData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating schedule override:', error);
    throw error;
  }
};

// Service xóa lịch ngoại lệ
const deleteScheduleOverride = async (expertId, overrideId) => {
  try {
    // Kiểm tra override tồn tại và thuộc về expert
    const existingOverride = await expertModel.getScheduleOverrideById(overrideId);
    
    if (!existingOverride) {
      throw new Error('Lịch ngoại lệ không tồn tại!');
    }
    
    if (existingOverride.expertId.toString() !== expertId) {
      throw new Error('Không có quyền xóa lịch ngoại lệ này!');
    }
    
    // Xóa override khỏi DB
    const result = await expertModel.deleteScheduleOverride(overrideId);
    
    return result;
  } catch (error) {
    console.error('Error deleting schedule override:', error);
    throw error;
  }
};

// Service lấy khung giờ làm việc theo mẫu cho một ngày
const getSchedulePatternTimeSlotsByDate = async (expertId, date) => {
  const startTime = process.hrtime();
  const metrics = {
    total: 0,
    getPatternsTime: 0,
    processPatterns: 0,
    getOverrides: 0,
    processOverrides: 0
  };

  try {
    console.log(`ExpertService - Getting time slots for date: ${date}, expertId: ${expertId}`);
    
    // Lấy ngày trong tuần (0-6, với 0 là chủ nhật)
    const dayOfWeek = new Date(date).getDay();
    
    // Đo thời gian lấy patterns
    const patternsStartTime = process.hrtime();
    
    // Lấy patterns cho ngày trong tuần này
    const patterns = await expertModel.getSchedulePatternsByDayOfWeek(expertId, dayOfWeek);
    
    const patternsEndTime = process.hrtime(patternsStartTime);
    metrics.getPatternsTime = patternsEndTime[0] * 1000 + patternsEndTime[1] / 1000000;
    
    // Đo thời gian xử lý patterns
    const processPatternStartTime = process.hrtime();
    
    // Lấy time slots từ patterns
    let timeSlots = [];
    
    if (patterns && patterns.length > 0) {
      // Kết hợp tất cả time slots từ các pattern
      patterns.forEach(pattern => {
        if (pattern.timeSlots && Array.isArray(pattern.timeSlots)) {
          // Chuẩn hóa time slots
          const normalizedSlots = pattern.timeSlots.map(slot => ({
            startTime: slot.start,
            endTime: slot.end,
            available: true, // Mặc định đặt available là true
            patternId: pattern._id, // Thêm patternId để theo dõi nguồn gốc
            patternName: pattern.name
          }));
          
          timeSlots = [...timeSlots, ...normalizedSlots];
        }
      });
      
      // Sắp xếp theo thời gian bắt đầu
      timeSlots.sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime.localeCompare(b.startTime);
      });
    }
    
    const processPatternEndTime = process.hrtime(processPatternStartTime);
    metrics.processPatterns = processPatternEndTime[0] * 1000 + processPatternEndTime[1] / 1000000;
    
    // Biến đánh dấu loại lịch
    let scheduleType = 'pattern';
    
    // Đo thời gian lấy overrides
    const overrideStartTime = process.hrtime();
    
    // Kiểm tra có lịch ngoại lệ không
    const override = await expertModel.getScheduleOverrideByDate(expertId, date);
    
    const overrideEndTime = process.hrtime(overrideStartTime);
    metrics.getOverrides = overrideEndTime[0] * 1000 + overrideEndTime[1] / 1000000;
    
    // Đo thời gian xử lý overrides
    const processOverrideStartTime = process.hrtime();
    
    if (override) {
      console.log(`ExpertService - Found override for date ${date}:`, override);
      
      // Nếu là ngày nghỉ
      if (override.type === 'unavailable') {
        const totalEndTime = process.hrtime(startTime);
        metrics.total = totalEndTime[0] * 1000 + totalEndTime[1] / 1000000;
        
        console.log(`[Pattern Metrics] getSchedulePatternTimeSlotsByDate (unavailable):
          - Total: ${metrics.total.toFixed(2)}ms
          - Get patterns: ${metrics.getPatternsTime.toFixed(2)}ms
          - Process patterns: ${metrics.processPatterns.toFixed(2)}ms
          - Get overrides: ${metrics.getOverrides.toFixed(2)}ms`);
            
        return { date, timeSlots: [], type: 'unavailable' };
      }
      
      // Nếu là override, hợp nhất với time slots từ pattern
      if (override.type === 'override' && override.timeSlots && Array.isArray(override.timeSlots)) {
        console.log('ExpertService - Merging override slots with pattern slots');
        
        // Tạo một Map từ time slots trong pattern
        const timeSlotsMap = new Map();
        
        timeSlots.forEach(slot => {
          if (!slot.startTime || !slot.endTime) return; // Bỏ qua slot không có thời gian
          const key = `${slot.startTime}-${slot.endTime}`;
          timeSlotsMap.set(key, slot);
        });
        
        // Áp dụng override lên các time slots
        override.timeSlots.forEach(overrideSlot => {
          const startTime = overrideSlot.start;
          const endTime = overrideSlot.end;
          
          if (!startTime || !endTime) return; // Bỏ qua override slot không có thời gian
          
          const key = `${startTime}-${endTime}`;
          
          // Nếu slot đã tồn tại, cập nhật trạng thái available
          if (timeSlotsMap.has(key)) {
            const existingSlot = timeSlotsMap.get(key);
            existingSlot.available = overrideSlot.available !== undefined ? overrideSlot.available : true;
            // Thêm dấu hiệu isOverridden nếu slot không available từ override
            if (overrideSlot.available === false) {
              existingSlot.isOverridden = true;
            }
          } else {
            // Nếu slot chưa tồn tại, thêm mới
            timeSlotsMap.set(key, {
              startTime: startTime,
              endTime: endTime,
              available: overrideSlot.available !== undefined ? overrideSlot.available : true,
              isCustom: true, // Đánh dấu là khung giờ tùy chỉnh
              // Thêm dấu hiệu isOverridden nếu slot không available
              isOverridden: overrideSlot.available === false
            });
          }
        });
        
        // Chuyển Map trở lại thành mảng
        timeSlots = Array.from(timeSlotsMap.values());
        
        // Sắp xếp lại
        timeSlots.sort((a, b) => {
          if (!a.startTime || !b.startTime) return 0;
          return a.startTime.localeCompare(b.startTime);
        });
        
        scheduleType = 'override';
      }
    }
    
    const processOverrideEndTime = process.hrtime(processOverrideStartTime);
    metrics.processOverrides = processOverrideEndTime[0] * 1000 + processOverrideEndTime[1] / 1000000;
    
    // Tính tổng thời gian
    const totalEndTime = process.hrtime(startTime);
    metrics.total = totalEndTime[0] * 1000 + totalEndTime[1] / 1000000;
    
    // Log metrics
    console.log(`[Pattern Metrics] getSchedulePatternTimeSlotsByDate:
      - Total: ${metrics.total.toFixed(2)}ms
      - Get patterns: ${metrics.getPatternsTime.toFixed(2)}ms
      - Process patterns: ${metrics.processPatterns.toFixed(2)}ms
      - Get overrides: ${metrics.getOverrides.toFixed(2)}ms
      - Process overrides: ${metrics.processOverrides.toFixed(2)}ms`);
    
    // Trả về kết quả đã được tối ưu hóa
    return { 
      date, 
      timeSlots,
      type: scheduleType
    };
  } catch (error) {
    console.error('ExpertService - Error getting schedule pattern time slots:', error);
    
    // Log thời gian khi có lỗi
    const endTime = process.hrtime(startTime);
    const totalTime = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[Error Metrics] getSchedulePatternTimeSlotsByDate failed after ${totalTime.toFixed(2)}ms`);
    
    throw error;
  }
};

// Service lấy lịch làm việc của chuyên gia trong khoảng thời gian (tuần)
const getExpertScheduleWeek = async (expertId, startDate, endDate) => {
  const startTime = process.hrtime();
  const metrics = {
    total: 0,
    datePreparation: 0,
    fetchBookings: 0,
    fetchPatterns: 0,
    fetchOverrides: 0,
    dataProcessing: 0
  };

  try {
    console.log(`ExpertService - Getting schedule week from ${startDate} to ${endDate} for expertId: ${expertId}`);
    
    // Đo thời gian chuẩn bị các ngày
    const dateStartTime = process.hrtime();
    
    // Tạo mảng chứa tất cả các ngày trong khoảng thời gian
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDates = [];
    
    // Tạo mảng chứa tất cả các ngày trong khoảng và tính ngày trong tuần
    const currentDate = new Date(start);
    const daysOfWeekNeeded = new Set(); // Sử dụng Set để loại bỏ trùng lặp
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0-6 (0: Chủ nhật, 1-6: Thứ 2 - Thứ 7)
      
      allDates.push({
        date: dateStr,
        dayOfWeek: dayOfWeek
      });
      
      daysOfWeekNeeded.add(dayOfWeek);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const dateEndTime = process.hrtime(dateStartTime);
    metrics.datePreparation = dateEndTime[0] * 1000 + dateEndTime[1] / 1000000;
    
    // Tạo các promises để lấy dữ liệu cùng một lúc
    const [bookingsData, allPatterns, allOverrides] = await Promise.all([
      // 1. Lấy tất cả booking trong khoảng thời gian
      (async () => {
        const bookingsStartTime = process.hrtime();
        const result = await expertModel.getBookingsByDateRange(expertId, startDate, endDate);
        const bookingsEndTime = process.hrtime(bookingsStartTime);
        metrics.fetchBookings = bookingsEndTime[0] * 1000 + bookingsEndTime[1] / 1000000;
        console.log(`ExpertService - Found ${result ? result.length : 0} date groups with bookings`);
        return result;
      })(),
      
      // 2. Lấy tất cả patterns cho các ngày trong tuần cần thiết
      (async () => {
        const patternsStartTime = process.hrtime();
        // Chuyển Set thành Array và query tất cả patterns cần thiết một lần
        const daysArray = Array.from(daysOfWeekNeeded);
        const result = await expertModel.getSchedulePatternsByDaysOfWeek(expertId, daysArray, startDate, endDate);
        const patternsEndTime = process.hrtime(patternsStartTime);
        metrics.fetchPatterns = patternsEndTime[0] * 1000 + patternsEndTime[1] / 1000000;
        return result;
      })(),
      
      // 3. Lấy tất cả overrides trong khoảng thời gian
      (async () => {
        const overridesStartTime = process.hrtime();
        const dateStrings = allDates.map(d => d.date);
        const result = await expertModel.getScheduleOverridesByDates(expertId, dateStrings);
        const overridesEndTime = process.hrtime(overridesStartTime);
        metrics.fetchOverrides = overridesEndTime[0] * 1000 + overridesEndTime[1] / 1000000;
        return result;
      })()
    ]);
    
    // Đo thời gian xử lý dữ liệu
    const processingStartTime = process.hrtime();
    
    // Tạo Map để bookings theo ngày từ cấu trúc dữ liệu mới
    const bookingsByDate = new Map();
    if (bookingsData && bookingsData.length > 0) {
      bookingsData.forEach(dateGroup => {
        if (!dateGroup.date || !dateGroup.bookings) return;
        bookingsByDate.set(dateGroup.date, dateGroup.bookings);
      });
    }
    
    // Nhóm patterns theo dayOfWeek để truy cập nhanh
    const patternsByDayOfWeek = {};
    if (allPatterns && allPatterns.length > 0) {
      allPatterns.forEach(pattern => {
        if (pattern.daysOfWeek !== undefined) {
          // Nếu pattern áp dụng cho nhiều ngày
          if (Array.isArray(pattern.daysOfWeek)) {
            pattern.daysOfWeek.forEach(day => {
              if (!patternsByDayOfWeek[day]) {
                patternsByDayOfWeek[day] = [];
              }
              patternsByDayOfWeek[day].push(pattern);
            });
          } else {
            // Nếu pattern chỉ áp dụng cho một ngày
            const day = pattern.daysOfWeek;
            if (!patternsByDayOfWeek[day]) {
              patternsByDayOfWeek[day] = [];
            }
            patternsByDayOfWeek[day].push(pattern);
          }
        }
      });
    }
    
    // Nhóm overrides theo ngày để truy cập nhanh
    const overridesByDate = {};
    if (allOverrides && allOverrides.length > 0) {
      allOverrides.forEach(override => {
        if (override.date) {
          overridesByDate[override.date] = override;
        }
      });
    }
    
    // Xử lý từng ngày dựa trên dữ liệu đã lấy
    const weekSchedule = allDates.map(dateInfo => {
      const { date, dayOfWeek } = dateInfo;
      
      // 1. Lấy patterns cho ngày trong tuần này
      let patterns = patternsByDayOfWeek[dayOfWeek] || [];
      
      // 1.1 Lọc thêm 1 lần nữa để chỉ giữ lại patterns hợp lệ cho ngày cụ thể này
      patterns = patterns.filter(pattern => {
        // Nếu pattern không có validFrom hoặc validTo, coi là hợp lệ
        if (!pattern.validFrom && !pattern.validTo) return true;
        
        // Kiểm tra validFrom (nếu có)
        if (pattern.validFrom && date < pattern.validFrom) return false;
        
        // Kiểm tra validTo (nếu có)
        if (pattern.validTo && date > pattern.validTo) return false;
        
        // Nếu vượt qua tất cả các kiểm tra, pattern là hợp lệ cho ngày này
        return true;
      });
      
      // 2. Lấy timeSlots từ patterns
      let timeSlots = [];
      
      if (patterns.length > 0) {
        patterns.forEach(pattern => {
          if (pattern.timeSlots && Array.isArray(pattern.timeSlots)) {
            const normalizedSlots = pattern.timeSlots.map(slot => ({
              startTime: slot.start,
              endTime: slot.end,
              available: true
            }));
            
            timeSlots = [...timeSlots, ...normalizedSlots];
          }
        });
        
        // Sắp xếp theo thời gian bắt đầu
        timeSlots.sort((a, b) => {
          if (!a.startTime || !b.startTime) return 0;
          return a.startTime.localeCompare(b.startTime);
        });
      }
      
      // 3. Kiểm tra override cho ngày này
      let scheduleType = 'pattern';
      const override = overridesByDate[date];
      
      if (override) {
        // Nếu là ngày nghỉ
        if (override.type === 'unavailable') {
          return { 
            date, 
            timeSlots: [], 
            isUnavailable: true 
          };
        }
        
        // Nếu là override, hợp nhất với time slots từ pattern
        if (override.type === 'override' && override.timeSlots && Array.isArray(override.timeSlots)) {
          // Tạo một Map từ time slots trong pattern
          const timeSlotsMap = new Map();
          
          timeSlots.forEach(slot => {
            if (!slot.startTime || !slot.endTime) return;
            const key = `${slot.startTime}-${slot.endTime}`;
            timeSlotsMap.set(key, slot);
          });
          
          // Áp dụng override lên các time slots
          override.timeSlots.forEach(overrideSlot => {
            const startTime = overrideSlot.start;
            const endTime = overrideSlot.end;
            
            if (!startTime || !endTime) return;
            
            const key = `${startTime}-${endTime}`;
            
            if (timeSlotsMap.has(key)) {
              const existingSlot = timeSlotsMap.get(key);
              existingSlot.available = overrideSlot.available !== undefined ? overrideSlot.available : true;
              if (overrideSlot.available === false) {
                existingSlot.isOverridden = true;
              }
            } else {
              timeSlotsMap.set(key, {
                startTime: startTime,
                endTime: endTime,
                available: overrideSlot.available !== undefined ? overrideSlot.available : true,
                isCustom: true,
                isOverridden: overrideSlot.available === false
              });
            }
          });
          
          // Chuyển Map trở lại thành mảng
          timeSlots = Array.from(timeSlotsMap.values());
          
          // Sắp xếp lại
          timeSlots.sort((a, b) => {
            if (!a.startTime || !b.startTime) return 0;
            return a.startTime.localeCompare(b.startTime);
          });
        }
      }
      
      // 4. Kiểm tra và cập nhật trạng thái available dựa trên booking
      const dayBookings = bookingsByDate.get(date) || [];
      
      if (dayBookings.length > 0 && timeSlots.length > 0) {
        // Sắp xếp bookings theo thời gian để cải thiện tìm kiếm
        dayBookings.sort((a, b) => {
          if (a.startTime === b.startTime) return 0;
          return a.startTime < b.startTime ? -1 : 1;
        });
        
        // Xử lý từng time slot
        for (let i = 0; i < timeSlots.length; i++) {
          const slot = timeSlots[i];
          
          if (!slot.startTime || !slot.endTime) continue;
          
          // Tối ưu: Chỉ kiểm tra các bookings có thể giao nhau với slot hiện tại
          for (const booking of dayBookings) {
            if (!booking.startTime || !booking.endTime) continue;
            
            // Bỏ qua booking nếu kết thúc trước khi slot bắt đầu
            if (booking.endTime <= slot.startTime) continue;
            
            // Dừng vòng lặp nếu booking bắt đầu sau khi slot kết thúc 
            // (vì đã sort nên các booking còn lại cũng sẽ bắt đầu sau slot)
            if (booking.startTime >= slot.endTime) break;
            
            // Nếu còn lại thì chắc chắn có overlap
            if (slot.startTime >= booking.startTime && slot.endTime <= booking.endTime) {
              // Tinh gọn dữ liệu booking, chỉ giữ status cần thiết cho hiển thị
              timeSlots[i] = { 
                startTime: slot.startTime, 
                endTime: slot.endTime,
                available: false,
                isOverridden: false,
                booking: {
                  status: booking.status
                }
              };
              
              break; // Đã tìm thấy booking cho slot này, bỏ qua các booking còn lại
            }
          }
        }
      }
      
      // Trả về lịch làm việc cho ngày này với dữ liệu tinh gọn
      return { 
        date,
        isUnavailable: false,
        timeSlots: timeSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: slot.available,
          isOverridden: slot.isOverridden || false,
          booking: slot.booking ? {
            status: slot.booking.status
          } : null
        }))
      };
    });
    
    const processingEndTime = process.hrtime(processingStartTime);
    metrics.dataProcessing = processingEndTime[0] * 1000 + processingEndTime[1] / 1000000;
    
    // Tính tổng thời gian
    const endTime = process.hrtime(startTime);
    metrics.total = endTime[0] * 1000 + endTime[1] / 1000000;
    
    // Log thời gian xử lý
    console.log(`[Service Metrics] getExpertScheduleWeek:
      - Total execution: ${metrics.total.toFixed(2)}ms
      - Date preparation: ${metrics.datePreparation.toFixed(2)}ms 
      - Fetch bookings: ${metrics.fetchBookings.toFixed(2)}ms
      - Fetch patterns: ${metrics.fetchPatterns.toFixed(2)}ms
      - Fetch overrides: ${metrics.fetchOverrides.toFixed(2)}ms
      - Data processing: ${metrics.dataProcessing.toFixed(2)}ms`);
    
    // Trả về kết quả cùng với metrics
    return {
      data: weekSchedule,
      metrics: metrics
    };
  } catch (error) {
    console.error('ExpertService - Error getting expert week schedule:', error);
    
    // Log thời gian khi có lỗi
    const endTime = process.hrtime(startTime);
    const totalTime = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[Error Metrics] getExpertScheduleWeek failed after ${totalTime.toFixed(2)}ms`);
    
    throw error;
  }
};

// Service lấy thống kê số lượng booking của chuyên gia
const getExpertBookingStats = async (expertId) => {
  try {
    // Sử dụng hàm mới getExpertBookingStats để đếm trực tiếp từ database
    return expertModel.getExpertBookingStats(expertId);
  } catch (error) {
    console.error('Error in getExpertBookingStats service:', error);
    throw error;
  }
};

// Service lấy trạng thái xác minh của chuyên gia
const getVerificationStatus = async (expertId) => {
  try {
    // Lấy thông tin expert từ collection users
    const expert = await userModel.findById(expertId);
    
    if (!expert) {
      throw new Error('Không tìm thấy thông tin chuyên gia');
    }
    
    // Trả về thông tin xác minh từ user
    return {
      verified: expert.verified || 'unverified',
      documents: expert.documents || {},
      verificationComment: expert.verificationComment || '',
      reverificationRequested: expert.reverificationRequested || false,
      reverificationRequestDate: expert.reverificationRequestDate || null
    };
  } catch (error) {
    throw error;
  }
};

export default {
  getExpertDashboard,
  getExpertBookings,
  getExpertReviews,
  uploadVerificationDocuments,
  updateExpertProfile,
  getExpertSchedule,
  updateExpertSchedule,
  getAvailableDates,
  getAllSchedulePatterns,
  createSchedulePattern,
  updateSchedulePattern,
  deleteSchedulePattern,
  getAllScheduleOverrides,
  createScheduleOverride,
  updateScheduleOverride,
  deleteScheduleOverride,
  getSchedulePatternTimeSlotsByDate,
  getExpertScheduleWeek,
  getExpertBookingStats,
  getVerificationStatus
}; 
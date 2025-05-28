import expertService from '../services/expertService.js';
import { DOCUMENT_TYPES } from '../utils/constants.js';
import clientService from '../services/clientService.js';

// Controller lấy thông tin dashboard của chuyên gia
const getExpertDashboard = async (req, res) => {
  try {
    // Lấy ID của chuyên gia từ user đã được xác thực
    const expertId = req.user._id;
    
    // Gọi service để lấy thông tin dashboard
    const dashboardData = await expertService.getExpertDashboard(expertId);
    
    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Get expert dashboard error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy thông tin dashboard' });
  }
};

// Controller lấy danh sách bookings của chuyên gia
const getExpertBookings = async (req, res) => {
  try {
    const expertId = req.user._id;
    
    // Lấy filter từ query params (nếu có)
    const { filter } = req.query;
    
    // Lấy thông tin phân trang dựa trên cursor
    const limit = parseInt(req.query.limit) || 10;
    const { cursor } = req.query;
    
    // Đảm bảo limit là số hợp lệ
    if (limit < 1 || limit > 50) {
      return res.status(400).json({ 
        message: 'Tham số limit không hợp lệ. Limit phải từ 1-50.' 
      });
    }
    
    console.log(`Fetching bookings for expert ${expertId} with filter: ${filter || 'none'}, limit: ${limit}, cursor: ${cursor || 'initial'}`);
    
    // Gọi service để lấy danh sách bookings đã được lọc
    const result = await expertService.getExpertBookings(expertId, filter, limit, cursor);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get expert bookings error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách đặt lịch' });
  }
};

// Controller lấy thống kê số lượng booking theo loại
const getExpertBookingStats = async (req, res) => {
  try {
    const expertId = req.user._id;
    
    console.log(`Fetching booking stats for expert ${expertId}`);
    
    // Lấy thống kê booking từ service
    const stats = await expertService.getExpertBookingStats(expertId);
    
    console.log(`Booking stats for expert ${expertId}:`, stats);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Get expert booking stats error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy thống kê đặt lịch' });
  }
};

// Controller lấy danh sách reviews của chuyên gia
const getExpertReviews = async (req, res) => {
  try {
    const expertId = req.user._id;
    
    // Lấy thông tin phân trang từ query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Đảm bảo page và limit là số hợp lệ
    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({ 
        message: 'Tham số phân trang không hợp lệ. Page phải >= 1, limit phải từ 1-50.' 
      });
    }
    
    console.log(`Fetching reviews for expert ${expertId}, page: ${page}, limit: ${limit}`);
    
    // Gọi service để lấy reviews của expert với phân trang
    const result = await expertService.getExpertReviews(expertId, page, limit);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get expert reviews error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách đánh giá' });
  }
};

// Upload tài liệu xác minh
const uploadVerificationDocuments = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }

    const expertId = req.user._id;

    // Lấy đường dẫn các file từ req.files
    const documents = {};
    
    Object.keys(req.files).forEach(fieldName => {
      if (Object.values(DOCUMENT_TYPES).includes(fieldName)) {
        documents[fieldName] = req.files[fieldName][0].path;
      }
    });

    // Nếu không có document nào hợp lệ
    if (Object.keys(documents).length === 0) {
      return res.status(400).json({ message: 'Không có tài liệu nào hợp lệ được tải lên' });
    }

    // Gọi service để xử lý tài liệu xác minh
    const result = await expertService.uploadVerificationDocuments(expertId, documents);

    res.status(200).json({
      message: 'Tải lên tài liệu xác minh thành công',
      documents
    });
  } catch (error) {
    console.error('Upload verification documents error:', error);
    res.status(500).json({ message: error.message || 'Đã xảy ra lỗi khi tải lên tài liệu' });
  }
};

// Cập nhật thông tin chuyên gia
const updateExpertInfo = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { field, expertise, experience, price } = req.body;

    if (!field || !expertise || !experience || !price) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    // Gọi service để cập nhật thông tin chuyên gia
    const updatedExpert = await expertService.updateExpertProfile(expertId, {
      field,
      expertise,
      experience,
      price: Number(price)
    });

    res.status(200).json({
      message: 'Cập nhật thông tin chuyên gia thành công',
      user: {
        field: updatedExpert.field,
        expertise: updatedExpert.expertise,
        experience: updatedExpert.experience,
        price: updatedExpert.price
      }
    });
  } catch (error) {
    console.error('Update expert info error:', error);
    res.status(500).json({ message: error.message || 'Đã xảy ra lỗi khi cập nhật thông tin chuyên gia' });
  }
};

// Lấy trạng thái xác minh của chuyên gia
const getVerificationStatus = async (req, res) => {
  try {
    const expertId = req.user._id;
    
    // Gọi service để lấy trạng thái xác minh
    const verificationStatus = await expertService.getVerificationStatus(expertId);
    
    res.status(200).json(verificationStatus);
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: error.message || 'Đã xảy ra lỗi khi lấy trạng thái xác minh' });
  }
};

// Lấy lịch làm việc của chuyên gia
const getExpertSchedule = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { date } = req.query;
    
    // Gọi service để lấy lịch làm việc
    const schedule = await expertService.getExpertSchedule(expertId, date);
    
    res.status(200).json(schedule);
  } catch (error) {
    console.error('Get expert schedule error:', error);
    res.status(500).json({ message: error.message || 'Đã xảy ra lỗi khi lấy lịch làm việc' });
  }
};

// Cập nhật lịch làm việc của chuyên gia
const updateExpertSchedule = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { date, timeSlots } = req.body;

    if (!date || !timeSlots) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin lịch làm việc' });
    }

    // Gọi service để cập nhật lịch làm việc
    const result = await expertService.updateExpertSchedule(expertId, date, timeSlots);

    return res.status(200).json({
      message: 'Cập nhật lịch làm việc thành công',
      date,
      timeSlots
    });
  } catch (error) {
    console.error('Update expert schedule error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi cập nhật lịch làm việc' });
  }
};

// Lấy danh sách các ngày có lịch làm việc
const getAvailableDates = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { startDate, endDate } = req.query;
    
    // Gọi service để lấy danh sách ngày có lịch làm việc
    const availableDates = await expertService.getAvailableDates(expertId, startDate, endDate);
    
    return res.status(200).json(availableDates);
  } catch (error) {
    console.error('Get available dates error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách ngày làm việc' });
  }
};

// Lấy danh sách mẫu lịch làm việc
const getSchedulePatterns = async (req, res) => {
  try {
    const expertId = req.user._id;
    const patterns = await expertService.getAllSchedulePatterns(expertId);
    
    res.status(200).json(patterns);
  } catch (error) {
    console.error('Get schedule patterns error:', error);
    res.status(500).json({ message: error.message || 'Đã xảy ra lỗi khi lấy danh sách mẫu lịch làm việc' });
  }
};

// Tạo mẫu lịch làm việc mới
const createSchedulePattern = async (req, res) => {
  try {
    const expertId = req.user._id;
    const patternData = req.body;
    
    const result = await expertService.createSchedulePattern(expertId, patternData);
    
    res.status(201).json({
      message: 'Tạo mẫu lịch làm việc thành công',
      pattern: result.pattern
    });
  } catch (error) {
    console.error('Create schedule pattern error:', error);
    res.status(400).json({ message: error.message || 'Đã xảy ra lỗi khi tạo mẫu lịch làm việc' });
  }
};

// Cập nhật mẫu lịch làm việc
const updateSchedulePattern = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { patternId } = req.params;
    const patternData = req.body;
    
    await expertService.updateSchedulePattern(expertId, patternId, patternData);
    
    res.status(200).json({
      message: 'Cập nhật mẫu lịch làm việc thành công'
    });
  } catch (error) {
    console.error('Update schedule pattern error:', error);
    res.status(400).json({ message: error.message || 'Đã xảy ra lỗi khi cập nhật mẫu lịch làm việc' });
  }
};

// Xóa mẫu lịch làm việc
const deleteSchedulePattern = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { patternId } = req.params;
    
    await expertService.deleteSchedulePattern(expertId, patternId);
    
    res.status(200).json({
      message: 'Xóa mẫu lịch làm việc thành công'
    });
  } catch (error) {
    console.error('Delete schedule pattern error:', error);
    res.status(400).json({ message: error.message || 'Đã xảy ra lỗi khi xóa mẫu lịch làm việc' });
  }
};

// Lấy danh sách lịch ngoại lệ
const getScheduleOverrides = async (req, res) => {
  try {
    const expertId = req.user._id;
    const overrides = await expertService.getAllScheduleOverrides(expertId);
    
    res.status(200).json(overrides);
  } catch (error) {
    console.error('Get schedule overrides error:', error);
    res.status(500).json({ message: error.message || 'Đã xảy ra lỗi khi lấy danh sách lịch ngoại lệ' });
  }
};

// Tạo lịch ngoại lệ mới
const createScheduleOverride = async (req, res) => {
  try {
    const expertId = req.user._id;
    const overrideData = req.body;
    
    const result = await expertService.createScheduleOverride(expertId, overrideData);
    
    res.status(201).json({
      message: 'Tạo lịch ngoại lệ thành công',
      override: result.override
    });
  } catch (error) {
    console.error('Create schedule override error:', error);
    res.status(400).json({ message: error.message || 'Đã xảy ra lỗi khi tạo lịch ngoại lệ' });
  }
};

// Cập nhật lịch ngoại lệ
const updateScheduleOverride = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { overrideId } = req.params;
    const overrideData = req.body;
    
    await expertService.updateScheduleOverride(expertId, overrideId, overrideData);
    
    res.status(200).json({
      message: 'Cập nhật lịch ngoại lệ thành công'
    });
  } catch (error) {
    console.error('Update schedule override error:', error);
    res.status(400).json({ message: error.message || 'Đã xảy ra lỗi khi cập nhật lịch ngoại lệ' });
  }
};

// Xóa lịch ngoại lệ
const deleteScheduleOverride = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { overrideId } = req.params;
    
    await expertService.deleteScheduleOverride(expertId, overrideId);
    
    res.status(200).json({
      message: 'Xóa lịch ngoại lệ thành công'
    });
  } catch (error) {
    console.error('Delete schedule override error:', error);
    res.status(400).json({ message: error.message || 'Đã xảy ra lỗi khi xóa lịch ngoại lệ' });
  }
};

// Lấy khung giờ làm việc theo pattern cho một ngày
const getSchedulePatternTimeSlots = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ngày' });
    }
    
    const result = await expertService.getSchedulePatternTimeSlotsByDate(expertId, date);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get schedule pattern time slots error:', error);
    res.status(500).json({ message: error.message || 'Đã xảy ra lỗi khi lấy khung giờ làm việc' });
  }
};

// Controller lấy lịch làm việc của chuyên gia theo tuần
const getExpertScheduleWeek = async (req, res) => {
  const overallStartTime = process.hrtime();
  
  // Thời gian xử lý request params
  const requestParsingStart = process.hrtime();
  
  // Parse request params - sử dụng ID trực tiếp từ JWT payload
  const { startDate, endDate } = req.query;
  
  // Sử dụng _id từ JWT đã được mã hóa trong authenticateToken
  const expertId = req.user._id;
  
  // Log thông tin request
  console.log(`[Controller] Expert schedule request - expertId: ${expertId}, startDate: ${startDate}, endDate: ${endDate}`);
  
  const requestParsingEnd = process.hrtime(requestParsingStart);
  const requestParsingTime = requestParsingEnd[0] * 1000 + requestParsingEnd[1] / 1000000;
  
  try {
    // Đo thời gian gọi service
    const serviceCallStart = process.hrtime();
    
    // Gọi service
    const result = await expertService.getExpertScheduleWeek(expertId, startDate, endDate);
    const scheduleData = result.data;
    const serviceMetrics = result.metrics || {};
    
    const serviceCallEnd = process.hrtime(serviceCallStart);
    const serviceCallTime = serviceCallEnd[0] * 1000 + serviceCallEnd[1] / 1000000;
    
    // Đo thời gian chuẩn bị và gửi response
    const responsePreparationStart = process.hrtime();
    
    // Chuẩn bị và gửi response
    res.set('Content-Type', 'application/json');
    const jsonData = JSON.stringify(scheduleData);
    const jsonSize = Buffer.byteLength(jsonData, 'utf8') / 1024; // kB
    
    res.send(jsonData);
    
    const responsePreparationEnd = process.hrtime(responsePreparationStart);
    const responsePreparationTime = responsePreparationEnd[0] * 1000 + responsePreparationEnd[1] / 1000000;
    
    // Đo tổng thời gian
    const overallEnd = process.hrtime(overallStartTime);
    const overallTime = overallEnd[0] * 1000 + overallEnd[1] / 1000000;
    
    // Log phân tích hiệu suất chi tiết
    console.log(`[Performance Analysis] getExpertScheduleWeek:
      - Total controller time: ${overallTime.toFixed(2)}ms
      - Request parsing: ${requestParsingTime.toFixed(2)}ms
      - Service call: ${serviceCallTime.toFixed(2)}ms
        └─ DB Query (bookings): ${serviceMetrics.fetchBookings || 0}ms
        └─ DB Query (patterns): ${serviceMetrics.fetchPatterns || 0}ms
        └─ DB Query (overrides): ${serviceMetrics.fetchOverrides || 0}ms
        └─ Data processing: ${serviceMetrics.dataProcessing || 0}ms
      - Response preparation: ${responsePreparationTime.toFixed(2)}ms
      - Response data size: ${jsonSize.toFixed(2)} kB`);
  } catch (error) {
    const errorHandlingStart = process.hrtime();
    
    console.error('Error getting expert schedule week:', error);
    res.status(500).json({ message: 'Lỗi khi lấy lịch làm việc', error: error.message });
    
    const errorHandlingEnd = process.hrtime(errorHandlingStart);
    const errorHandlingTime = errorHandlingEnd[0] * 1000 + errorHandlingEnd[1] / 1000000;
    
    const overallEnd = process.hrtime(overallStartTime);
    const overallTime = overallEnd[0] * 1000 + overallEnd[1] / 1000000;
    
    console.log(`[Error Performance] getExpertScheduleWeek:
      - Total error time: ${overallTime.toFixed(2)}ms
      - Error handling: ${errorHandlingTime.toFixed(2)}ms`);
  }
};

// Đánh dấu booking là đã hoàn thành
const completeBooking = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp ID của booking' 
      });
    }
    
    // Trước tiên, kiểm tra xem booking có tồn tại và thuộc về chuyên gia này không
    const booking = await clientService.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    
    if (booking.expertId.toString() !== expertId.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật booking này' });
    }
    
    // Kiểm tra trạng thái hiện tại của booking
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Chỉ có thể đánh dấu hoàn thành cho booking đã được xác nhận' 
      });
    }
    
    // Cập nhật trạng thái booking
    await clientService.updateBookingStatus(bookingId, 'completed', expertId);
    
    return res.status(200).json({
      message: 'Đánh dấu booking hoàn thành thành công'
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    return res.status(500).json({ 
      message: error.message || 'Đã xảy ra lỗi khi đánh dấu booking hoàn thành' 
    });
  }
};

export default {
  getExpertDashboard,
  getExpertBookings,
  getExpertBookingStats,
  getExpertReviews,
  uploadVerificationDocuments,
  updateExpertInfo,
  getVerificationStatus,
  getExpertSchedule,
  updateExpertSchedule,
  getAvailableDates,
  getSchedulePatterns,
  createSchedulePattern,
  updateSchedulePattern,
  deleteSchedulePattern,
  getScheduleOverrides,
  createScheduleOverride,
  updateScheduleOverride,
  deleteScheduleOverride,
  getSchedulePatternTimeSlots,
  getExpertScheduleWeek,
  completeBooking
}; 
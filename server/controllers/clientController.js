// server/controllers/clientController.js
import clientService from '../services/clientService.js';
import { cloudinary } from '../utils/cloudinaryConfig.js';
import { ObjectId } from 'mongodb';
import elasticSearchService from '../services/elasticSearchService.js';

// Lấy danh sách booking của khách hàng
const getClientBookings = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { filter, cursor, search, date, field } = req.query; // Lấy thêm các tham số tìm kiếm và lọc
    
    // Lấy thông tin phân trang từ query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Đảm bảo limit là số hợp lệ
    if (limit < 1 || limit > 50) {
      return res.status(400).json({ 
        message: 'Tham số limit không hợp lệ. Limit phải từ 1-50.' 
      });
    }
    
    // Tạo đối tượng chứa các tham số lọc
    const filterParams = {
      filter,
      search,
      date,
      field
    };
    
    console.log('Filter params received:', filterParams);
    
    // Lấy danh sách booking từ service với tham số filter, cursor, limit và các tham số lọc bổ sung
    const result = await clientService.getClientBookings(clientId, filterParams, page, limit, cursor);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get client bookings error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách đặt lịch' });
  }
};

// Tạo booking mới
const createBooking = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { expertId, date, startTime, endTime, note } = req.body;
    
    console.log("Booking request data:", { 
      clientId, expertId, date, startTime, endTime, 
      hasFiles: req.files && req.files.length > 0 
    });
    
    if (!expertId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin đặt lịch' });
    }
    
    // Xử lý file đính kèm nếu có
    const attachments = [];
    
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} attachment files`);
      
      // Upload files lên Cloudinary
      for (const file of req.files) {
        try {
          // Chuyển file buffer thành base64 để upload lên Cloudinary
          const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          
          const result = await cloudinary.uploader.upload(base64File, {
            folder: 'cilis-booking/bookings',
            resource_type: 'auto'
          });
          
          attachments.push({
            publicId: result.public_id,
            url: result.secure_url,
            filename: file.originalname,
            fileType: file.mimetype,
            size: file.size
          });
          
          console.log(`File uploaded successfully: ${file.originalname}`);
        } catch (uploadError) {
          console.error(`Error uploading file ${file.originalname}:`, uploadError);
        }
      }
    }
    
    // Thêm attachments vào booking data
    const booking = await clientService.createBooking(clientId, {
      expertId,
      date,
      startTime,
      endTime,
      note,
      attachments // Thêm danh sách file đính kèm
    });
    
    // Đảm bảo booking không null và có _id
    if (!booking || !booking._id) {
      console.error('Invalid booking returned from clientService:', booking);
      return res.status(500).json({ message: 'Lỗi khi tạo booking: Không nhận được thông tin booking hợp lệ' });
    }
    
    console.log('Booking created successfully:', {
      bookingId: booking._id,
      status: booking.status,
      date: booking.date,
      time: `${booking.startTime} - ${booking.endTime}` 
    });
    
    // Trả về thông tin booking đã được tạo, đảm bảo _id có trong response
    return res.status(201).json({
      message: 'Đặt lịch thành công',
      booking: booking,
      _id: booking._id // Thêm _id ở cấp cao nhất của response để dễ truy cập
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(400).json({ message: error.message || 'Lỗi khi đặt lịch' });
  }
};

// Hủy booking
const cancelBooking = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ID của booking' });
    }
    
    const result = await clientService.cancelBooking(clientId, bookingId);
    
    return res.status(200).json({
      message: 'Hủy đặt lịch thành công'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(400).json({ message: error.message || 'Lỗi khi hủy đặt lịch' });
  }
};

// Lấy danh sách tất cả chuyên gia
const getExperts = async (req, res) => {
  try {
    // Bắt đầu đo tổng thời gian
    const totalStart = process.hrtime();
    console.log('=== DEBUG PERFORMANCE: Bắt đầu xử lý route /api/clients/experts ===');

    const { 
      search, 
      field, 
      cursor, 
      limit = 12,
      minPrice,
      maxPrice,
      minRating
    } = req.query;
    
    // Đo thời gian xử lý tham số
    const parseParamsStart = process.hrtime();
    
    // Chuyển đổi limit thành số nguyên
    const limitNum = parseInt(limit) || 12;
    // Giới hạn số lượng kết quả tối đa
    if (limitNum > 50) {
      return res.status(400).json({ 
        message: 'Limit không được vượt quá 50'
      });
    }
    
    // Xây dựng query filters
    const filters = {};
    
    // Thêm filter theo field nếu có
    if (field) {
      filters.field = field;
    }
    
    // Thêm filter theo khoảng giá nếu có
    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.price = {};
      if (minPrice !== undefined) {
        filters.price.$gte = parseInt(minPrice);
      }
      if (maxPrice !== undefined) {
        filters.price.$lte = parseInt(maxPrice);
      }
    }
    
    // Thêm filter theo rating nếu có
    if (minRating !== undefined) {
      filters.rating = { $gte: parseFloat(minRating) };
    }
    
    const parseParamsEnd = process.hrtime(parseParamsStart);
    const parseParamsTime = parseParamsEnd[0] * 1000 + parseParamsEnd[1] / 1000000;
    console.log(`[DEBUG] Thời gian xử lý tham số: ${parseParamsTime.toFixed(2)}ms`);
    
    let result;
    
    // Kiểm tra nếu có bất kỳ bộ lọc nào hoặc có từ khóa tìm kiếm thì ưu tiên sử dụng Elasticsearch
    const shouldUseElasticsearch = search || field || minPrice !== undefined || maxPrice !== undefined || minRating !== undefined;
    
    if (shouldUseElasticsearch) {
      try {
        // Đo thời gian thực hiện tìm kiếm Elasticsearch
        const searchStart = process.hrtime();
        
        // Tải Elasticsearch service
        const elasticSearchService = await import('../services/elasticSearchService.js').then(module => module.default);
        
        console.log(`Sử dụng Elasticsearch với ${search ? 'từ khóa: "' + search + '"' : 'các bộ lọc'}`);
        
        // Gọi phương thức tìm kiếm của Elasticsearch
        result = await elasticSearchService.searchExperts(search || '', filters, limitNum, cursor);
        
        const searchEnd = process.hrtime(searchStart);
        const searchTime = searchEnd[0] * 1000 + searchEnd[1] / 1000000;
        console.log(`[DEBUG] Thời gian thực hiện tìm kiếm Elasticsearch: ${searchTime.toFixed(2)}ms`);
        
        console.log(`Elasticsearch trả về ${result.experts.length} kết quả`);
      } catch (elasticError) {
        console.error('Lỗi khi tìm kiếm với Elasticsearch:', elasticError);
        console.log('Chuyển sang tìm kiếm với MongoDB...');
        
        // Fallback với MongoDB khi Elasticsearch lỗi
        const mongoStart = process.hrtime();
        
        if (cursor) {
          filters._id = { $gt: new ObjectId(cursor) };
        }
        
        let experts;
        if (search) {
          experts = await clientService.searchExpertsWithFilters(search, filters, limitNum);
        } else {
          experts = await clientService.getExpertsWithFilters(filters, limitNum);
        }
        
        const nextCursor = experts.length > 0 ? experts[experts.length - 1]._id : null;
        const hasMore = experts.length === limitNum;
        
        result = {
          experts,
          nextCursor: nextCursor ? nextCursor.toString() : null,
          hasMore
        };
        
        const mongoEnd = process.hrtime(mongoStart);
        const mongoTime = mongoEnd[0] * 1000 + mongoEnd[1] / 1000000;
        console.log(`[DEBUG] Thời gian thực hiện tìm kiếm MongoDB: ${mongoTime.toFixed(2)}ms`);
      }
    } else {
      // Nếu không có bộ lọc nào, dùng MongoDB bình thường
      const listStart = process.hrtime();
      
      if (cursor) {
        filters._id = { $gt: new ObjectId(cursor) };
      }
      
      const experts = await clientService.getExpertsWithFilters(filters, limitNum);
      
      const nextCursor = experts.length > 0 ? experts[experts.length - 1]._id : null;
      const hasMore = experts.length === limitNum;
      
      result = {
        experts,
        nextCursor: nextCursor ? nextCursor.toString() : null,
        hasMore
      };
      
      const listEnd = process.hrtime(listStart);
      const listTime = listEnd[0] * 1000 + listEnd[1] / 1000000;
      console.log(`[DEBUG] Thời gian lấy danh sách từ MongoDB: ${listTime.toFixed(2)}ms`);
    }
    
    // Tính tổng thời gian xử lý
    const totalEnd = process.hrtime(totalStart);
    const totalTime = totalEnd[0] * 1000 + totalEnd[1] / 1000000;
    console.log(`=== DEBUG PERFORMANCE: Tổng thời gian xử lý route: ${totalTime.toFixed(2)}ms ===`);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get experts error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách chuyên gia' });
  }
};

// Lấy thông tin chi tiết của chuyên gia
const getExpertDetail = async (req, res) => {
  try {
    const { expertId } = req.params;
    
    if (!expertId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ID của chuyên gia' });
    }
    
    const expert = await clientService.getExpertDetail(expertId);
    
    return res.status(200).json(expert);
  } catch (error) {
    console.error('Get expert detail error:', error);
    if (error.message === 'Chuyên gia không tồn tại') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy thông tin chuyên gia' });
  }
};

// Cập nhật hồ sơ khách hàng
const updateClientProfile = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { name, phone, avatar } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tên' });
    }
    
    await clientService.updateClientProfile(clientId, {
      name,
      phone,
      avatar
    });
    
    return res.status(200).json({
      message: 'Cập nhật hồ sơ thành công'
    });
  } catch (error) {
    console.error('Update client profile error:', error);
    return res.status(400).json({ message: error.message || 'Lỗi khi cập nhật hồ sơ' });
  }
};

// Thêm đánh giá cho chuyên gia
const addReview = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { expertId, rating, comment, bookingId } = req.body;
    
    if (!expertId || !rating) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin đánh giá' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao' });
    }
    
    await clientService.addReview(clientId, {
      expertId,
      rating,
      comment,
      bookingId
    });
    
    return res.status(201).json({
      message: 'Thêm đánh giá thành công'
    });
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(400).json({ message: error.message || 'Lỗi khi thêm đánh giá' });
  }
};

// Lấy lịch làm việc của một chuyên gia theo ngày
const getExpertSchedule = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { date } = req.query;

    if (!expertId || !date) {
      return res.status(400).json({ message: 'Thiếu thông tin chuyên gia hoặc ngày' });
    }

    const schedule = await clientService.getExpertScheduleByDate(expertId, date);
    
    // Lọc bớt thông tin không cần thiết
    const filteredTimeSlots = schedule.timeSlots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: slot.available,
      ...(slot.isCustom ? { isCustom: true } : {})
    }));

    return res.json({
      date: schedule.date,
      timeSlots: filteredTimeSlots,
      type: schedule.type,
      ...(schedule.reason ? { reason: schedule.reason } : {})
    });
  } catch (error) {
    console.error('Error getting expert schedule:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Lấy lịch làm việc của một chuyên gia theo ngày (khác endpoint)
const getExpertScheduleByDate = async (req, res) => {
  try {
    const { expertId, date } = req.params;

    if (!expertId || !date) {
      return res.status(400).json({ message: 'Thiếu thông tin chuyên gia hoặc ngày' });
    }

    const schedule = await clientService.getExpertScheduleByDate(expertId, date);
    
    // Lọc bớt thông tin không cần thiết
    const filteredTimeSlots = schedule.timeSlots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: slot.available,
      ...(slot.isCustom ? { isCustom: true } : {})
    }));

    return res.json({
      date: schedule.date,
      timeSlots: filteredTimeSlots,
      type: schedule.type,
      ...(schedule.reason ? { reason: schedule.reason } : {})
    });
  } catch (error) {
    console.error('Error getting expert schedule by date:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Lấy các ngày có lịch trống của chuyên gia
const getExpertAvailableDates = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!expertId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }
    
    const availableDates = await clientService.getExpertAvailableDates(expertId, startDate, endDate);
    
    return res.status(200).json(availableDates);
  } catch (error) {
    console.error('Get expert available dates error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách ngày có lịch trống' });
  }
};

// Lấy đánh giá của chuyên gia
const getExpertReviews = async (req, res) => {
  try {
    const { expertId } = req.params;
    
    // Lấy thông tin phân trang từ query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Đảm bảo page và limit là số hợp lệ
    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({ 
        message: 'Tham số phân trang không hợp lệ. Page phải >= 1, limit phải từ 1-50.' 
      });
    }
    
    if (!expertId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ID của chuyên gia' });
    }
    
    const result = await clientService.getExpertReviews(expertId, page, limit);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get expert reviews error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy đánh giá của chuyên gia' });
  }
};

// Lấy thông tin chi tiết của một đặt lịch
const getBookingDetail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const clientId = req.user._id;
    
    console.log(`Fetching booking detail for ID: ${bookingId}, client: ${clientId}`);
    
    // Gọi service để lấy thông tin chi tiết booking
    const booking = await clientService.getBookingById(bookingId);
    
    // Kiểm tra quyền truy cập (chỉ client sở hữu booking mới được xem)
    if (booking.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập booking này' });
    }
    
    // Lấy thêm thông tin chuyên gia nếu cần
    if (booking.expertId) {
      const expert = await clientService.getExpertDetail(booking.expertId);
      
      // Thêm thông tin chuyên gia vào response
      booking.expertDetails = expert ? {
        name: expert.name,
        field: expert.field,
        expertise: expert.expertise,
        avatar: expert.avatar
      } : null;
    }
    
    // Kiểm tra xem booking này đã được đánh giá chưa
    const hasReview = await clientService.checkBookingHasReview(clientId, booking._id);
    booking.hasReview = hasReview;
    
    console.log(`Found booking detail for ID: ${bookingId}, hasReview: ${hasReview}`);
    return res.status(200).json(booking);
  } catch (error) {
    console.error('Get booking detail error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy thông tin chi tiết đặt lịch' });
  }
};

// Lấy chi tiết đánh giá của một booking
const getBookingReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const clientId = req.user._id;
    
    console.log(`Fetching review for booking ID: ${bookingId}, client: ${clientId}`);
    
    // Kiểm tra booking tồn tại và thuộc về client
    const booking = await clientService.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy buổi tư vấn' });
    }
    
    if (booking.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập đánh giá này' });
    }
    
    // Lấy đánh giá
    const review = await clientService.getReviewByBookingId(bookingId);
    
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá cho buổi tư vấn này' });
    }
    
    // Trả về thông tin đánh giá 
    return res.status(200).json(review);
  } catch (error) {
    console.error('Get booking review error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy thông tin đánh giá' });
  }
};

// Lấy thống kê số lượng booking theo loại
const getClientBookingStats = async (req, res) => {
  try {
    const clientId = req.user._id;
    
    console.log(`Fetching booking stats for client ${clientId}`);
    
    // Lấy thống kê booking từ service
    const stats = await clientService.getBookingStats(clientId);
    
    console.log(`Booking stats for client ${clientId}:`, stats);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Get client booking stats error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy thống kê đặt lịch' });
  }
};

export default {
  getClientBookings,
  createBooking,
  cancelBooking,
  getExperts,
  getExpertDetail,
  updateClientProfile,
  addReview,
  getExpertSchedule,
  getExpertScheduleByDate,
  getExpertAvailableDates,
  getExpertReviews,
  getBookingDetail,
  getBookingReview,
  getClientBookingStats
};
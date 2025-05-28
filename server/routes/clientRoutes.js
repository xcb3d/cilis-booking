import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import clientController from '../controllers/clientController.js';
import { uploadMiddleware, cloudinary } from '../utils/cloudinaryConfig.js';
import multer from 'multer';

const router = express.Router();

// Cấu hình middleware multer cho booking attachments
const bookingStorage = new multer.memoryStorage();
const bookingUpload = multer({
  storage: bookingStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB mỗi file
    files: 10, // Giới hạn tối đa 10 file
  },
  fileFilter: (req, file, cb) => {
    // Kiểm tra loại file được phép
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      // Chấp nhận file
      cb(null, true);
    } else {
      // Từ chối file
      cb(new Error('Định dạng file không được hỗ trợ'), false);
    }
  }
});

// Áp dụng middleware xác thực cho tất cả API của client
router.use(authMiddleware.authenticateToken);

// Route lấy danh sách đặt lịch của khách hàng
router.get('/bookings', clientController.getClientBookings);

// Route lấy thống kê số lượng booking theo loại
router.get('/bookings/stats', clientController.getClientBookingStats);

// Route lấy thông tin chi tiết của một đặt lịch
router.get('/bookings/:bookingId', clientController.getBookingDetail);

// Route lấy thông tin đánh giá của một đặt lịch
router.get('/bookings/:bookingId/review', clientController.getBookingReview);

// Route tạo đặt lịch mới với file đính kèm
router.post('/bookings', bookingUpload.array('attachments', 10), clientController.createBooking);

// Route hủy đặt lịch
router.patch('/bookings/:bookingId/cancel', clientController.cancelBooking);

// Route lấy danh sách chuyên gia (có thể tìm kiếm và lọc)
router.get('/experts', clientController.getExperts);

// Route lấy thông tin chi tiết của chuyên gia
router.get('/experts/:expertId', clientController.getExpertDetail);

// Route lấy lịch của chuyên gia theo ngày
router.get('/experts/:expertId/schedule', clientController.getExpertSchedule);

// Route lấy các ngày có lịch trống trong khoảng thời gian
router.get('/experts/:expertId/available-dates', clientController.getExpertAvailableDates);

// Route lấy đánh giá của chuyên gia
router.get('/experts/:expertId/reviews', clientController.getExpertReviews);

// Route lấy lịch của chuyên gia theo ngày cụ thể
router.get('/expert-schedule/:expertId/:date', clientController.getExpertScheduleByDate);

// Route cập nhật hồ sơ khách hàng
router.patch('/profile', clientController.updateClientProfile);

// Route thêm đánh giá cho chuyên gia
router.post('/reviews', clientController.addReview);

export default router;

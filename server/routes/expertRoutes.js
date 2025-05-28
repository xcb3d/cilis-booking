import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import expertController from '../controllers/expertController.js';
import { uploadMiddleware } from '../utils/cloudinaryConfig.js';

const router = express.Router();

// QUAN TRỌNG: Loại bỏ middleware toàn cục để tránh chạy nhiều lần
// router.use(authMiddleware.authenticateToken);
// router.use(authMiddleware.checkExpertRole);

// Middleware đo thời gian processing route
const measureRouteTime = (routeName) => (req, res, next) => {
  const routeHandlingStart = process.hrtime();
  console.log(`[Route] Starting ${routeName}`);
  
  // Lưu thời gian bắt đầu xử lý route
  req.routeHandlingStart = routeHandlingStart;
  
  // Override res.json để đo thời gian
  const originalJson = res.json;
  res.json = function(data) {
    const routeHandlingEnd = process.hrtime(routeHandlingStart);
    const routeHandlingTime = routeHandlingEnd[0] * 1000 + routeHandlingEnd[1] / 1000000;
    console.log(`[Route] ${routeName} completed in ${routeHandlingTime.toFixed(2)}ms`);
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Áp dụng middleware xác thực chỉ một lần cho mỗi route
// Lịch làm việc của chuyên gia trong khoảng thời gian (tuần)
router.get('/schedule-week', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-week'),
  expertController.getExpertScheduleWeek
);

// Route lấy thông tin dashboard chuyên gia (cần thông tin đầy đủ của user)
router.get('/dashboard', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  authMiddleware.loadFullUserDetails, // Thêm middleware lấy thông tin đầy đủ
  measureRouteTime('/dashboard'),
  expertController.getExpertDashboard
);

// Route lấy bookings của chuyên gia
router.get('/bookings', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/bookings'),
  expertController.getExpertBookings
);

// Route lấy reviews của chuyên gia
router.get('/reviews', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/reviews'),
  expertController.getExpertReviews
);

// Route upload hồ sơ xác minh chuyên gia
router.post('/verification', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  uploadMiddleware.fields([
    { name: 'identification', maxCount: 2 },
    { name: 'certification', maxCount: 5 },
    { name: 'experience', maxCount: 3 },
    { name: 'license', maxCount: 2 }
  ]),
  measureRouteTime('/verification'),
  expertController.uploadVerificationDocuments
);

// Lấy thống kê số lượng booking theo loại
router.get('/bookings/stats', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/bookings/stats'),
  expertController.getExpertBookingStats
);

// Lấy trạng thái xác minh
router.get('/verification-status', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/verification-status'),
  expertController.getVerificationStatus
);

// Cập nhật thông tin chuyên gia
router.post('/update-info', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/update-info'),
  expertController.updateExpertInfo
);

// Lấy lịch làm việc của chuyên gia
router.get('/schedule', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule'),
  expertController.getExpertSchedule
);

// Cập nhật lịch làm việc của chuyên gia
router.post('/schedule', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-update'),
  expertController.updateExpertSchedule
);

// Lấy danh sách các ngày có lịch làm việc
router.get('/available-dates', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/available-dates'),
  expertController.getAvailableDates
);

// Routes cho mẫu lịch làm việc (schedule patterns)
router.get('/schedule-patterns', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-patterns'),
  expertController.getSchedulePatterns
);
router.post('/schedule-patterns', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-patterns-create'),
  expertController.createSchedulePattern
);
router.put('/schedule-patterns/:patternId', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-patterns-update'),
  expertController.updateSchedulePattern
);
router.delete('/schedule-patterns/:patternId', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-patterns-delete'),
  expertController.deleteSchedulePattern
);

// Routes cho lịch ngoại lệ (schedule overrides)
router.get('/schedule-overrides', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-overrides'),
  expertController.getScheduleOverrides
);
router.post('/schedule-overrides', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-overrides-create'),
  expertController.createScheduleOverride
);
router.put('/schedule-overrides/:overrideId', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-overrides-update'),
  expertController.updateScheduleOverride
);
router.delete('/schedule-overrides/:overrideId', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-overrides-delete'),
  expertController.deleteScheduleOverride
);

// Route lấy khung giờ làm việc theo pattern
router.get('/schedule-pattern-slots', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/schedule-pattern-slots'),
  expertController.getSchedulePatternTimeSlots
);

// Route đánh dấu booking là đã hoàn thành
router.put('/bookings/:bookingId/complete', 
  authMiddleware.authenticateToken,
  authMiddleware.checkExpertRole,
  measureRouteTime('/bookings-complete'),
  expertController.completeBooking
);

export default router; 
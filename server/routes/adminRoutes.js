import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminController from '../controllers/adminController.js';

const router = express.Router();

// Áp dụng middleware xác thực cho tất cả API của admin
router.use(authMiddleware.authenticateToken);

// Route lấy dữ liệu analytics tổng quát
router.get('/analytics', adminController.getAnalytics);

// Route lấy danh sách người dùng
router.get('/users', adminController.getUsers);

// Route lấy danh sách chuyên gia
router.get('/experts', adminController.getExperts);

// Route lấy danh sách đặt lịch
router.get('/bookings', adminController.getBookings);

// Route xác thực chuyên gia
router.post('/experts/verify', adminController.verifyExpert);

// Route cập nhật thông tin chuyên gia
router.put('/experts/:id', adminController.updateExpert);

// Route xóa người dùng
router.delete('/users/:userId', adminController.deleteUser);

// Route cập nhật trạng thái đặt lịch
router.patch('/bookings/:bookingId/status', adminController.updateBookingStatus);

// Route yêu cầu xác minh lại giấy tờ
router.post('/experts/request-reverification', adminController.requestReverification);

export default router; 
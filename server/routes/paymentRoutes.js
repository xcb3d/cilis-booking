import express from 'express';
import paymentController from '../controllers/paymentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route tạo URL thanh toán VNPay - Yêu cầu xác thực
router.post('/create-payment', authMiddleware.authenticateToken, paymentController.createPaymentUrl);

// Route xử lý kết quả trả về từ VNPay - Không yêu cầu xác thực vì VNPay gọi trực tiếp
router.get('/vnpay_return', paymentController.vnpayReturn);

// Route xử lý IPN (Instant Payment Notification) từ VNPay - Không yêu cầu xác thực
router.get('/vnpay_ipn', paymentController.vnpayIpn);

// Route truy vấn trạng thái thanh toán - Yêu cầu xác thực
router.get('/status/:bookingId', authMiddleware.authenticateToken, paymentController.queryPaymentStatus);

export default router; 
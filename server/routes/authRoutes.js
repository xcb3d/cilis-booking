import express from 'express';
import authController from '../controllers/authController.js';
import authValidation from '../validations/authValidation.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route đăng nhập
router.post('/login', authValidation.validateLogin, authController.login);

// Route đăng ký
router.post('/register', authValidation.validateRegister, authController.register);

// Route refresh token
router.post('/refresh', authController.refresh);

// Route đăng xuất
router.post('/logout', authController.logout);

// Route lấy thông tin user hiện tại
router.get('/me', 
  authMiddleware.authenticateToken, 
  authMiddleware.loadFullUserDetails, 
  authController.me
);

export default router;

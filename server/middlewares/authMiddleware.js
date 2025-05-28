import jwt from '../utils/jwt.js';
import userModel from '../models/userModel.js';

// Middleware xác thực token (tối ưu: sử dụng thông tin từ JWT)
const authenticateToken = async (req, res, next) => {
  const authStartTime = process.hrtime();
  
  try {
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ message: 'Unauthorized: No access token provided' });
    }
    
    // Xác thực token JWT
    const decoded = jwt.verifyAccessToken(accessToken);
    
    if (!decoded) {
      return res.status(403).json({ message: 'Forbidden: Invalid access token' });
    }
    
    // Sử dụng thông tin từ JWT thay vì truy vấn DB
    req.user = {
      _id: decoded.id,
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      // Các trường khác nếu có trong JWT
    };
    
    const authEndTime = process.hrtime(authStartTime);
    const totalAuthTime = authEndTime[0] * 1000 + authEndTime[1] / 1000000;
    console.log(`[JWT Auth] Total time: ${totalAuthTime.toFixed(2)}ms`);
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware để tải thông tin đầy đủ của user (sử dụng khi cần)
const loadFullUserDetails = async (req, res, next) => {
  const loadStartTime = process.hrtime();
  
  try {
    // Chỉ thực hiện nếu đã có thông tin cơ bản từ JWT
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized: User information not available' });
    }
    
    // Truy vấn database để lấy thông tin đầy đủ
    const user = await userModel.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Loại bỏ password
    const { password, ...userWithoutPassword } = user;

    // Loại bỏ các trường không mong muốn khác
    delete userWithoutPassword.documents;
    delete userWithoutPassword.verificationComment;
    delete userWithoutPassword.verificationDate;
    delete userWithoutPassword.verificationSubmittedAt;

    // Cập nhật req.user với thông tin đầy đủ
    req.user = {
      ...req.user,
      ...userWithoutPassword
    };
    
    const loadEndTime = process.hrtime(loadStartTime);
    const loadTime = loadEndTime[0] * 1000 + loadEndTime[1] / 1000000;
    console.log(`[User Details] Load time: ${loadTime.toFixed(2)}ms`);
    
    next();
  } catch (error) {
    console.error('Error loading user details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware kiểm tra người dùng có vai trò Expert không (đã tối ưu)
const checkExpertRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Bạn phải đăng nhập trước khi thực hiện thao tác này' });
  }

  if (req.user.role !== 'expert') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập vào tài nguyên này' });
  }

  next();
};

// Middleware kiểm tra người dùng có vai trò Admin không
const checkAdminRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Bạn phải đăng nhập trước khi thực hiện thao tác này' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập vào tài nguyên này' });
  }

  next();
};

export default {
  authenticateToken,
  loadFullUserDetails,
  checkExpertRole,
  checkAdminRole
};

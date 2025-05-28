import authService from '../services/authService.js';
import jwt from '../utils/jwt.js';

// Controller xử lý login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Gọi service để xử lý login
    const { accessToken, refreshToken, user } = await authService.login(email, password);
    
    // Thiết lập cookies
    jwt.setTokens(res, accessToken, refreshToken);
    
    // Trả về thông tin user (không bao gồm password)
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ message: error.message || 'Đăng nhập thất bại' });
  }
};

// Controller xử lý đăng ký
const register = async (req, res) => {
  try {
    // Gọi service để xử lý đăng ký
    const user = await authService.register(req.body);
    
    // Trả về thông tin của user đã đăng ký
    return res.status(201).json({ 
      message: 'Đăng ký thành công', 
      user 
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(400).json({ message: error.message || 'Đăng ký thất bại' });
  }
};

// Controller xử lý refresh token
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }
    
    // Gọi service để xử lý refresh token
    const { accessToken } = await authService.refreshToken(refreshToken);
    
    // Set new access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    return res.status(200).json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Controller xử lý logout
const logout = (req, res) => {
  try {
    // Xóa cookies
    jwt.clearTokens(res);
    
    return res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Đăng xuất thất bại' });
  }
};

// Controller lấy thông tin user hiện tại
const me = async (req, res) => {
  try {
    // Thông tin user đã được gắn vào req.user bởi middleware authenticateToken
    return res.status(200).json(req.user);
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng' });
  }
};

export default {
  login,
  refresh,
  logout,
  me,
  register
}; 
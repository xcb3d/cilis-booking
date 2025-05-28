import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import jwt from '../utils/jwt.js';

// Service xử lý login
const login = async (email, password) => {
  // Tìm user theo email
  const user = await userModel.findByEmail(email);
  
  if (!user) {
    throw new Error('Email hoặc mật khẩu không chính xác');
  }
  
  // Kiểm tra password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Email hoặc mật khẩu không chính xác');
  }
  
  // Tạo payload cho JWT
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };
  
  // Tạo access token và refresh token
  const accessToken = jwt.generateAccessToken(payload);
  const refreshToken = jwt.generateRefreshToken(payload);
  
  // Loại bỏ password từ user object
  const { password: _, ...userWithoutPassword } = user;
  
  return { 
    accessToken, 
    refreshToken, 
    user: userWithoutPassword 
  };
};

// Service xử lý đăng ký
const register = async (userData) => {
  // Kiểm tra email đã tồn tại chưa
  const existingUser = await userModel.findByEmail(userData.email);
  
  if (existingUser) {
    throw new Error('Email này đã được sử dụng');
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  // Chuẩn bị dữ liệu người dùng
  const userToCreate = {
    email: userData.email,
    password: hashedPassword,
    name: userData.name,
    phone: userData.phone,
    role: userData.role,
    createdAt: new Date()
  };
  
  // Nếu đăng ký chuyên gia, thêm các trường chuyên gia
  if (userData.role === 'expert') {
    // Chuyên gia mới chưa được xác thực
    userToCreate.verified = 'unverified';
    
    // Thêm các trường thông tin chuyên gia
    userToCreate.field = userData.field;
    userToCreate.expertise = userData.expertise;
    userToCreate.experience = userData.experience;
    userToCreate.price = userData.price;
    
    // Tạo một avatar mặc định cho chuyên gia
    userToCreate.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`;
    
    // Khởi tạo rating và review count
    userToCreate.rating = 0;
    userToCreate.reviewCount = 0;
  } else {
    // Tạo một avatar mặc định cho client
    userToCreate.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`;
  }
  
  // Lưu người dùng vào database
  const userId = await userModel.create(userToCreate);
  
  // Lấy thông tin người dùng đã tạo (không bao gồm password)
  const createdUser = await userModel.findById(userId);
  
  if (!createdUser) {
    throw new Error('Lỗi khi tạo tài khoản');
  }
  
  // Nếu là expert đã được xác minh (mặc dù thông thường người mới luôn có verified = 'unverified')
  // thì tiến hành đồng bộ với Elasticsearch
  if (createdUser.role === 'expert' && createdUser.verified === 'verified') {
    try {
      const elasticSearchService = (await import('../services/elasticSearchService.js')).default;
      await elasticSearchService.indexExpert(createdUser);
      console.log(`Đã thêm expert ${userId} vào Elasticsearch`);
    } catch (elasticError) {
      console.error('Lỗi khi thêm expert vào Elasticsearch:', elasticError);
      // Không throw lỗi để không ảnh hưởng đến luồng chính
    }
  }
  
  // Loại bỏ password từ object trả về
  const { password, ...userWithoutPassword } = createdUser;
  
  return userWithoutPassword;
};

// Service xử lý refresh token
const refreshToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }
    
    // Tìm user trong database
    const user = await userModel.findById(decoded.id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Tạo payload cho JWT
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role
    };
    
    // Tạo access token mới
    const newAccessToken = jwt.generateAccessToken(payload);
    
    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Lấy thông tin user hiện tại
const getCurrentUser = async (userId) => {
  const user = await userModel.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Loại bỏ password từ user object
  const { password, ...userWithoutPassword } = user;
  
  return userWithoutPassword;
};

export default {
  login,
  refreshToken,
  getCurrentUser,
  register
};

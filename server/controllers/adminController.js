import { VERIFICATION_STATUS } from '../utils/constants.js';
import adminService from '../services/adminService.js';

// Controller lấy thông tin analytics tổng quát
const getAnalytics = async (req, res) => {
  try {
    const analyticsData = await adminService.getAnalytics();
    return res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy dữ liệu phân tích' });
  }
};

// Controller lấy danh sách tất cả người dùng
const getUsers = async (req, res) => {
  try {
    const { cursor, limit = 20, search, role } = req.query;
    const filters = {
      search: search || undefined,
      role: role === 'all' || !role ? undefined : role,
    };
    const parsedLimit = parseInt(limit, 10);

    const result = await adminService.getAllUsers(cursor, parsedLimit, filters);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách người dùng' });
  }
};

// Controller lấy danh sách tất cả chuyên gia
const getExperts = async (req, res) => {
  try {
    // Lấy cursor, limit và các tham số filter từ query params
    const { cursor, limit = 20, search, field, verified } = req.query; 
    const filters = { 
      search: search || undefined, 
      field: field || undefined, 
      verified: verified || undefined 
    };
    // Chuyển limit sang số nguyên
    const parsedLimit = parseInt(limit, 10);

    const result = await adminService.getAllExperts(cursor, parsedLimit, filters);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get experts error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách chuyên gia' });
  }
};

// Controller lấy danh sách client
const getClients = async (req, res) => {
  try {
    const { cursor, limit = 20, search } = req.query;
    const filters = {
      search: search || undefined,
    };
    const parsedLimit = parseInt(limit, 10);

    const result = await adminService.getAllClients(cursor, parsedLimit, filters);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get clients error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách client' });
  }
};

// Controller lấy tất cả bookings
const getBookings = async (req, res) => {
  try {
    // Lấy các tham số từ query string
    const { filter, limit = 10, cursor, search, date } = req.query;
    
    // Đảm bảo limit là số hợp lệ
    const parsedLimit = parseInt(limit) || 10;
    if (parsedLimit < 1 || parsedLimit > 50) {
      return res.status(400).json({ 
        message: 'Tham số limit không hợp lệ. Limit phải từ 1-50.' 
      });
    }
    
    console.log(`Fetching bookings with filter: ${filter || 'all'}, limit: ${parsedLimit}, cursor: ${cursor || 'initial'}, search: ${search || 'none'}, date: ${date || 'none'}`);
    
    // Gọi service để lấy danh sách bookings đã được lọc và phân trang
    const result = await adminService.getAllBookings(filter, parsedLimit, cursor, search, date);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách đặt lịch' });
  }
};

// Controller xác thực chuyên gia
const verifyExpert = async (req, res) => {
  try {
    const { expertId, status, comment } = req.body;
    
    if (!expertId || !status) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }
    
    const result = await adminService.verifyExpert(expertId, status, comment, req.user._id);
    
    return res.status(200).json({
      message: `Đã ${status === 'verified' ? 'xác minh' : status === 'rejected' ? 'từ chối' : 'cập nhật trạng thái'} chuyên gia thành công`
    });
  } catch (error) {
    console.error('Verify expert error:', error);
    if (error.message === 'Expert not found') {
      return res.status(404).json({ message: 'Không tìm thấy chuyên gia' });
    }
    return res.status(500).json({ message: error.message || 'Lỗi khi xác minh chuyên gia' });
  }
};

// Controller xóa người dùng
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'Thiếu ID người dùng' });
    }
    
    const result = await adminService.deleteUser(userId);
    return res.status(200).json({ message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    if (error.message === 'Cannot delete user with existing bookings') {
      return res.status(400).json({ 
        message: 'Không thể xóa người dùng này vì đã có lịch hẹn. Hãy hủy tất cả lịch hẹn trước khi xóa.' 
      });
    }
    return res.status(500).json({ message: error.message || 'Lỗi khi xóa người dùng' });
  }
};

// Controller cập nhật trạng thái booking
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    if (!bookingId || !status) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }
    
    const result = await adminService.updateBookingStatus(bookingId, status);
    return res.status(200).json({ message: 'Đã cập nhật trạng thái booking thành công' });
  } catch (error) {
    console.error('Update booking status error:', error);
    if (error.message === 'Booking not found or status not changed') {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }
    return res.status(500).json({ message: error.message || 'Lỗi khi cập nhật trạng thái booking' });
  }
};

// Controller cập nhật thông tin chuyên gia
const updateExpert = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, field, expertise, experience, price, phone } = req.body;
    
    if (!id || !name || !email || !field || !expertise || !experience || !price) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }
    
    const expertData = {
      name,
      email,
      phone,
      field,
      expertise,
      experience,
      price: Number(price)
    };
    
    const result = await adminService.updateExpert(id, expertData);
    
    return res.status(200).json({
      message: 'Cập nhật thông tin chuyên gia thành công'
    });
  } catch (error) {
    console.error('Update expert error:', error);
    if (error.message === 'Expert not found') {
      return res.status(404).json({ message: 'Không tìm thấy chuyên gia' });
    }
    if (error.message === 'User is not an expert') {
      return res.status(400).json({ message: 'Người dùng không phải là chuyên gia' });
    }
    if (error.message === 'Email already exists') {
      return res.status(400).json({ message: 'Email này đã được sử dụng bởi người dùng khác' });
    }
    return res.status(500).json({ message: error.message || 'Lỗi khi cập nhật thông tin chuyên gia' });
  }
};

// Controller yêu cầu chuyên gia xác minh lại giấy tờ
const requestReverification = async (req, res) => {
  try {
    const { expertId, reason } = req.body;
    
    if (!expertId) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do yêu cầu xác minh lại' });
    }
    
    const result = await adminService.requestReverification(expertId, reason, req.user._id);
    
    return res.status(200).json({
      message: 'Đã gửi yêu cầu xác minh lại giấy tờ thành công'
    });
  } catch (error) {
    console.error('Request reverification error:', error);
    if (error.message === 'Expert not found') {
      return res.status(404).json({ message: 'Không tìm thấy chuyên gia' });
    }
    if (error.message === 'User is not an expert') {
      return res.status(400).json({ message: 'Người dùng không phải là chuyên gia' });
    }
    return res.status(500).json({ message: error.message || 'Lỗi khi yêu cầu xác minh lại giấy tờ' });
  }
};

export default {
  getAnalytics,
  getUsers,
  getExperts,
  getClients,
  getBookings,
  verifyExpert,
  deleteUser,
  updateBookingStatus,
  updateExpert,
  requestReverification
}; 
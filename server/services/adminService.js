import adminModel from '../models/adminModel.js';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { VERIFICATION_STATUS } from '../utils/constants.js';

// Lấy thông tin phân tích (phiên bản tối ưu với Aggregation)
async function getAnalytics() {
  try {
    const db = getDB();

    // --- 1. Thống kê người dùng ---
    const userStatsPipeline = [
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalClients: { $sum: { $cond: [{ $eq: ["$role", "client"] }, 1, 0] } },
          totalExperts: { $sum: { $cond: [{ $eq: ["$role", "expert"] }, 1, 0] } },
          verifiedExperts: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$role", "expert"] }, { $eq: ["$verified", "verified"] }] }, 1, 0]
            }
          }
        }
      },
      {
        $project: { // Đảm bảo trả về 0 nếu không có user nào
          _id: 0,
          totalUsers: { $ifNull: ["$totalUsers", 0] },
          totalClients: { $ifNull: ["$totalClients", 0] },
          totalExperts: { $ifNull: ["$totalExperts", 0] },
          verifiedExperts: { $ifNull: ["$verifiedExperts", 0] }
        }
      }
    ];

    // --- 2. Thống kê đặt lịch và Tổng doanh thu ---
    const bookingAggPipeline = [
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
          completedBookings: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          canceledBookings: { $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] } },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, { $ifNull: ["$price", 0] }, 0]
            }
          }
        }
      },
      {
        $project: { // Đảm bảo trả về 0 nếu không có booking
          _id: 0,
          totalBookings: { $ifNull: ["$totalBookings", 0] },
          confirmedBookings: { $ifNull: ["$confirmedBookings", 0] },
          completedBookings: { $ifNull: ["$completedBookings", 0] },
          canceledBookings: { $ifNull: ["$canceledBookings", 0] },
          totalRevenue: { $ifNull: ["$totalRevenue", 0] }
        }
      }
    ];

    // --- 3. Dữ liệu trạng thái đặt lịch (cho biểu đồ) ---
    const bookingStatusDataPipeline = [
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1
        }
      }
    ];

    // --- 4. Dữ liệu phân phối theo lĩnh vực (cho biểu đồ) ---
    const fieldDataPipeline = [
      { $match: { expertId: { $exists: true } } },
      {
        $lookup: {
          from: "users",
          localField: "expertId",
          foreignField: "_id",
          as: "expertInfo"
        }
      },
      { $unwind: "$expertInfo" },
      { $match: { "expertInfo.field": { $exists: true, $ne: null, $ne: "" } } },
      {
        $group: {
          _id: "$expertInfo.field",
          bookings: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          bookings: 1
        }
      },
      { $sort: { bookings: -1 } }
    ];

    // --- 5. Top 5 chuyên gia ---
    const topExpertsPipeline = [
      { $match: { expertId: { $exists: true }, status: "completed" } }, // Chỉ tính doanh thu từ booking đã hoàn thành
      {
        $group: {
          _id: "$expertId",
          bookings: { $sum: 1 }, // Có thể thay đổi logic đếm booking nếu muốn tính cả các status khác
          revenue: { $sum: { $ifNull: ["$price", 0] } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "expertDetails"
        }
      },
      { $unwind: "$expertDetails" },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: "$expertDetails.name",
          field: "$expertDetails.field",
          avatar: "$expertDetails.avatar",
          bookings: 1, // Số booking đã hoàn thành
          revenue: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ];
    
    // --- 6. Dữ liệu phân tích hàng tháng (gọi hàm getMonthlyDataOptimized) ---
    // Định nghĩa trong hàm getAnalytics để có thể truy cập db
    async function getMonthlyDataOptimized() {
      const monthsArray = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];
      const currentDate = new Date();
      const last12MonthsData = [];

      // Tạo một map cho 12 tháng gần nhất với giá trị khởi tạo là 0
      for (let i = 11; i >= 0; i--) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        last12MonthsData.push({
          name: monthsArray[d.getMonth()] + (d.getFullYear() !== currentDate.getFullYear() ? ` ${d.getFullYear()}` : ''),
          year: d.getFullYear(),
          month: d.getMonth(),
          bookings: 0,
          completionRate: 0,
          revenue: 0
        });
      }
      
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11); // Bắt đầu từ tháng đầu tiên của chu kỳ 12 tháng
      twelveMonthsAgo.setDate(1);
      twelveMonthsAgo.setHours(0, 0, 0, 0);

      const monthlyAggPipeline = [
        {
          $match: {
            date: { $gte: twelveMonthsAgo } // Chỉ lấy booking trong 12 tháng gần nhất
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" } // MongoDB month is 1-12
            },
            totalBookings: { $sum: 1 },
            completedBookings: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, { $ifNull: ["$price", 0] }, 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: { $subtract: ["$_id.month", 1] }, // Chuyển tháng sang 0-11 để khớp JS Date
            bookings: "$totalBookings",
            completionRate: {
              $cond: [
                { $gt: ["$totalBookings", 0] },
                { $round: [{ $multiply: [{ $divide: ["$completedBookings", "$totalBookings"] }, 100] }] },
                0
              ]
            },
            revenue: "$revenue"
          }
        },
        { $sort: { year: 1, month: 1 } }
      ];

      const monthlyResults = await db.collection('bookings').aggregate(monthlyAggPipeline, { allowDiskUse: true }).toArray();

      // Cập nhật last12MonthsData với dữ liệu từ DB
      monthlyResults.forEach(dbMonth => {
        const foundMonth = last12MonthsData.find(m => m.year === dbMonth.year && m.month === dbMonth.month);
        if (foundMonth) {
          foundMonth.bookings = dbMonth.bookings;
          foundMonth.completionRate = dbMonth.completionRate;
          foundMonth.revenue = dbMonth.revenue;
        }
      });
      // Chỉ lấy name, bookings, completionRate, revenue cho kết quả cuối cùng
      return last12MonthsData.map(({ name, bookings, completionRate, revenue }) => ({
        name, bookings, completionRate, revenue
      }));
    }

    // --- 7. Lấy 5 lịch đặt gần đây nhất ---
    const recentBookingsPipeline = [
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users", localField: "expertId", foreignField: "_id", as: "expert"
        }
      },
      { $unwind: { path: "$expert", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users", localField: "clientId", foreignField: "_id", as: "client"
        }
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1, date: 1, startTime: 1, endTime: 1, status: 1, price: 1,
          expertId: 1, clientId: 1, createdAt: 1,
          expertName: { $ifNull: ["$expert.name", "N/A"] },
          expertField: { $ifNull: ["$expert.field", "N/A"] },
          clientName: { $ifNull: ["$client.name", "N/A"] }
        }
      }
    ];
    
    // Thực thi tất cả các aggregation pipelines song song
    const [
      userStatsResult,
      bookingAggResult,
      rawBookingStatusData,
      fieldDataResult,
      topExpertsResult,
      monthlyDataResult,
      recentBookingsResult
    ] = await Promise.all([
      db.collection('users').aggregate(userStatsPipeline, { allowDiskUse: true }).toArray(),
      db.collection('bookings').aggregate(bookingAggPipeline, { allowDiskUse: true }).toArray(),
      db.collection('bookings').aggregate(bookingStatusDataPipeline, { allowDiskUse: true }).toArray(),
      db.collection('bookings').aggregate(fieldDataPipeline, { allowDiskUse: true }).toArray(),
      db.collection('bookings').aggregate(topExpertsPipeline, { allowDiskUse: true }).toArray(),
      getMonthlyDataOptimized(), // Gọi hàm đã được tối ưu
      db.collection('bookings').aggregate(recentBookingsPipeline, { allowDiskUse: true }).toArray()
    ]);

    // Xử lý kết quả
    const stats = {
      ...(userStatsResult[0] || { totalUsers: 0, totalClients: 0, totalExperts: 0, verifiedExperts: 0 }),
      ...(bookingAggResult[0] || { totalBookings: 0, confirmedBookings: 0, completedBookings: 0, canceledBookings: 0, totalRevenue: 0 })
    };
    
    const bookingStatusColors = {
      'confirmed': '#3b82f6',
      'completed': '#10b981',
      'canceled': '#ef4444',
      'pending': '#f59e0b' // Thêm màu cho pending nếu có
    };
    const bookingStatusData = rawBookingStatusData.map(item => ({
      ...item,
      color: bookingStatusColors[item.name] || '#cccccc' // Màu mặc định nếu không có status
    }));

    return {
      stats,
      bookingStatusData,
      fieldData: fieldDataResult,
      topExperts: topExpertsResult,
      monthlyData: monthlyDataResult,
      recentBookings: recentBookingsResult
    };

  } catch (error) {
    console.error('Error in getAnalytics service:', error);
    throw error;
  }
}

// Lấy tất cả người dùng với phân trang và filter
async function getAllUsers(cursor, limit, filters = {}) {
  try {
    const query = {};

    if (filters.role) {
      query.role = filters.role;
    }

    if (cursor) {
      query._id = { $gt: new ObjectId(cursor) };
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const usersFromDb = await adminModel.getUsersWithFiltersAndPagination(query, limit);

    // Loại bỏ mật khẩu khi trả về dữ liệu
    const users = usersFromDb.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    let nextCursor = null;
    if (users.length === limit) {
      nextCursor = users[users.length - 1]._id.toString();
    }

    return { users, nextCursor }; // Trả về kết quả đã phân trang
  } catch (error) {
    throw error;
  }
}

// Lấy tất cả chuyên gia
async function getAllExperts(cursorId = null, limit = 20, filters = {}) {
  try {
    // Truyền filters xuống model
    const expertsFromDb = await adminModel.getAllExperts(cursorId, limit, filters);
    
    // Loại bỏ mật khẩu khi trả về dữ liệu
    const experts = expertsFromDb.map(expert => {
      const { password, ...expertWithoutPassword } = expert;
      return expertWithoutPassword;
    });

    let nextCursor = null;
    // Chuyển limit thành số ở đây để so sánh, vì giá trị từ model đã là số
    if (experts.length === limit) { 
      nextCursor = experts[experts.length - 1]._id.toString();
    }

    return { experts, nextCursor };
  } catch (error) {
    throw error;
  }
}

// Lấy tất cả client với phân trang và filter
async function getAllClients(cursor, limit, filters = {}) {
  try {
    const query = { role: 'client' };

    if (cursor) {
      query._id = { $gt: new ObjectId(cursor) };
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const clientsFromDb = await adminModel.getUsersWithFiltersAndPagination(query, limit);

    // Loại bỏ mật khẩu khi trả về dữ liệu
    const clients = clientsFromDb.map(client => {
      const { password, ...clientWithoutPassword } = client;
      return clientWithoutPassword;
    });

    let nextCursor = null;
    if (clients.length === limit) {
      nextCursor = clients[clients.length - 1]._id.toString();
    }

    return { clients, nextCursor };
  } catch (error) {
    throw error;
  }
}

// Lấy tất cả bookings
async function getAllBookings(filter = null, limit = 10, cursor = null, searchQuery = "", dateFilter = "") {
  try {
    // Validate giới hạn
    limit = parseInt(limit) || 10;
    if (limit < 1 || limit > 50) {
      limit = 10; // Giá trị mặc định an toàn
    }
    
    // Sử dụng hàm mới với cursor-based pagination
    const result = await adminModel.getAdminBookingsWithDetails(filter, limit, cursor, searchQuery, dateFilter);
    
    return result;
  } catch (error) {
    console.error('Error in getAllBookings service:', error);
    throw error;
  }
}

// Cập nhật trạng thái xác minh chuyên gia
async function verifyExpert(expertId, status, comment, adminId) {
  try {
    const expert = await adminModel.getUserById(expertId);
    if (!expert) {
      throw new Error('Expert not found');
    }
    
    const result = await adminModel.updateExpertVerificationStatus(expertId, status, comment);
    
    // Thêm log xác minh
    await adminModel.addVerificationLog(expertId, status, comment, adminId);
    
    // Đồng bộ với Elasticsearch
    try {
      const elasticSearchService = (await import('../services/elasticSearchService.js')).default;
      
      // Nếu expert được xác minh, thêm vào Elasticsearch
      if (status === 'verified') {
        const updatedExpert = await adminModel.getUserById(expertId);
        await elasticSearchService.indexExpert(updatedExpert);
        console.log(`Đã thêm expert ${expertId} vào Elasticsearch`);
      } 
      // Nếu expert bị hủy xác minh, xóa khỏi Elasticsearch
      else if (status === 'unverified' || status === 'rejected') {
        await elasticSearchService.deleteExpert(expertId);
        console.log(`Đã xóa expert ${expertId} khỏi Elasticsearch`);
      }
    } catch (elasticError) {
      console.error('Lỗi khi đồng bộ với Elasticsearch:', elasticError);
      // Không throw lỗi để không ảnh hưởng đến luồng chính
    }
    
    return { success: true, message: `Expert verification status updated to ${status}` };
  } catch (error) {
    throw error;
  }
}

// Xóa người dùng
async function deleteUser(userId) {
  try {
    const user = await adminModel.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Kiểm tra nếu có booking liên quan đến user
    const userBookings = await adminModel.getUserBookings(userId, user.role);
    if (userBookings.length > 0) {
      throw new Error('Cannot delete user with existing bookings');
    }
    
    const result = await adminModel.deleteUserById(userId);
    
    // Nếu user là expert và đã được xác minh, xóa khỏi Elasticsearch
    if (user.role === 'expert' && user.verified === 'verified') {
      try {
        const elasticSearchService = (await import('../services/elasticSearchService.js')).default;
        await elasticSearchService.deleteExpert(userId);
        console.log(`Đã xóa expert ${userId} khỏi Elasticsearch`);
      } catch (elasticError) {
        console.error('Lỗi khi xóa expert khỏi Elasticsearch:', elasticError);
        // Không throw lỗi để không ảnh hưởng đến luồng chính
      }
    }
    
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    throw error;
  }
}

// Cập nhật trạng thái booking
async function updateBookingStatus(bookingId, status) {
  try {
    const result = await adminModel.updateBookingStatus(bookingId, status);
    
    if (result.modifiedCount === 0) {
      throw new Error('Booking not found or status not changed');
    }
    
    return { success: true, message: `Booking status updated to ${status}` };
  } catch (error) {
    throw error;
  }
}

// Cập nhật thông tin chuyên gia
async function updateExpert(expertId, expertData) {
  try {
    const expert = await adminModel.getUserById(expertId);
    
    if (!expert) {
      throw new Error('Expert not found');
    }
    
    if (expert.role !== 'expert') {
      throw new Error('User is not an expert');
    }
    
    // Kiểm tra email trùng lặp nếu email được cập nhật
    if (expertData.email && expertData.email !== expert.email) {
      const existingUserWithEmail = await adminModel.checkEmailExists(expertData.email, expertId);
      if (existingUserWithEmail) {
        throw new Error('Email already exists');
      }
    }
    
    const result = await adminModel.updateExpert(expertId, expertData);
    
    if (result.modifiedCount === 0) {
      throw new Error('Expert information not updated');
    }
    
    // Đồng bộ dữ liệu với Elasticsearch nếu expert đã được xác minh
    const updatedExpert = await adminModel.getUserById(expertId);
    if (updatedExpert && updatedExpert.verified === 'verified') {
      try {
        const elasticSearchService = (await import('../services/elasticSearchService.js')).default;
        await elasticSearchService.indexExpert(updatedExpert);
        console.log(`Đã đồng bộ expert ${expertId} vào Elasticsearch`);
      } catch (elasticError) {
        console.error('Lỗi khi đồng bộ expert vào Elasticsearch:', elasticError);
        // Không throw lỗi để không ảnh hưởng đến luồng chính
      }
    }
    
    return { success: true, message: 'Expert information updated successfully' };
  } catch (error) {
    throw error;
  }
}

// Yêu cầu xác minh lại
async function requestReverification(expertId, reason, adminId) {
  try {
    const expert = await adminModel.getUserById(expertId);
    
    if (!expert) {
      throw new Error('Expert not found');
    }
    
    if (expert.role !== 'expert') {
      throw new Error('User is not an expert');
    }
    
    const result = await adminModel.requestReverification(expertId, reason);
    
    // Thêm log xác minh
    await adminModel.addVerificationLog(expertId, 'unverified', reason, adminId, true);
    
    if (result.modifiedCount === 0) {
      throw new Error('Reverification request not updated');
    }
    
    // Xóa chuyên gia khỏi Elasticsearch khi yêu cầu xác minh lại
    try {
      const elasticSearchService = (await import('../services/elasticSearchService.js')).default;
      await elasticSearchService.deleteExpert(expertId);
      console.log(`Đã xóa expert ${expertId} khỏi Elasticsearch do yêu cầu xác minh lại`);
    } catch (elasticError) {
      console.error('Lỗi khi xóa expert khỏi Elasticsearch:', elasticError);
      // Không throw lỗi để không ảnh hưởng đến luồng chính
    }
    
    return { success: true, message: 'Reverification request sent successfully' };
  } catch (error) {
    throw error;
  }
}

export default {
  getAnalytics,
  getAllUsers,
  getAllExperts,
  getAllClients,
  getAllBookings,
  verifyExpert,
  deleteUser,
  updateBookingStatus,
  updateExpert,
  requestReverification
}; 
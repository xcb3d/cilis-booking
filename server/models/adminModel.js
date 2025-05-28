import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

// Lấy tất cả người dùng
async function getAllUsers() {
  const db = getDB();
  return db.collection('users').find({}).toArray();
}

// Lấy tất cả chuyên gia
async function getAllExperts(cursorId = null, limit = 20, filters = {}) {
  const db = getDB();
  const query = { role: 'expert' };

  if (cursorId) {
    query._id = { $gt: new ObjectId(cursorId) };
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { expertise: searchRegex },
      { field: searchRegex }
    ];
  }

  if (filters.field) {
    query.field = filters.field;
  }

  if (filters.verified && filters.verified !== 'all') {
    query.verified = filters.verified;
  }

  const sortOptions = { _id: 1 };

  console.log('[AdminModel] getAllExperts - final query:', JSON.stringify(query));
  console.log('[AdminModel] getAllExperts - limit:', limit);

  return db.collection('users')
    .find(query)
    .sort(sortOptions)
    .limit(limit)
    .toArray();
}

// Lấy tất cả bookings
async function getAllBookings() {
  const db = getDB();
  return db.collection('bookings').find({}).toArray();
}

// Lấy danh sách booking với phân trang và lọc
async function getAdminBookingsWithDetails(filter = null, limit = 10, cursor = null, searchQuery = "", dateFilter = "") {
  const db = getDB();
  const startTime = process.hrtime();
  
  try {
    // Xây dựng stage $match cơ bản
    let matchStage = {};
    
    // Thêm điều kiện lọc theo cursor (ID của booking trước đó)
    if (cursor) {
      matchStage._id = { $lt: new ObjectId(cursor) };
    }
    
    // Thêm điều kiện lọc dựa vào filter status
    if (filter && filter !== 'all') {
      matchStage.status = filter;
    }
    
    // Thêm điều kiện lọc theo ngày
    if (dateFilter) {
      matchStage.date = dateFilter;
    }
    
    // Thêm điều kiện lọc theo từ khóa tìm kiếm (nếu có)
    if (searchQuery && searchQuery.trim() !== '') {
      matchStage.description = { $regex: searchQuery, $options: 'i' };
    }
    
    // Xác định index hint để tối ưu truy vấn
    // Ưu tiên theo thứ tự: _id, status, date
    let indexHint = { _id: 1 };
    if (filter && filter !== 'all') {
      indexHint = { status: 1, _id: 1 };
    } else if (dateFilter) {
      indexHint = { date: 1, _id: 1 };
    }
    
    // Đếm tổng số booking thỏa mãn điều kiện (chỉ thực hiện khi không có cursor)
    let totalCount = null;
    if (!cursor) {
      const countStartTime = process.hrtime();
      // Sử dụng estimatedDocumentCount nếu không có điều kiện lọc để tăng tốc
      totalCount = Object.keys(matchStage).length === 0 
        ? await db.collection('bookings').estimatedDocumentCount()
        : await db.collection('bookings').countDocuments(matchStage, { hint: indexHint });
      const countEndTime = process.hrtime(countStartTime);
      const countDuration = countEndTime[0] * 1000 + countEndTime[1] / 1000000;
      console.log(`[Query Metrics] Count operation completed in ${countDuration.toFixed(2)}ms, total: ${totalCount}`);
    }
    
    // Chỉ lấy các trường cần thiết từ bookings để giảm kích thước dữ liệu
    const projection = {
      _id: 1,
      expertId: 1,
      clientId: 1,
      date: 1,
      startTime: 1,
      endTime: 1,
      status: 1,
      price: 1,
      paymentStatus: 1,
      description: 1,
      createdAt: 1,
      updatedAt: 1
    };
    
    const pipelineStart = process.hrtime();
    
    // Lấy danh sách bookings (không có join)
    const bookings = await db.collection('bookings')
      .find(matchStage, { projection })
      .hint(indexHint)
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();
    
    const pipelineEnd = process.hrtime(pipelineStart);
    const pipelineDuration = pipelineEnd[0] * 1000 + pipelineEnd[1] / 1000000;
    
    // Xác định nextCursor
    const nextCursor = bookings.length === limit ? 
      bookings[bookings.length - 1]._id.toString() : null;
    
    // Cache cho kết quả trả về sẵn nếu không có expert/client nào
    if (bookings.length === 0) {
      return {
        bookings: [],
        pagination: {
          total: totalCount || 0,
          hasMore: false,
          nextCursor: null,
          limit
        }
      };
    }
    
    // Tối ưu: Thu thập IDs và chuyển đổi cùng lúc để giảm vòng lặp
    const expertIds = new Set();
    const clientIds = new Set();
    
    for (const booking of bookings) {
      if (booking.expertId) expertIds.add(booking.expertId.toString());
      if (booking.clientId) clientIds.add(booking.clientId.toString());
    }
    
    // Chuyển từ Set sang Array và map thành ObjectId
    const expertObjectIds = Array.from(expertIds).map(id => new ObjectId(id));
    const clientObjectIds = Array.from(clientIds).map(id => new ObjectId(id));
    
    // Thực hiện hai truy vấn song song với giới hạn trường dữ liệu
    const usersStart = process.hrtime();
    
    // Sử dụng Promise.allSettled để đảm bảo không fail nếu một trong các truy vấn lỗi
    const [expertsResult, clientsResult] = await Promise.allSettled([
      expertObjectIds.length > 0 ? db.collection('users').find(
        { _id: { $in: expertObjectIds } },
        { 
          projection: { name: 1, field: 1 }, // Chỉ lấy các trường thiết yếu nhất
          hint: { _id: 1 } // Sử dụng index trên _id
        }
      ).toArray() : [],
      
      clientObjectIds.length > 0 ? db.collection('users').find(
        { _id: { $in: clientObjectIds } },
        { 
          projection: { name: 1 }, // Chỉ lấy trường name
          hint: { _id: 1 } // Sử dụng index trên _id
        }
      ).toArray() : []
    ]);
    
    const usersEnd = process.hrtime(usersStart);
    const usersDuration = usersEnd[0] * 1000 + usersEnd[1] / 1000000;
    
    // Lấy kết quả từ Promise.allSettled
    const experts = expertsResult.status === 'fulfilled' ? expertsResult.value : [];
    const clients = clientsResult.status === 'fulfilled' ? clientsResult.value : [];
    
    // Tạo map để tìm kiếm nhanh
    const expertsMap = new Map();
    for (const expert of experts) {
      expertsMap.set(expert._id.toString(), expert);
    }
    
    const clientsMap = new Map();
    for (const client of clients) {
      clientsMap.set(client._id.toString(), client);
    }
    
    // Ghép thông tin vào mỗi booking
    const bookingsWithDetails = bookings.map(booking => {
      const expertId = booking.expertId ? booking.expertId.toString() : null;
      const clientId = booking.clientId ? booking.clientId.toString() : null;
      
      const expertInfo = expertId ? expertsMap.get(expertId) : null;
      const clientInfo = clientId ? clientsMap.get(clientId) : null;
      
      return {
        ...booking,
        expert: expertId ? {
          _id: booking.expertId,
          name: expertInfo?.name || 'Unknown',
          field: expertInfo?.field || null
        } : null,
        client: clientId ? {
          _id: booking.clientId,
          name: clientInfo?.name || 'Unknown'
        } : null
      };
    });
    
    // Nếu có searchQuery để tìm theo tên, lọc thêm trong memory
    let filteredBookings = bookingsWithDetails;
    if (searchQuery && searchQuery.trim() !== '') {
      const searchLower = searchQuery.toLowerCase();
      filteredBookings = bookingsWithDetails.filter(booking => {
        return (booking.expert?.name?.toLowerCase().includes(searchLower) ||
                booking.client?.name?.toLowerCase().includes(searchLower) ||
                (booking.description && booking.description.toLowerCase().includes(searchLower)));
      });
    }
    
    const endTime = process.hrtime(startTime);
    const totalDuration = endTime[0] * 1000 + endTime[1] / 1000000;
    
    console.log(`[Query Performance] getAdminBookingsWithDetails:
      - Filter: ${filter || 'none'}
      - Search: ${searchQuery || 'none'}
      - Date: ${dateFilter || 'none'}
      - Bookings time: ${pipelineDuration.toFixed(2)}ms
      - Users time: ${usersDuration.toFixed(2)}ms
      - Total time: ${totalDuration.toFixed(2)}ms
      - Results: ${bookings.length} bookings
      - Next cursor: ${nextCursor || 'none'}`);
    
    // Trả về kết quả với thông tin cursor
    return {
      bookings: filteredBookings,
      pagination: {
        total: totalCount,
        hasMore: bookings.length === limit,
        nextCursor: nextCursor,
        limit
      }
    };
  } catch (error) {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[Query Error] getAdminBookingsWithDetails failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

// Lấy booking theo khoảng thời gian
async function getBookingsByDateRange(startDate, endDate) {
  const db = getDB();
  return db.collection('bookings').find({
    date: { $gte: startDate, $lte: endDate }
  }).toArray();
}

// Lấy người dùng theo ID
async function getUserById(userId) {
  const db = getDB();
  return db.collection('users').findOne({ _id: new ObjectId(userId) });
}

// Kiểm tra email tồn tại (loại trừ ID người dùng hiện tại)
async function checkEmailExists(email, excludeUserId = null) {
  const db = getDB();
  
  const query = { email };
  if (excludeUserId) {
    query._id = { $ne: new ObjectId(excludeUserId) };
  }
  
  return db.collection('users').findOne(query);
}

// Cập nhật trạng thái xác minh của chuyên gia
async function updateExpertVerificationStatus(expertId, status, comment) {
  const db = getDB();
  return db.collection('users').updateOne(
    { _id: new ObjectId(expertId), role: 'expert' },
    {
      $set: {
        verified: status,
        verificationComment: comment || null,
        verificationDate: new Date()
      }
    }
  );
}

// Thêm log xác minh
async function addVerificationLog(expertId, status, comment, adminId, isReverificationRequest = false) {
  const db = getDB();
  return db.collection('verificationLogs').insertOne({
    expertId: new ObjectId(expertId),
    status,
    comment: comment || null,
    adminId: new ObjectId(adminId),
    createdAt: new Date(),
    isReverificationRequest
  });
}

// Cập nhật trạng thái booking
async function updateBookingStatus(bookingId, status) {
  const db = getDB();
  return db.collection('bookings').updateOne(
    { _id: new ObjectId(bookingId) },
    { $set: { status, updatedAt: new Date() } }
  );
}

// Xóa người dùng
async function deleteUserById(userId) {
  const db = getDB();
  return db.collection('users').deleteOne({ _id: new ObjectId(userId) });
}

// Kiểm tra booking của người dùng
async function getUserBookings(userId, role) {
  const db = getDB();
  
  const query = {};
  if (role === 'expert') {
    query.expertId = new ObjectId(userId);
  } else if (role === 'client') {
    query.clientId = new ObjectId(userId);
  }
  
  return db.collection('bookings').find(query).toArray();
}

// Cập nhật thông tin chuyên gia
async function updateExpert(expertId, expertData) {
  const db = getDB();
  return db.collection('users').updateOne(
    { _id: new ObjectId(expertId), role: 'expert' },
    {
      $set: {
        ...expertData,
        updatedAt: new Date()
      }
    }
  );
}

// Yêu cầu xác minh lại
async function requestReverification(expertId, reason) {
  const db = getDB();
  return db.collection('users').updateOne(
    { _id: new ObjectId(expertId) },
    {
      $set: {
        verified: 'unverified',
        verificationComment: reason,
        reverificationRequested: true,
        reverificationRequestDate: new Date()
      }
    }
  );
}

// Lấy người dùng theo bộ lọc và phân trang (chung)
async function getUsersWithFiltersAndPagination(query, limit) {
  const db = getDB();
  // Sắp xếp theo _id để đảm bảo thứ tự cho cursor pagination
  const sortOptions = { _id: 1 }; 
  return db.collection('users')
    .find(query)
    .sort(sortOptions)
    .limit(limit)
    .toArray();
}

export default {
  getAllUsers,
  getAllExperts,
  getUsersWithFiltersAndPagination,
  getAllBookings,
  getAdminBookingsWithDetails,
  getBookingsByDateRange,
  getUserById,
  checkEmailExists,
  updateExpertVerificationStatus,
  addVerificationLog,
  updateBookingStatus,
  deleteUserById,
  getUserBookings,
  updateExpert,
  requestReverification
}; 
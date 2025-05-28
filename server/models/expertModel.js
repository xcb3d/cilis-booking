import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { BOOKING_STATUS } from '../utils/constants.js';

const verificationCollection = 'verifications';
const reviewsCollection = 'reviews';
const bookingsCollection = 'bookings';
const usersCollection = 'users';
const schedulePatternCollection = 'schedulePatterns';
const scheduleOverrideCollection = 'scheduleOverrides';

// Schedule Pattern API

// Lấy tất cả mẫu lịch làm việc của chuyên gia
async function getAllSchedulePatterns(expertId) {
  const db = getDB();
  return db.collection(schedulePatternCollection).find({
    expertId: new ObjectId(expertId),
    isActive: true
  }).toArray();
}

// Lấy một mẫu lịch làm việc theo ID
async function getSchedulePatternById(patternId) {
  const db = getDB();
  return db.collection(schedulePatternCollection).findOne({
    _id: new ObjectId(patternId)
  });
}

// Lấy tất cả các mẫu lịch làm việc cho một ngày trong tuần
async function getSchedulePatternsByDayOfWeek(expertId, dayOfWeek) {
  const db = getDB();
  const startTime = process.hrtime();
  
  try {
    const patterns = await db.collection(schedulePatternCollection).find({
      expertId: new ObjectId(expertId),
      daysOfWeek: dayOfWeek,
      isActive: true
    }).toArray();
    
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.log(`[DB Query Metrics] getSchedulePatternsByDayOfWeek completed in ${duration.toFixed(2)}ms, returned ${patterns.length} patterns for day ${dayOfWeek}`);
    
    return patterns;
  } catch (error) {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[DB Error Metrics] getSchedulePatternsByDayOfWeek failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

// Tạo mẫu lịch làm việc mới
async function createSchedulePattern(patternData) {
  const db = getDB();
  
  const pattern = {
    ...patternData,
    expertId: new ObjectId(patternData.expertId),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return db.collection(schedulePatternCollection).insertOne(pattern);
}

// Cập nhật mẫu lịch làm việc
async function updateSchedulePattern(patternId, patternData) {
  const db = getDB();
  
  const updateData = {
    ...patternData,
    updatedAt: new Date()
  };
  
  return db.collection(schedulePatternCollection).updateOne(
    { _id: new ObjectId(patternId) },
    { $set: updateData }
  );
}

// Xóa mẫu lịch làm việc
async function deleteSchedulePattern(patternId) {
  const db = getDB();
  return db.collection(schedulePatternCollection).deleteOne({
    _id: new ObjectId(patternId)
  });
}

// Schedule Override API

// Lấy tất cả lịch ngoại lệ của chuyên gia
async function getAllScheduleOverrides(expertId) {
  const db = getDB();
  return db.collection(scheduleOverrideCollection).find({
    expertId: new ObjectId(expertId)
  }).toArray();
}

// Lấy override cho một ngày cụ thể
async function getScheduleOverrideByDate(expertId, date) {
  const db = getDB();
  const startTime = process.hrtime();
  
  try {
    const override = await db.collection(scheduleOverrideCollection).findOne({
      expertId: new ObjectId(expertId),
      date: date
    });
    
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.log(`[DB Query Metrics] getScheduleOverrideByDate completed in ${duration.toFixed(2)}ms, ${override ? 'found' : 'no'} override for date ${date}`);
    
    return override;
  } catch (error) {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[DB Error Metrics] getScheduleOverrideByDate failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

// Tạo lịch ngoại lệ mới
async function createScheduleOverride(overrideData) {
  const db = getDB();
  
  const override = {
    ...overrideData,
    expertId: new ObjectId(overrideData.expertId),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return db.collection(scheduleOverrideCollection).insertOne(override);
}

// Cập nhật lịch ngoại lệ
async function updateScheduleOverride(overrideId, overrideData) {
  const db = getDB();
  
  const updateData = {
    ...overrideData,
    updatedAt: new Date()
  };
  
  return db.collection(scheduleOverrideCollection).updateOne(
    { _id: new ObjectId(overrideId) },
    { $set: updateData }
  );
}

// Lấy tất cả schedule overrides trong khoảng thời gian
async function getScheduleOverridesByDateRange(expertId, startDate, endDate) {
  const db = getDB();
  return db.collection(scheduleOverrideCollection).find({
    expertId: new ObjectId(expertId),
    date: { $gte: startDate, $lte: endDate }
  }).toArray();
}

// Xóa lịch ngoại lệ
async function deleteScheduleOverride(overrideId) {
  const db = getDB();
  return db.collection(scheduleOverrideCollection).deleteOne({
    _id: new ObjectId(overrideId)
  });
}

// Lấy khung giờ làm việc cho một ngày dựa trên schedule pattern
async function getSchedulePatternTimeSlotsByDate(expertId, date) {
  const db = getDB();
  const dayOfWeek = new Date(date).getDay() || 7; // Convert 0 (Sunday) to 7 to match our format
  const today = new Date().toISOString().split('T')[0];
  
  const patterns = await db.collection(schedulePatternCollection).find({
    expertId: new ObjectId(expertId),
    daysOfWeek: dayOfWeek,
    isActive: true,
    validFrom: { $lte: date },
    validTo: { $gte: date }
  }).toArray();
  
  if (patterns.length === 0) {
    return [];
  }
  
  // Combine all time slots from matching patterns
  let timeSlots = [];
  patterns.forEach(pattern => {
    timeSlots = [...timeSlots, ...pattern.timeSlots];
  });
  
  // Sort by start time
  timeSlots.sort((a, b) => a.start.localeCompare(b.start));
  
  return timeSlots;
}

// Lấy trạng thái xác minh của chuyên gia
async function getVerificationStatus(expertId) {
  const db = getDB();
  return db.collection(verificationCollection).findOne({
    expertId: new ObjectId(expertId)
  });
}

// Cập nhật thông tin hồ sơ chuyên gia
async function updateProfile(expertId, profileData) {
  const db = getDB();
  return db.collection(usersCollection).updateOne(
    { _id: new ObjectId(expertId), role: 'expert' },
    { $set: { ...profileData, updatedAt: new Date() } }
  );
}

// Lưu document xác minh
async function saveVerificationDocuments(expertId, documents) {
  const db = getDB();
  // Check if verification record exists
  const existingVerification = await db.collection(verificationCollection).findOne({
    expertId: new ObjectId(expertId)
  });

  if (existingVerification) {
    // Update existing record
    return db.collection(verificationCollection).updateOne(
      { expertId: new ObjectId(expertId) },
      { 
        $set: { 
          documents: { ...existingVerification.documents, ...documents },
          status: 'pending',
          updatedAt: new Date()
        } 
      }
    );
  } else {
    // Create new record
    return db.collection(verificationCollection).insertOne({
      expertId: new ObjectId(expertId),
      documents,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

// Lấy danh sách đánh giá của chuyên gia
async function getReviews(expertId, page = 1, limit = 10) {
  const db = getDB();
  const skip = (page - 1) * limit;
  
  // Đếm tổng số reviews
  const totalCount = await db.collection(reviewsCollection).countDocuments({
    expertId: new ObjectId(expertId)
  });
  
  // Lấy reviews với pagination
  const reviews = await db.collection(reviewsCollection)
    .find({
      expertId: new ObjectId(expertId)
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  
  // Bổ sung thông tin client cho mỗi review
  const enhancedReviews = await Promise.all(
    reviews.map(async (review) => {
      // Nếu có clientId, lấy thông tin client
      if (review.clientId) {
        const client = await db.collection('users').findOne(
          { _id: review.clientId },
          { projection: { name: 1, avatar: 1, email: 1 } }
        );
        
        if (client) {
          review.clientName = client.name;
          review.clientAvatar = client.avatar;
          review.clientEmail = client.email;
        }
      }
      
      return review;
    })
  );
  
  // Trả về kết quả với thông tin pagination
  return {
    reviews: enhancedReviews,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}

// Lấy danh sách booking của chuyên gia
async function getBookings(expertId, status = null) {
  const db = getDB();
  
  const query = { expertId: new ObjectId(expertId) };
  if (status) {
    query.status = status;
  }
  
  return db.collection(bookingsCollection).find(query).toArray();
}

// Lấy danh sách booking của chuyên gia với điều kiện lọc trực tiếp từ database
async function getFilteredExpertBookings(expertId, filter = null) {
  const db = getDB();
  
  // Xây dựng query cơ bản
  let query = { expertId: new ObjectId(expertId) };
  
  // Thêm điều kiện lọc dựa vào filter
  if (filter) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    switch (filter) {
      case 'upcoming':
        // Lọc booking sắp tới
        query.$or = [
          // Booking trong tương lai
          { 
            date: { $gt: today }, 
            status: BOOKING_STATUS.CONFIRMED 
          },
          // Booking hôm nay nhưng chưa kết thúc
          { 
            date: today, 
            endTime: { $gt: currentTime },
            status: BOOKING_STATUS.CONFIRMED 
          }
        ];
        break;
      case 'completed':
        // Lọc booking đã hoàn thành
        query.status = BOOKING_STATUS.COMPLETED;
        break;
      case 'canceled':
        // Lọc booking đã hủy và đã thanh toán
        query.status = BOOKING_STATUS.CANCELED;
        query.paymentStatus = 'completed';
        break;
    }
  }
  
  return db.collection(bookingsCollection).find(query).sort({ date: -1 }).toArray();
}

// Lấy booking với thông tin chi tiết của client sử dụng aggregation
async function getExpertBookingsWithDetails(expertId, filter = null, limit = 10, cursor = null) {
  const db = getDB();
  const startTime = process.hrtime();
  const aggregationOptions = { allowDiskUse: true }; // Cho phép sử dụng disk cho các tập dữ liệu lớn
  
  try {
  // Xây dựng stage $match cơ bản
  let matchStage = { expertId: new ObjectId(expertId) };
    
    // Thêm điều kiện lọc theo cursor (ID của booking trước đó)
    if (cursor) {
      matchStage._id = { $lt: new ObjectId(cursor) };
    }
  
  // Thêm điều kiện lọc dựa vào filter
  if (filter) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    switch (filter) {
      case 'upcoming':
          // Lọc booking sắp tới (kết hợp các điều kiện sử dụng index đã tạo)
          matchStage.status = { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] };
        matchStage.$or = [
            { date: { $gt: today } },
            { date: today, endTime: { $gt: currentTime } }
        ];
        break;
      case 'completed':
        // Lọc booking đã hoàn thành
        matchStage.status = BOOKING_STATUS.COMPLETED;
        break;
      case 'canceled':
        // Lọc booking đã hủy và đã thanh toán
        matchStage.status = BOOKING_STATUS.CANCELED;
        matchStage.paymentStatus = 'completed';
        break;
    }
  }
  
    // Hint sử dụng index đã tạo
    const hint = { expertId: 1, date: 1, status: 1 };
    
    // Đếm tổng số booking thỏa mãn điều kiện (nếu cần thống kê tổng số)
    // Chỉ thực hiện khi không có cursor (trang đầu tiên) để tối ưu hiệu suất
    let totalCount = null;
    if (!cursor) {
      const countStartTime = process.hrtime();
      totalCount = await db.collection(bookingsCollection).countDocuments(matchStage, { hint });
      const countEndTime = process.hrtime(countStartTime);
      const countDuration = countEndTime[0] * 1000 + countEndTime[1] / 1000000;
      console.log(`[Query Metrics] Count operation completed in ${countDuration.toFixed(2)}ms, total: ${totalCount}`);
    }
    
    // Xây dựng pipeline tối ưu
    const pipeline = [
    // Stage 1: Lọc booking theo điều kiện
    { $match: matchStage },
    
      // Stage 2: Sắp xếp theo ID giảm dần - cần đặt trước $limit để tận dụng index
      { $sort: { _id: -1 } },
      
      // Stage 3: Giới hạn số lượng kết quả trước khi join
      { $limit: limit },
      
      // Stage 4: Projection ban đầu để giảm kích thước dữ liệu trước khi lookup
      { $project: {
          _id: 1,
          date: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          price: 1,
          paymentStatus: 1,
          description: 1,
          location: 1,
          expertId: 1,
          clientId: 1
      }},
      
      // Stage 5: Join với collection users để lấy thông tin client
    { $lookup: {
        from: 'users',
          let: { clientId: '$clientId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$clientId'] } } },
            { $project: { 
                name: 1, 
                avatar: 1, 
                email: 1, 
                phone: 1 
            }}
          ],
        as: 'clientDetails'
    }},
    
      // Stage 6: Unwrap client details array
    { $unwind: {
        path: '$clientDetails',
        preserveNullAndEmptyArrays: true
    }},
    
      // Stage 7: Final projection
    { $project: {
          _id: 1,
          date: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          price: 1,
          paymentStatus: 1,
          description: 1,
          location: 1,
          expertId: 1,
          clientId: 1,
          clientName: '$clientDetails.name',
          clientAvatar: '$clientDetails.avatar',
          clientEmail: '$clientDetails.email',
          clientPhone: '$clientDetails.phone'
      }}
    ];
    
    // Thêm hint vào option
    const options = { 
      ...aggregationOptions,
      hint
    };
    
    const pipelineStart = process.hrtime();
    const bookings = await db.collection(bookingsCollection).aggregate(pipeline, options).toArray();
    const pipelineEnd = process.hrtime(pipelineStart);
    const pipelineDuration = pipelineEnd[0] * 1000 + pipelineEnd[1] / 1000000;
    
    // Xác định nextCursor (nếu có)
    const nextCursor = bookings.length === limit ? 
      bookings[bookings.length - 1]._id.toString() : null;
    
    const endTime = process.hrtime(startTime);
    const totalDuration = endTime[0] * 1000 + endTime[1] / 1000000;
    
    console.log(`[Query Performance] getExpertBookingsWithDetails:
      - Filter: ${filter || 'none'}
      - Total time: ${totalDuration.toFixed(2)}ms
      - Pipeline time: ${pipelineDuration.toFixed(2)}ms
      - Results: ${bookings.length} bookings
      - Next cursor: ${nextCursor || 'none'}`);
    
    // Trả về kết quả với thông tin cursor
  return {
    bookings,
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
    console.error(`[Query Error] getExpertBookingsWithDetails failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

async function getBookingsByDateRange(expertId, startDate, endDate) {
  const db = getDB();
  const startTime = process.hrtime();
  
  try {
    console.log(`ExpertModel - Getting bookings from ${startDate} to ${endDate} for expertId: ${expertId}`);
    
    // Sử dụng aggregation pipeline để tối ưu hóa truy vấn
    const pipeline = [
      // Stage 1: Match - sử dụng index
      {
        $match: {
          expertId: new ObjectId(expertId),
          date: { $gte: startDate, $lte: endDate },
          status: { $ne: BOOKING_STATUS.CANCELED }
        }
      },
      
      // Stage 2: Group theo ngày để tối ưu dữ liệu trả về
      {
        $group: {
          _id: "$date",
          bookings: {
            $push: {
              startTime: "$startTime",
              endTime: "$endTime",
              status: "$status"
            }
          }
        }
      },
      
      // Stage 3: Format lại kết quả để trả về
      {
        $project: {
          _id: 0,
          date: "$_id",
          bookings: 1
        }
      },
      
      // Stage 4: Sắp xếp theo ngày
      {
        $sort: { date: 1 }
      }
    ];
    
    // Hint chỉ áp dụng được cho stage $match đầu tiên
    const options = {
      hint: { expertId: 1, date: 1, status: 1 }
    };
    
    const result = await db.collection(bookingsCollection).aggregate(pipeline, options).toArray();
    
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.log(`[DB Query Metrics] getBookingsByDateRange completed in ${duration.toFixed(2)}ms, returned ${result.length} date groups`);
    
    return result;
  } catch (error) {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[DB Error Metrics] getBookingsByDateRange failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

// Lấy thống kê số lượng booking của expert trực tiếp từ database
async function getExpertBookingStats(expertId) {
  const db = getDB();
  const startTime = process.hrtime();

  try {
    // Đầu tiên kiểm tra xem có dữ liệu trong expert_booking_stats không
    const cachedStats = await db.collection('expert_booking_stats').findOne({ expertId: new ObjectId(expertId) });
    
    // Nếu có dữ liệu đã tính toán sẵn, trả về ngay
    if (cachedStats) {
      const endTime = process.hrtime(startTime);
      const duration = endTime[0] * 1000 + endTime[1] / 1000000;
      console.log(`[Query Performance] getExpertBookingStats from cache completed in ${duration.toFixed(2)}ms`);
      
      return {
        upcoming: cachedStats.upcoming || 0,
        completed: cachedStats.completed || 0,
        canceled: cachedStats.canceled || 0,
        total: cachedStats.total || 0
      };
    }
    
    // Nếu không có dữ liệu, tính toán như trước đây
    console.log(`No cached stats found for expert ${expertId}, calculating...`);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Đếm số booking sắp tới
    const upcomingCount = await db.collection('bookings').countDocuments({
      expertId: new ObjectId(expertId),
      $or: [
        // Booking trong tương lai
        { 
          date: { $gt: today }, 
          status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] } 
        },
        // Booking hôm nay nhưng chưa bắt đầu
        { 
          date: today, 
          startTime: { $gt: currentTime },
          status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] } 
        }
      ]
    });

    // Đếm số booking đã hoàn thành
    const completedCount = await db.collection('bookings').countDocuments({
      expertId: new ObjectId(expertId),
      status: BOOKING_STATUS.COMPLETED
    });

    // Đếm số booking đã hủy và đã thanh toán
    const canceledCount = await db.collection('bookings').countDocuments({
      expertId: new ObjectId(expertId),
      status: BOOKING_STATUS.CANCELED,
      paymentStatus: 'completed'
    });

    // Đếm tổng số booking
    const totalCount = await db.collection('bookings').countDocuments({
      expertId: new ObjectId(expertId)
    });

    const result = {
      upcoming: upcomingCount,
      completed: completedCount,
      canceled: canceledCount,
      total: totalCount
    };
    
    // Lưu vào collection expert_booking_stats
    await db.collection('expert_booking_stats').updateOne(
      { expertId: new ObjectId(expertId) },
      { 
        $set: {
          ...result,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.log(`[Query Performance] getExpertBookingStats calculated in ${duration.toFixed(2)}ms:
      - Upcoming: ${upcomingCount}
      - Completed: ${completedCount}
      - Canceled: ${canceledCount}
      - Total: ${totalCount}`);
    
    return result;
  } catch (error) {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[Query Error] getExpertBookingStats failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

// Lấy tổng quan dashboard
async function getDashboardStats(expertId) {
  const db = getDB();
  const startTime = process.hrtime();
  
  try {
    console.log(`ExpertModel - Getting dashboard stats for expertId: ${expertId}`);
    
    // Sử dụng aggregation pipeline để tính toán các chỉ số trong một lần truy vấn
    const bookingStats = await db.collection(bookingsCollection).aggregate([
      // Stage 1: Match - Lọc theo expertId
      {
        $match: { expertId: new ObjectId(expertId) }
      },
      // Stage 2: Facet - Thực hiện nhiều aggregation song song
      {
        $facet: {
          // Tính tổng earnings cho những booking đã hoàn thành
          "earningsStats": [
            {
              $match: { status: BOOKING_STATUS.COMPLETED }
            },
            {
              $group: {
                _id: null,
                totalEarnings: { $sum: { $ifNull: ["$price", 0] } },
                count: { $sum: 1 }
              }
            }
          ],
          // Đếm các booking theo trạng thái
          "bookingCounts": [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ],
          // Lấy 5 booking gần đây nhất
          "recentBookings": [
            { $sort: { _id: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                date: 1,
                startTime: 1,
                endTime: 1,
                status: 1,
                clientId: 1,
                price: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ], { allowDiskUse: true }).toArray();
    
    // Lấy đánh giá gần đây
    const recentReviews = await db.collection(reviewsCollection)
      .find({ expertId: new ObjectId(expertId) })
      .sort({ _id: -1 })
      .limit(5)
      .toArray();
    
    // Đếm tổng số đánh giá
    const reviewCount = await db.collection(reviewsCollection)
      .countDocuments({ expertId: new ObjectId(expertId) });
    
    // Xử lý kết quả từ aggregation
    const stats = bookingStats[0] || { earningsStats: [], bookingCounts: [], recentBookings: [] };
    
    // Lấy tổng earnings và số lượng booking hoàn thành
    const earningsData = stats.earningsStats[0] || { totalEarnings: 0, count: 0 };
    
    // Chuyển đổi bookingCounts thành object
    const statusCounts = {};
    (stats.bookingCounts || []).forEach(item => {
      statusCounts[item._id] = item.count;
    });
    
    const result = {
      totalBookings: (statusCounts.pending || 0) + (statusCounts.confirmed || 0) + 
                    (statusCounts.completed || 0) + (statusCounts.canceled || 0),
      completedBookings: statusCounts.completed || 0,
      upcomingBookings: statusCounts.confirmed || 0,
      totalEarnings: earningsData.totalEarnings,
      reviewCount: reviewCount,
      recentBookings: stats.recentBookings || [],
      recentReviews: recentReviews || []
    };
    
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.log(`[Query Performance] getDashboardStats completed in ${duration.toFixed(2)}ms:
      - Total bookings: ${result.totalBookings}
      - Completed bookings: ${result.completedBookings}
      - Upcoming bookings: ${result.upcomingBookings}
      - Total earnings: ${result.totalEarnings}
      - Review count: ${result.reviewCount}`);
    
    return result;
  } catch (error) {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[Query Error] getDashboardStats failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

// Lấy patterns cho nhiều ngày trong tuần cùng một lúc
async function getSchedulePatternsByDaysOfWeek(expertId, daysOfWeek, startDate, endDate) {
  const db = getDB();
  const startTime = process.hrtime();
  
  try {
    console.log(`ExpertModel - Getting patterns for days: [${daysOfWeek.join(', ')}] for expertId: ${expertId} from ${startDate} to ${endDate}`);
    
    // Tạo query với validFrom và validTo
    // Pattern hợp lệ khi:
    // 1. validFrom <= endDate (bắt đầu trước hoặc bằng ngày cuối của khoảng)
    // 2. validTo >= startDate (kết thúc sau hoặc bằng ngày đầu của khoảng)
    // Điều này đảm bảo có ít nhất 1 ngày overlap giữa pattern và khoảng ngày
    const patterns = await db.collection(schedulePatternCollection).find({
      expertId: new ObjectId(expertId),
      daysOfWeek: { $in: daysOfWeek },
      isActive: true,
      $and: [
        { $or: [
            { validFrom: { $exists: false } },
            { validFrom: null },
            { validFrom: { $lte: endDate } }
          ]
        },
        { $or: [
            { validTo: { $exists: false } },
            { validTo: null },
            { validTo: { $gte: startDate } }
          ]
        }
      ]
    }).toArray();
    
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.log(`[DB Query Metrics] getSchedulePatternsByDaysOfWeek completed in ${duration.toFixed(2)}ms, returned ${patterns.length} patterns for ${daysOfWeek.length} days in date range ${startDate} - ${endDate}`);
    
    return patterns;
  } catch (error) {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[DB Error Metrics] getSchedulePatternsByDaysOfWeek failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

// Lấy overrides cho nhiều ngày cùng một lúc
async function getScheduleOverridesByDates(expertId, dates) {
  const db = getDB();
  const startTime = process.hrtime();
  
  try {
    console.log(`ExpertModel - Getting overrides for ${dates.length} dates for expertId: ${expertId}`);
    
    // Sử dụng MongoDB operator $in để lấy tất cả overrides cho các ngày được chỉ định
    const overrides = await db.collection(scheduleOverrideCollection).find({
      expertId: new ObjectId(expertId),
      date: { $in: dates }
    }).toArray();
    
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.log(`[DB Query Metrics] getScheduleOverridesByDates completed in ${duration.toFixed(2)}ms, returned ${overrides.length} overrides for ${dates.length} dates`);
    
    return overrides;
  } catch (error) {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[DB Error Metrics] getScheduleOverridesByDates failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

export default {
  getVerificationStatus,
  updateProfile,
  saveVerificationDocuments,
  getReviews,
  getBookings,
  getDashboardStats,
  // Schedule Pattern
  getAllSchedulePatterns,
  getSchedulePatternById,
  getSchedulePatternsByDayOfWeek,
  createSchedulePattern,
  updateSchedulePattern,
  deleteSchedulePattern,
  // Schedule Override
  getAllScheduleOverrides,
  getScheduleOverrideByDate,
  createScheduleOverride,
  updateScheduleOverride,
  getScheduleOverridesByDateRange,
  deleteScheduleOverride,
  // Schedule utils
  getSchedulePatternTimeSlotsByDate,
  // Booking utils
  getFilteredExpertBookings,
  getExpertBookingsWithDetails,
  getBookingsByDateRange,
  getExpertBookingStats,
  // New functions
  getSchedulePatternsByDaysOfWeek,
  getScheduleOverridesByDates
};

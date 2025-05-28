// server/models/clientModel.js
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { BOOKING_STATUS } from '../utils/constants.js';

// Lấy danh sách booking của khách hàng
async function getClientBookings(clientId) {
  const db = getDB();

  // Truy vấn tất cả booking của khách hàng và sắp xếp theo ngày giảm dần
  const bookings = await db.collection('bookings')
    .find({
      clientId: new ObjectId(clientId)
    })
    .sort({ date: -1 })
    .toArray();


  // Lấy danh sách tất cả các reviews để kiểm tra những booking nào đã có review
  const reviews = await db.collection('reviews')
    .find({
      clientId: new ObjectId(clientId),
      bookingId: { $ne: null } // Chỉ lấy reviews có bookingId
    })
    .toArray();

  // Tạo map từ bookingId đến review để dễ truy xuất
  const reviewMap = new Map();
  reviews.forEach(review => {
    if (review.bookingId) {
      reviewMap.set(review.bookingId.toString(), review);
    }
  });

  // Cập nhật trường hasReview cho mỗi booking dựa vào dữ liệu từ bảng reviews
  const enhancedBookings = bookings.map(booking => {
    // Kiểm tra nếu booking chưa có trường hasReview thì kiểm tra từ reviews
    if (booking.hasReview === undefined) {
      const hasReview = reviewMap.has(booking._id.toString());
      return { ...booking, hasReview };
    }
    return booking;
  });

  return enhancedBookings;
}

// Lấy danh sách booking của khách hàng với các điều kiện lọc trực tiếp từ database
async function getFilteredClientBookings(clientId, filter) {
  const db = getDB();

  // Xây dựng query cơ bản
  let query = { clientId: new ObjectId(clientId) };
  
  // Thêm điều kiện lọc dựa vào filter
  if (filter) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    switch (filter) {
      case 'upcoming':
        // Lọc booking sắp tới trực tiếp tại database
        query.$or = [
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

  // Thực hiện truy vấn với điều kiện đã lọc
  const bookings = await db.collection('bookings')
    .find(query)
    .sort({ date: -1 })
    .toArray();

  // Lấy danh sách tất cả các reviews có liên quan đến các booking đã lọc
  const bookingIds = bookings.map(booking => booking._id);
  const reviews = await db.collection('reviews')
    .find({
      clientId: new ObjectId(clientId),
      bookingId: { $in: bookingIds }
    })
    .toArray();

  // Tạo map từ bookingId đến review
  const reviewMap = new Map();
  reviews.forEach(review => {
    if (review.bookingId) {
      reviewMap.set(review.bookingId.toString(), review);
    }
  });

  // Cập nhật trường hasReview cho mỗi booking
  const enhancedBookings = bookings.map(booking => {
    if (booking.hasReview === undefined) {
      const hasReview = reviewMap.has(booking._id.toString());
      return { ...booking, hasReview };
    }
    return booking;
  });

  return enhancedBookings;
}

// Lấy booking với thông tin chi tiết của expert sử dụng aggregation
async function getClientBookingsWithDetails(clientId, filter, page = 1, limit = 10, lastId = null) {
  const db = getDB();
  const startTime = process.hrtime();
  const aggregationOptions = { allowDiskUse: true }; // Cho phép sử dụng disk cho các tập dữ liệu lớn
  
  try {
    // Xây dựng stage $match cơ bản
    let matchStage = { clientId: new ObjectId(clientId) };
    
    // Thêm điều kiện lọc theo cursor (ID của booking trước đó)
    if (lastId) {
      matchStage._id = { $lt: new ObjectId(lastId) };
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
    const hint = { clientId: 1, date: 1, status: 1 };
    
    // Đếm tổng số booking thỏa mãn điều kiện (nếu cần thống kê tổng số)
    // Chỉ thực hiện khi không có cursor (trang đầu tiên) để tối ưu hiệu suất
    let totalCount = null;
    if (!lastId) {
      const countStartTime = process.hrtime();
      totalCount = await db.collection('bookings').countDocuments(matchStage, { hint });
      const countEndTime = process.hrtime(countStartTime);
      const countDuration = countEndTime[0] * 1000 + countEndTime[1] / 1000000;
      console.log(`[Query Metrics] Count operation completed in ${countDuration.toFixed(2)}ms, total: ${totalCount}`);
    }
    
    // Giới hạn số lượng kết quả tối đa
    const limitNum = parseInt(limit) || 10;
    
    // Xây dựng pipeline tối ưu
    const pipeline = [
      // Stage 1: Lọc booking theo điều kiện
      { $match: matchStage },
      
      // Stage 2: Sắp xếp theo ID giảm dần - cần đặt trước $limit để tận dụng index
      { $sort: { _id: -1 } },
      
      // Stage 3: Giới hạn số lượng kết quả trước khi join
      { $limit: limitNum },
      
      // Stage 4: Projection ban đầu để giảm kích thước dữ liệu trước khi lookup
      { $project: {
          _id: 1,
          date: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          price: 1,
          paymentStatus: 1,
          note: 1,
          attachments: 1,
          expertId: 1,
          clientId: 1,
          createdAt: 1,
          updatedAt: 1
      }},
      
      // Stage 5: Join với collection users để lấy thông tin expert
      { $lookup: {
          from: 'users',
          let: { expertId: '$expertId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$expertId'] } } },
            { $project: { 
                name: 1, 
                field: 1, 
                expertise: 1, 
                avatar: 1,
                rating: 1,
                reviewCount: 1
              }
            }
          ],
          as: 'expertDetails'
      }},
      
      // Stage 6: Unwrap expert details array
      { $unwind: {
          path: '$expertDetails',
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
          note: 1,
          attachments: 1,
          expertId: 1,
          clientId: 1,
          createdAt: 1,
          updatedAt: 1,
          expertName: '$expertDetails.name',
          expertField: '$expertDetails.field',
          expertExpertise: '$expertDetails.expertise',
          expertAvatar: '$expertDetails.avatar',
          expertRating: '$expertDetails.rating',
          expertReviewCount: '$expertDetails.reviewCount'
      }}
    ];
    
    // Thêm hint vào option
    const options = { 
      ...aggregationOptions,
      hint
    };
    
    const pipelineStart = process.hrtime();
    const bookings = await db.collection('bookings').aggregate(pipeline, options).toArray();
    const pipelineEnd = process.hrtime(pipelineStart);
    const pipelineDuration = pipelineEnd[0] * 1000 + pipelineEnd[1] / 1000000;
    
    // Xác định nextCursor (nếu có)
    const nextCursor = bookings.length === limitNum ? 
      bookings[bookings.length - 1]._id.toString() : null;
    
    const endTime = process.hrtime(startTime);
    const totalDuration = endTime[0] * 1000 + endTime[1] / 1000000;
    
    console.log(`[Query Performance] getClientBookingsWithDetails:
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
        hasMore: bookings.length === limitNum,
        nextCursor: nextCursor,
        limit: limitNum
      }
    };
  } catch (error) {
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;
    console.error(`[Query Error] getClientBookingsWithDetails failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}

// Tạo booking mới
async function createBooking(bookingData) {
  const db = getDB();
  const bookingToInsert = {
    ...bookingData,
    clientId: new ObjectId(bookingData.clientId),
    expertId: new ObjectId(bookingData.expertId),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: BOOKING_STATUS.PENDING // Sử dụng constant
  };
  
  const result = await db.collection('bookings').insertOne(bookingToInsert);
  
  // Return the complete booking object with the _id
  return {
    ...bookingToInsert,
    _id: result.insertedId
  };
}

// Hủy booking
async function cancelBooking(bookingId, clientId) {
  const db = getDB();
  return db.collection('bookings').updateOne(
    { 
      _id: new ObjectId(bookingId),
      clientId: new ObjectId(clientId)
    },
    { 
      $set: { 
        status: BOOKING_STATUS.CANCELED, // Sử dụng constant
        updatedAt: new Date()
      } 
    }
  );
}

// Lấy thông tin booking theo ID
async function getBookingById(bookingId) {
  const db = getDB();
  return db.collection('bookings').findOne({
    _id: new ObjectId(bookingId)
  });
}

// Lấy danh sách tất cả chuyên gia
async function getAllExperts() {
  const db = getDB();
  return db.collection('users').find({
    role: 'expert',
    verified: 'verified' // Chỉ lấy các chuyên gia đã được xác thực
  }).toArray();
}

// Tìm kiếm chuyên gia theo lĩnh vực hoặc chuyên môn
async function searchExperts(query) {
  const db = getDB();
  return db.collection('users').find({
    role: 'expert',
    verified: 'verified',
    $or: [
      { field: { $regex: query, $options: 'i' } },
      { expertise: { $regex: query, $options: 'i' } }
    ]
  }).toArray();
}

// Lọc chuyên gia theo lĩnh vực
async function filterExpertsByField(field) {
  const db = getDB();
  return db.collection('users').find({
    role: 'expert',
    verified: 'verified',
    field
  }).toArray();
}

// Lấy thông tin chuyên gia theo ID
async function getExpertById(expertId) {
  const db = getDB();
  return db.collection('users').findOne({
    _id: new ObjectId(expertId),
    role: 'expert'
  });
}

// Cập nhật hồ sơ khách hàng
async function updateClientProfile(clientId, profileData) {
  const db = getDB();
  return db.collection('users').updateOne(
    { _id: new ObjectId(clientId), role: 'client' },
    { 
      $set: { 
        ...profileData,
        updatedAt: new Date()
      } 
    }
  );
}

// Thêm đánh giá cho chuyên gia
async function addReview(reviewData) {
  const db = getDB();
  const result = await db.collection('reviews').insertOne({
    ...reviewData,
    clientId: new ObjectId(reviewData.clientId),
    expertId: new ObjectId(reviewData.expertId),
    createdAt: new Date()
  });
  
  // Cập nhật điểm đánh giá trung bình cho chuyên gia
  await updateExpertRating(reviewData.expertId);
  
  // Cập nhật trạng thái hasReview cho booking nếu có bookingId
  if (reviewData.bookingId) {
    await db.collection('bookings').updateOne(
      { _id: new ObjectId(reviewData.bookingId) },
      { $set: { hasReview: true } }
    );
    console.log(`Updated hasReview flag for booking ${reviewData.bookingId}`);
  }
  
  return result.insertedId;
}

// Cập nhật điểm đánh giá trung bình của chuyên gia
async function updateExpertRating(expertId) {
  const db = getDB();
  
  // Lấy tất cả đánh giá của chuyên gia
  const reviews = await db.collection('reviews').find({
    expertId: new ObjectId(expertId)
  }).toArray();
  
  // Tính điểm trung bình
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
  
  // Cập nhật thông tin chuyên gia
  await db.collection('users').updateOne(
    { _id: new ObjectId(expertId) },
    { 
      $set: { 
        rating: averageRating,
        reviewCount: reviews.length
      } 
    }
  );
}

// Cập nhật thông tin thanh toán của booking
async function updateBookingPayment(bookingId, paymentData) {
  const db = getDB();
  console.log('[PAYMENT DEBUG] clientModel.updateBookingPayment - Updating booking payment for bookingId:', bookingId, 'with data:', paymentData);
  console.log('[PAYMENT DEBUG] Stack trace:', new Error().stack);
  
  try {
    // Get current booking to check if status is changing
    const currentBooking = await getBookingById(bookingId);
    if (!currentBooking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }
    
    // Extract status and updatedBy if they exist in paymentData
    const { status, updatedBy, ...paymentInfo } = paymentData;
    
    // Prepare update data
    const updateData = {
      ...paymentInfo,
      updatedAt: new Date()
    };
    
    // Add status and updatedBy if they were provided - THIS IS THE KEY ISSUE
    // We should NOT update status here, as it causes duplicate stats updates
    if (status) {
      console.log(`[PAYMENT DEBUG] clientModel.updateBookingPayment - Status change detected in payment data: ${currentBooking.status} -> ${status}`);
      console.log(`[PAYMENT DEBUG] clientModel.updateBookingPayment - REMOVING status from updateData to avoid duplicate stats updates`);
      // IMPORTANT: We're NOT adding status to updateData anymore
      // updateData.status = status;
    } else {
      console.log(`[PAYMENT DEBUG] clientModel.updateBookingPayment - No status change in payment data`);
    }
    
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }
    
    console.log(`[PAYMENT DEBUG] clientModel.updateBookingPayment - Final updateData:`, updateData);
    
    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: updateData }
    );
    
    console.log('[PAYMENT DEBUG] clientModel.updateBookingPayment - Update result:', result);
    
    return result;
  } catch (error) {
    console.error('Error updating booking payment:', error);
    throw error;
  }
}

// Lấy tất cả booking của chuyên gia trong một ngày cụ thể
async function getBookingsByExpertAndDate(expertId, date) {
  const db = getDB();
  try {
    return db.collection('bookings').find({
      expertId: new ObjectId(expertId),
      date: date,
      status: { $ne: BOOKING_STATUS.CANCELED } // Sử dụng constant
    }).toArray();
  } catch (error) {
    console.error('Error getting bookings by expert and date:', error);
    throw error;
  }
}

// Cập nhật trạng thái booking
async function updateBookingStatus(bookingId, status, updatedBy) {
  const db = getDB();
  try {
    console.log(`[STATUS DEBUG] clientModel.updateBookingStatus - Updating booking ${bookingId} status to ${JSON.stringify(status)}`);
    
    // Kiểm tra nếu status là object hay string
    const statusValue = typeof status === 'object' ? status.status : status;
    const updatedByValue = typeof status === 'object' && status.updatedBy ? status.updatedBy : (updatedBy || 'system');
    
    console.log(`[STATUS DEBUG] Normalized status value: ${statusValue}, updatedBy: ${updatedByValue}`);
    
    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          status: statusValue,
          updatedAt: new Date(),
          updatedBy: updatedByValue
        } 
      }
    );
    
    console.log(`[STATUS DEBUG] clientModel.updateBookingStatus - Updated booking ${bookingId} status to ${status}. Result:`, result);
    return result;
  } catch (error) {
    console.error(`Error updating booking status to ${status}:`, error);
    throw error;
  }
}

// Lấy review dựa vào bookingId
async function getReviewByBookingId(bookingId) {
  const db = getDB();
  try {
    // Tìm review có bookingId tương ứng
    const review = await db.collection('reviews').findOne({
      bookingId: new ObjectId(bookingId)
    });
    
    return review;
  } catch (error) {
    console.error(`Error getting review by bookingId: ${error.message}`);
    throw error;
  }
}

// Lấy thống kê số lượng booking theo loại trực tiếp từ database
async function getClientBookingStats(clientId) {
  const db = getDB();
  
  try {
    // Đầu tiên kiểm tra xem có dữ liệu trong client_booking_stats không
    const cachedStats = await db.collection('client_booking_stats').findOne({ clientId: new ObjectId(clientId) });
    
    // Nếu có dữ liệu đã tính toán sẵn, trả về ngay
    if (cachedStats) {
      console.log(`Fetched cached booking stats for client ${clientId}`);
      return {
        upcoming: cachedStats.upcoming || 0,
        completed: cachedStats.completed || 0,
        canceled: cachedStats.canceled || 0,
        total: cachedStats.total || 0
      };
    }
    
    // Nếu không có dữ liệu, tính toán như trước đây
    console.log(`No cached stats found for client ${clientId}, calculating...`);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Đếm số booking sắp tới
    const upcomingCount = await db.collection('bookings').countDocuments({
      clientId: new ObjectId(clientId),
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
      clientId: new ObjectId(clientId),
      status: BOOKING_STATUS.COMPLETED
    });

    // Đếm số booking đã hủy và đã thanh toán
    const canceledCount = await db.collection('bookings').countDocuments({
      clientId: new ObjectId(clientId),
      status: BOOKING_STATUS.CANCELED,
      paymentStatus: 'completed'
    });

    // Đếm tổng số booking
    const totalCount = await db.collection('bookings').countDocuments({
      clientId: new ObjectId(clientId)
    });

    // Lưu kết quả vào cache để lần sau không cần tính lại
    const stats = {
      upcoming: upcomingCount,
      completed: completedCount,
      canceled: canceledCount,
      total: totalCount
    };
    
    // Lưu vào collection client_booking_stats
    await db.collection('client_booking_stats').updateOne(
      { clientId: new ObjectId(clientId) },
      { 
        $set: {
          ...stats,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    return stats;
  } catch (error) {
    console.error(`Error getting client booking stats: ${error.message}`);
    throw error;
  }
}

// Lấy expert với filters và limit (cursor-based pagination)
async function getExpertsWithFilters(filters = {}, limit = 12) {
  const db = getDB();
  console.log('=== MongoDB getExpertsWithFilters ===');
  console.log('Filters:', JSON.stringify(filters, null, 2));
  console.log('Limit:', limit);
  
  try {
    // Kiểm tra xem có tìm kiếm văn bản không để tối ưu pipeline
    const hasTextSearch = filters.$and && filters.$and.some(condition => condition.name && condition.name.$regex);
    
    // Tạo pipeline cơ bản
    const pipeline = [];
    
    if (hasTextSearch) {
      console.log('Detected text search conditions');
      
      try {
        // Tạo bản sao của filters không bao gồm $and
        const otherFilters = { ...filters };
        delete otherFilters.$and;
        
        // Lọc các điều kiện name
        const nameFilters = filters.$and.filter(condition => condition.name && condition.name.$regex);
        
        // Kết hợp các filter cơ bản 
        const basicFilters = {
          ...otherFilters,
          role: 'expert',
          verified: 'verified'
        };
        
        // Thêm stage đầu tiên: lọc theo các điều kiện cơ bản 
        // để giảm số lượng documents cần xử lý
        pipeline.push({ $match: basicFilters });
        
        // Đếm số từ khóa tìm kiếm
        const keywordCount = nameFilters.length;
        console.log(`Search has ${keywordCount} keywords`);
        
        // Chiến lược phụ thuộc vào số lượng từ khóa
        if (keywordCount > 2) {
          // Với nhiều từ khóa: tối ưu bằng cách dùng một regex kết hợp
          // Thay vì nhiều $and, sử dụng một điều kiện regex duy nhất
          // nhưng phức tạp hơn để tăng hiệu suất
          
          // Tạo từ khóa tìm kiếm từ các điều kiện
          const searchKeywords = nameFilters.map(condition => {
            const regex = condition.name.$regex;
            return typeof regex === 'string' ? regex : regex.source;
          });
          
          // Tạo pattern tìm tất cả từ khóa trong bất kỳ thứ tự nào
          const combinedPattern = searchKeywords
            .map(keyword => `(?=.*${keyword})`)
            .join('');
          
          // Tạo regex pattern hoàn chỉnh
          const finalPattern = `^${combinedPattern}.*$`;
          console.log('Using optimized combined pattern:', finalPattern);
          
          // Thêm điều kiện tìm kiếm tối ưu
          pipeline.push({
            $match: {
              name: {
                $regex: finalPattern,
                $options: 'i'
              }
            }
          });
          
        } else {
          // Với 1-2 từ khóa: giữ nguyên phương pháp $and để đơn giản
          // và tận dụng index hiệu quả
          const simplifiedQuery = nameFilters.map(condition => {
            const regex = condition.name.$regex;
            const pattern = typeof regex === 'string' ? regex : regex.source;
            return { name: { $regex: pattern, $options: 'i' } };
          });
          
          console.log('Using standard $and pattern for few keywords');
          pipeline.push({ $match: { $and: simplifiedQuery } });
        }
      } catch (searchError) {
        console.error('Error creating optimized text search:', searchError);
        console.log('Falling back to basic filtering');
        // Fallback: Sử dụng filter gốc nếu xử lý tìm kiếm văn bản gặp lỗi
        pipeline.push({ $match: filters });
      }
    } else {
      // Sử dụng match đơn giản nếu không có text search
      pipeline.push({ $match: filters });
    }
    
    // Stage sắp xếp kết quả
    pipeline.push({ $sort: { _id: 1 } });
    
    // Stage giới hạn số lượng kết quả
    pipeline.push({ $limit: limit });
    
    // Stage projection: chỉ lấy các trường cần thiết
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        field: 1,
        expertise: 1,
        experience: 1,
        price: 1,
        rating: 1,
        reviewCount: 1,
        avatar: 1
      }
    });
    
    console.log('Using optimized aggregation pipeline');
    
    // Thực hiện aggregation với các tùy chọn an toàn
    const result = await db.collection('users')
      .aggregate(pipeline, {
        allowDiskUse: true,             // Cho phép sử dụng disk nếu cần 
        maxTimeMS: 30000,               // Tăng giới hạn thời gian lên 30 giây
        hint: { _id: 1 },               // Sử dụng index _id làm hint
        comment: 'expert_search_safe'   // Comment để dễ nhận diện trong logs
      })
      .toArray();
    
    console.log(`Found ${result.length} documents`);
    console.log('=== END MongoDB getExpertsWithFilters ===');
    return result;
  } catch (error) {
    console.error('MongoDB Error in getExpertsWithFilters:', error);
    
    // Fallback: Thử sử dụng .find() đơn giản nếu aggregation fail
    console.log('Attempting fallback with simple find query');
    try {
      // Nếu có nhiều điều kiện regex, đơn giản hóa truy vấn
      let simplifiedFilters = { ...filters };
      
      if (filters.$and && filters.$and.length > 2) {
        // Giữ lại tối đa 2 điều kiện regex đầu tiên để cải thiện tốc độ
        const nameFilters = filters.$and.filter(condition => condition.name && condition.name.$regex);
        const otherFilters = { ...filters };
        delete otherFilters.$and;
        
        if (nameFilters.length > 0) {
          simplifiedFilters = {
            ...otherFilters,
            $and: nameFilters.slice(0, 2) // Chỉ lấy 2 điều kiện đầu tiên
          };
        }
      }
      
      const simpleResult = await db.collection('users')
        .find(simplifiedFilters)
        .sort({ _id: 1 })
        .limit(limit)
        .project({
          _id: 1,
          name: 1,
          email: 1,
          field: 1,
          expertise: 1,
          experience: 1,
          price: 1,
          rating: 1,
          reviewCount: 1,
          avatar: 1
        })
        .toArray();
      
      console.log(`Fallback successful, found ${simpleResult.length} documents`);
      return simpleResult;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw error; // Throw lỗi ban đầu
    }
  }
}

export default {
  getClientBookings,
  createBooking,
  cancelBooking,
  getBookingById,
  getAllExperts,
  searchExperts,
  filterExpertsByField,
  getExpertById,
  updateClientProfile,
  addReview,
  updateExpertRating,
  updateBookingPayment,
  getBookingsByExpertAndDate,
  updateBookingStatus,
  getReviewByBookingId,
  getFilteredClientBookings,
  getClientBookingsWithDetails,
  getClientBookingStats,
  getExpertsWithFilters
};
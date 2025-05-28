import { elasticClient } from '../utils/elasticClient.js';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

// Constants
const BOOKINGS_INDEX = 'bookings';

/**
 * Lấy thông tin expert dùng cho indexing
 * @param {string|ObjectId} expertId ID của expert
 * @returns {Promise<object>} Thông tin của expert
 */
const getExpertInfo = async (expertId) => {
  try {
    const db = getDB();
    
    // Lấy thông tin expert từ MongoDB
    const expert = await db.collection('users').findOne(
      { _id: new ObjectId(expertId) },
      { projection: { name: 1, field: 1, expertise: 1, avatar: 1 } }
    );
    
    if (!expert) {
      console.warn(`Không tìm thấy expert với ID: ${expertId}`);
      return null;
    }
    
    return {
      name: expert.name,
      field: expert.field || '',
      expertise: expert.expertise || '',
      avatar: expert.avatar || ''
    };
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin expert ${expertId}:`, error);
    return null;
  }
};

/**
 * Index một booking vào Elasticsearch
 * @param {Object} booking Dữ liệu booking cần index
 * @param {boolean} fetchExpert Có lấy thông tin expert không
 * @returns {Promise<boolean>} Kết quả index
 */
const indexBooking = async (booking, fetchExpert = true) => {
  try {
    // Clone booking để tránh thay đổi dữ liệu gốc
    const bookingData = { ...booking };
    
    // Chuyển đổi _id nếu là ObjectId
    const id = bookingData._id.toString();
    delete bookingData._id; // Xóa _id vì sẽ được dùng làm ID của document
    
    // Chuyển đổi các ObjectId khác thành string
    if (bookingData.clientId) {
      bookingData.clientId = bookingData.clientId.toString();
    }
    
    if (bookingData.expertId) {
      bookingData.expertId = bookingData.expertId.toString();
    }
    
    // Lấy thông tin expert nếu cần
    if (fetchExpert && bookingData.expertId && !bookingData.expertInfo) {
      const expertInfo = await getExpertInfo(bookingData.expertId);
      if (expertInfo) {
        bookingData.expertInfo = expertInfo;
      }
    }
    
    // Thêm trường để xác định loại document trong join relationship
    bookingData.booking_expert_relation = {
      name: "booking"
    };
    
    // Index booking vào Elasticsearch
    await elasticClient.index({
      index: BOOKINGS_INDEX,
      id: id,
      document: bookingData,
      refresh: true // Đảm bảo dữ liệu được refresh ngay lập tức (có thể bỏ trong production để tăng hiệu suất)
    });
    
    console.log(`Đã index booking ${id} vào Elasticsearch`);
    return true;
  } catch (error) {
    console.error('Lỗi khi index booking:', error);
    return false;
  }
};

/**
 * Xóa một booking khỏi Elasticsearch
 * @param {string} bookingId ID của booking cần xóa
 * @returns {Promise<boolean>} Kết quả xóa
 */
const deleteBooking = async (bookingId) => {
  try {
    await elasticClient.delete({
      index: BOOKINGS_INDEX,
      id: bookingId.toString()
    });
    
    console.log(`Đã xóa booking ${bookingId} khỏi Elasticsearch`);
    return true;
  } catch (error) {
    console.error(`Lỗi khi xóa booking ${bookingId}:`, error);
    return false;
  }
};

/**
 * Tìm kiếm bookings với cursor-based pagination
 * @param {string} clientId ID của client
 * @param {string} filter Filter trạng thái booking
 * @param {number} limit Số lượng kết quả tối đa
 * @param {string|null} cursor Cursor phân trang
 * @returns {Promise<Object>} Kết quả tìm kiếm với thông tin phân trang
 */
const searchBookings = async (clientId, filter, limit = 10, cursor = null) => {
  try {
    console.log(`[Elasticsearch] Tìm kiếm bookings cho client ${clientId} với filter=${filter}, limit=${limit}, cursor=${cursor}`);
    
    // Tạo query
    const query = {
      bool: {
        must: [
          { term: { clientId: clientId.toString() } }
        ]
      }
    };
    
    // Thêm điều kiện filter
    if (filter) {
      if (filter === 'completed') {
        query.bool.must.push({ term: { status: 'completed' } });
      } else if (filter === 'canceled') {
        query.bool.must.push({ term: { status: 'canceled' } });
      } else if (filter === 'upcoming') {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        query.bool.must.push({
          bool: {
            should: [
              // Booking trong tương lai
              {
                bool: {
                  must: [
                    { range: { date: { gt: today } } },
                    { terms: { status: ['pending', 'confirmed'] } }
                  ]
                }
              },
              // Booking hôm nay nhưng chưa bắt đầu
              {
                bool: {
                  must: [
                    { term: { date: today } },
                    { range: { startTime: { gt: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}` } } },
                    { terms: { status: ['pending', 'confirmed'] } }
                  ]
                }
              }
            ],
            minimum_should_match: 1
          }
        });
      }
    }
    
    // Cấu hình sort và search_after
    const sort = [
      { date: { order: 'desc' } },
      { _id: { order: 'desc' } }
    ];
    
    const searchOptions = {
      from: 0,
      size: limit + 1, // Lấy thêm 1 item để kiểm tra hasMore
      sort
    };
    
    // Thêm search_after nếu có cursor
    if (cursor) {
      try {
        searchOptions.search_after = JSON.parse(cursor);
      } catch (e) {
        console.error('Lỗi parse cursor:', e);
      }
    }
    
    // Thực hiện tìm kiếm
    const result = await elasticClient.search({
      index: BOOKINGS_INDEX,
      body: {
        query,
        ...searchOptions
      }
    });
    
    // Xử lý kết quả
    const bookings = result.hits.hits.map(hit => ({
      ...hit._source,
      _id: hit._id
    }));
    
    // Kiểm tra hasMore
    const hasMore = bookings.length > limit;
    if (hasMore) {
      bookings.pop(); // Bỏ phần tử cuối
    }
    
    // Tạo nextCursor
    const nextCursor = hasMore && bookings.length > 0 
      ? JSON.stringify([bookings[bookings.length - 1].date, bookings[bookings.length - 1]._id])
      : null;
    
    console.log(`[Elasticsearch] Tìm thấy ${bookings.length} bookings`);
    
    return {
      bookings,
      pagination: {
        limit,
        hasMore,
        nextCursor
      }
    };
  } catch (error) {
    console.error('Lỗi khi tìm kiếm bookings với Elasticsearch:', error);
    throw error;
  }
};

/**
 * Đồng bộ tất cả bookings từ MongoDB vào Elasticsearch
 * @param {boolean} shouldDelete Có xóa index cũ không
 * @returns {Promise<object>} Kết quả đồng bộ
 */
const syncAllBookings = async (shouldDelete = false) => {
  try {
    console.log('Bắt đầu đồng bộ tất cả bookings từ MongoDB...');
    const startTime = Date.now();
    
    // Xóa và tạo lại index nếu cần
    if (shouldDelete) {
      const indexExists = await elasticClient.indices.exists({ index: BOOKINGS_INDEX });
      
      if (indexExists) {
        console.log(`Xóa index ${BOOKINGS_INDEX} hiện tại...`);
        await elasticClient.indices.delete({ index: BOOKINGS_INDEX });
      }
      
      // Tạo lại index
      console.log(`Tạo lại index ${BOOKINGS_INDEX}...`);
      // Code tạo index (đã triển khai trong createBookingsIndex.js)
    }
    
    const db = getDB();
    let count = 0;
    let failedCount = 0;
    const batchSize = 1000;
    let lastId = null;
    
    // Đếm tổng số booking
    const totalCount = await db.collection('bookings').countDocuments();
    console.log(`Tổng số ${totalCount} bookings cần đồng bộ`);
    
    // Lặp qua tất cả bookings và đồng bộ theo batch
    while (true) {
      // Tạo query
      let query = {};
      if (lastId) {
        query._id = { $gt: lastId };
      }
      
      // Lấy batch tiếp theo
      const bookings = await db.collection('bookings')
        .find(query)
        .sort({ _id: 1 })
        .limit(batchSize)
        .toArray();
      
      if (bookings.length === 0) {
        break; // Đã xử lý tất cả booking
      }
      
      console.log(`Đang xử lý batch ${count + 1} - ${count + bookings.length} / ${totalCount}`);
      
      // Đồng bộ batch
      for (const booking of bookings) {
        // Lấy thông tin expert
        const expertInfo = await getExpertInfo(booking.expertId);
        
        // Thêm thông tin expert vào booking
        const bookingWithExpert = {
          ...booking,
          expertInfo
        };
        
        // Index vào Elasticsearch
        const success = await indexBooking(bookingWithExpert, false);
        
        if (success) {
          count++;
        } else {
          failedCount++;
        }
        
        // Cập nhật lastId
        lastId = booking._id;
      }
      
      // Log tiến trình
      console.log(`Đã xử lý ${count} bookings, thất bại: ${failedCount}`);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`Đồng bộ hoàn tất. Thành công: ${count}, thất bại: ${failedCount}, thời gian: ${duration.toFixed(2)}s`);
    
    return {
      success: true,
      totalSynced: count,
      failed: failedCount,
      duration
    };
  } catch (error) {
    console.error('Lỗi khi đồng bộ bookings:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  indexBooking,
  deleteBooking,
  searchBookings,
  syncAllBookings,
  BOOKINGS_INDEX
}; 
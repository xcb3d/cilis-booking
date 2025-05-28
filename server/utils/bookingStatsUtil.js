import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { BOOKING_STATUS } from './constants.js';

// Hàm cập nhật thống kê booking khi có thay đổi trạng thái
export async function updateBookingStats(clientId, expertId, oldStatus, newStatus) {
  try {
    console.log(`[STATS DEBUG] bookingStatsUtil - Updating stats for status change: ${oldStatus} -> ${newStatus}`);
    console.log(`[STATS DEBUG] bookingStatsUtil - Client: ${clientId}, Expert: ${expertId}`);
    console.log(`[STATS DEBUG] Stack trace:`, new Error().stack);
    
    const db = getDB();
    
    // Cập nhật thống kê của client
    if (clientId) {
      await updateClientBookingStats(db, clientId, oldStatus, newStatus);
    }
    
    // Cập nhật thống kê của expert
    if (expertId) {
      await updateExpertBookingStats(db, expertId, oldStatus, newStatus);
    }
  } catch (error) {
    console.error(`Error updating booking stats: ${error.message}`);
    // Không ném lỗi để không ảnh hưởng đến luồng chính
  }
}

// Cập nhật thống kê booking của client
async function updateClientBookingStats(db, clientId, oldStatus, newStatus) {
  try {
    console.log(`[STATS DETAIL] updateClientBookingStats - Start for client ${clientId}, change: ${oldStatus} -> ${newStatus}`);
    
    // Lấy thống kê hiện tại
    const stats = await db.collection('client_booking_stats').findOne({ 
      clientId: new ObjectId(clientId) 
    });
    
    if (!stats) {
      console.log(`[STATS DETAIL] No stats found for client ${clientId}, creating new stats record`);
      // Tạo mới nếu chưa có
      await db.collection('client_booking_stats').insertOne({
        clientId: new ObjectId(clientId),
        upcoming: newStatus === BOOKING_STATUS.PENDING || newStatus === BOOKING_STATUS.CONFIRMED ? 1 : 0,
        completed: newStatus === BOOKING_STATUS.COMPLETED ? 1 : 0,
        canceled: newStatus === BOOKING_STATUS.CANCELED ? 1 : 0,
        total: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return;
    }
    
    console.log(`[STATS DETAIL] Current stats for client ${clientId}:`, stats);
    
    // Tạo object cập nhật
    const update = { updatedAt: new Date() };
    
    // Xử lý theo trạng thái cũ
    if (oldStatus === BOOKING_STATUS.PENDING || oldStatus === BOOKING_STATUS.CONFIRMED) {
      // Booking sắp tới bị giảm đi 1
      update.upcoming = Math.max((stats.upcoming || 0) - 1, 0);
      console.log(`[STATS DETAIL] Decreasing upcoming count from ${stats.upcoming} to ${update.upcoming}`);
    }
    
    // Xử lý theo trạng thái mới
    if (newStatus === BOOKING_STATUS.COMPLETED) {
      // Booking hoàn thành tăng lên 1
      update.completed = (stats.completed || 0) + 1;
      console.log(`[STATS DETAIL] Increasing completed count from ${stats.completed} to ${update.completed}`);
    } else if (newStatus === BOOKING_STATUS.CANCELED) {
      // Booking bị hủy tăng lên 1
      update.canceled = (stats.canceled || 0) + 1;
      console.log(`[STATS DETAIL] Increasing canceled count from ${stats.canceled} to ${update.canceled}`);
    } else if (newStatus === BOOKING_STATUS.PENDING || newStatus === BOOKING_STATUS.CONFIRMED) {
      // Booking sắp tới tăng lên 1
      // Kiểm tra nếu đã có giảm upcoming ở trên (khi oldStatus cũng là pending/confirmed)
      if (update.upcoming !== undefined) {
        // Nếu đã giảm upcoming ở trên, thì cần tăng lại 1
        update.upcoming = update.upcoming + 1;
        console.log(`[STATS DETAIL] Re-increasing upcoming count to ${update.upcoming} (same status group)`);
      } else {
        // Nếu chưa giảm, thì tăng lên 1 từ giá trị hiện tại
        update.upcoming = (stats.upcoming || 0) + 1;
        console.log(`[STATS DETAIL] Increasing upcoming count from ${stats.upcoming} to ${update.upcoming}`);
      }
    }
    
    console.log(`[STATS DETAIL] Final update object:`, update);
    
    // Cập nhật vào database
    const result = await db.collection('client_booking_stats').updateOne(
      { clientId: new ObjectId(clientId) },
      { $set: update }
    );
    
    console.log(`[STATS DETAIL] Database update result:`, result);
    console.log(`Updated client ${clientId} booking stats for status change ${oldStatus} -> ${newStatus}`);
  } catch (error) {
    console.error(`Error updating client booking stats: ${error.message}`);
  }
}

// Cập nhật thống kê booking của expert
async function updateExpertBookingStats(db, expertId, oldStatus, newStatus) {
  try {
    console.log(`[STATS DETAIL] updateExpertBookingStats - Start for expert ${expertId}, change: ${oldStatus} -> ${newStatus}`);
    
    // Lấy thống kê hiện tại
    const stats = await db.collection('expert_booking_stats').findOne({ 
      expertId: new ObjectId(expertId) 
    });
    
    if (!stats) {
      console.log(`[STATS DETAIL] No stats found for expert ${expertId}, creating new stats record`);
      // Tạo mới nếu chưa có
      await db.collection('expert_booking_stats').insertOne({
        expertId: new ObjectId(expertId),
        upcoming: newStatus === BOOKING_STATUS.PENDING || newStatus === BOOKING_STATUS.CONFIRMED ? 1 : 0,
        completed: newStatus === BOOKING_STATUS.COMPLETED ? 1 : 0,
        canceled: newStatus === BOOKING_STATUS.CANCELED ? 1 : 0,
        total: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return;
    }
    
    console.log(`[STATS DETAIL] Current stats for expert ${expertId}:`, stats);
    
    // Tạo object cập nhật
    const update = { updatedAt: new Date() };
    
    // Xử lý theo trạng thái cũ
    if (oldStatus === BOOKING_STATUS.PENDING || oldStatus === BOOKING_STATUS.CONFIRMED) {
      // Booking sắp tới bị giảm đi 1
      update.upcoming = Math.max((stats.upcoming || 0) - 1, 0);
      console.log(`[STATS DETAIL] Decreasing upcoming count from ${stats.upcoming} to ${update.upcoming}`);
    }
    
    // Xử lý theo trạng thái mới
    if (newStatus === BOOKING_STATUS.COMPLETED) {
      // Booking hoàn thành tăng lên 1
      update.completed = (stats.completed || 0) + 1;
      console.log(`[STATS DETAIL] Increasing completed count from ${stats.completed} to ${update.completed}`);
    } else if (newStatus === BOOKING_STATUS.CANCELED) {
      // Booking bị hủy tăng lên 1
      update.canceled = (stats.canceled || 0) + 1;
      console.log(`[STATS DETAIL] Increasing canceled count from ${stats.canceled} to ${update.canceled}`);
    } else if (newStatus === BOOKING_STATUS.PENDING || newStatus === BOOKING_STATUS.CONFIRMED) {
      // Booking sắp tới tăng lên 1
      // Kiểm tra nếu đã có giảm upcoming ở trên (khi oldStatus cũng là pending/confirmed)
      if (update.upcoming !== undefined) {
        // Nếu đã giảm upcoming ở trên, thì cần tăng lại 1
        update.upcoming = update.upcoming + 1;
        console.log(`[STATS DETAIL] Re-increasing upcoming count to ${update.upcoming} (same status group)`);
      } else {
        // Nếu chưa giảm, thì tăng lên 1 từ giá trị hiện tại
        update.upcoming = (stats.upcoming || 0) + 1;
        console.log(`[STATS DETAIL] Increasing upcoming count from ${stats.upcoming} to ${update.upcoming}`);
      }
    }
    
    console.log(`[STATS DETAIL] Final update object:`, update);
    
    // Cập nhật vào database
    const result = await db.collection('expert_booking_stats').updateOne(
      { expertId: new ObjectId(expertId) },
      { $set: update }
    );
    
    console.log(`[STATS DETAIL] Database update result:`, result);
    console.log(`Updated expert ${expertId} booking stats for status change ${oldStatus} -> ${newStatus}`);
  } catch (error) {
    console.error(`Error updating expert booking stats: ${error.message}`);
  }
} 
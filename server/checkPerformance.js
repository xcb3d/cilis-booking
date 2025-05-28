import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Thiết lập đường dẫn
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc biến môi trường
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'cilis-booking';

async function checkPerformance() {
  console.log('Connecting to MongoDB...');
  console.log('URI:', MONGODB_URI);
  console.log('DB Name:', DB_NAME);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('Successfully connected to MongoDB');
    
    // Kiểm tra indexes cho collections
    console.log('\nChecking indexes on bookings collection:');
    const bookingsIndexes = await db.collection('bookings').indexes();
    console.log(JSON.stringify(bookingsIndexes, null, 2));
    
    console.log('\nChecking indexes on users collection:');
    const usersIndexes = await db.collection('users').indexes();
    console.log(JSON.stringify(usersIndexes, null, 2));
    
    // Kiểm tra kích thước collections
    console.log('\nChecking collection stats:');
    
    const bookingsStats = await db.collection('bookings').stats();
    console.log('Bookings collection:');
    console.log('- Size:', (bookingsStats.size / (1024 * 1024)).toFixed(2), 'MB');
    console.log('- Document count:', bookingsStats.count);
    console.log('- Average document size:', (bookingsStats.avgObjSize / 1024).toFixed(2), 'KB');
    
    const usersStats = await db.collection('users').stats();
    console.log('\nUsers collection:');
    console.log('- Size:', (usersStats.size / (1024 * 1024)).toFixed(2), 'MB');
    console.log('- Document count:', usersStats.count);
    console.log('- Average document size:', (usersStats.avgObjSize / 1024).toFixed(2), 'KB');
    
    // Phân tích một truy vấn tương tự API
    console.log('\nAnalyzing query performance for GET /api/clients/bookings?filter=completed&limit=10:');
    
    // Stage 1: Lọc theo trạng thái "completed" và clientId cụ thể
    // Giả sử chọn một clientId ngẫu nhiên từ bookings
    const sampleBooking = await db.collection('bookings').findOne({ status: 'completed' });
    const sampleClientId = sampleBooking?.clientId;
    
    if (!sampleClientId) {
      console.log('No completed bookings found to analyze');
      return;
    }
    
    console.log('Using sample clientId:', sampleClientId);
    
    // Mô phỏng aggregation pipeline từ API
    const pipeline = [
      { $match: { clientId: sampleClientId, status: 'completed' } },
      { $sort: { date: -1, _id: -1 } },
      { $limit: 11 },
      { 
        $lookup: {
          from: 'users',
          let: { expertId: '$expertId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$expertId'] } } },
            { $project: { name: 1, field: 1, expertise: 1, avatar: 1 } }
          ],
          as: 'expertDetails'
        }
      }
    ];
    
    // Đo thời gian thực thi
    console.log('\nExecuting query and measuring time...');
    
    const start = process.hrtime();
    
    // Thực thi aggregation và lấy kết quả
    const result = await db.collection('bookings').aggregate(pipeline).toArray();
    
    const end = process.hrtime(start);
    const executionTime = (end[0] * 1000 + end[1] / 1000000).toFixed(2);
    
    console.log(`Query execution time: ${executionTime}ms`);
    console.log(`Documents returned: ${result.length}`);
    
    // Phân tích query với explain
    console.log('\nExplain query plan:');
    const explainResult = await db.collection('bookings').aggregate(pipeline, { explain: true });
    
    if (explainResult.stages) {
      // Tìm các stage quan trọng 
      const matchStage = explainResult.stages.find(stage => stage.$cursor?.queryPlanner);
      
      if (matchStage) {
        console.log('Query plan:', JSON.stringify(matchStage.$cursor.queryPlanner.winningPlan, null, 2));
        
        // Kiểm tra nếu dùng index hay COLLSCAN
        const usesIndex = JSON.stringify(matchStage.$cursor.queryPlanner.winningPlan).includes('IXSCAN');
        console.log('Uses index:', usesIndex ? 'Yes' : 'No (full collection scan)');
      }
    }
    
    // Đề xuất cải tiến
    console.log('\nSuggested improvements:');
    const matchStages = explainResult.stages?.filter(stage => stage.$cursor?.queryPlanner);
    
    if (matchStages && matchStages.length > 0) {
      for (const stage of matchStages) {
        const plan = stage.$cursor?.queryPlanner?.winningPlan;
        if (plan && plan.stage === 'COLLSCAN') {
          console.log('- Create index for better performance on $match stage');
          
          if (stage.$cursor?.queryPlanner?.parsedQuery?.clientId && stage.$cursor?.queryPlanner?.parsedQuery?.status) {
            console.log('  Suggested index: { "clientId": 1, "status": 1 }');
          }
        }
      }
    }
    
    if (pipeline.some(stage => stage.$sort)) {
      console.log('- Create index for $sort operation: { "date": -1, "_id": -1 }');
    }
    
  } catch (err) {
    console.error('Error during performance analysis:', err);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

// Thực thi phân tích
checkPerformance(); 
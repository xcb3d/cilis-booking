import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const userCollection = 'users';

// Tìm user theo email
async function findByEmail(email) {
  const db = getDB();
  console.log(await db.collection(userCollection).findOne({ email }))
  return db.collection(userCollection).findOne({ email });
}

// Tìm user theo ID
async function findById(id) {
  const db = getDB();
  const debugAuth = process.env.DEBUG_AUTH === 'true' || true;
  let startTime;
  
  if (debugAuth) {
    startTime = process.hrtime();
    console.log(`[UserModel Debug] Finding user by ID: ${id}`);
  }
  
  try {
    // Thêm index hint để tối ưu truy vấn
    const result = await db.collection(userCollection).findOne(
      { _id: new ObjectId(id) },
      { hint: { _id: 1 } }
    );
    
    if (debugAuth && startTime) {
      const endTime = process.hrtime(startTime);
      const duration = endTime[0] * 1000 + endTime[1] / 1000000;
      console.log(`[UserModel Debug] findById DB query time: ${duration.toFixed(2)}ms, found: ${!!result}`);
    }
    
    return result;
  } catch (error) {
    if (debugAuth) {
      const endTime = process.hrtime(startTime);
      const duration = endTime[0] * 1000 + endTime[1] / 1000000;
      console.log(`[UserModel Debug] findById DB error time: ${duration.toFixed(2)}ms`);
      console.error(`[UserModel Error] ${error.message}`);
    }
    throw error;
  }
}

// Tạo user mới
async function create(userData) {
  const db = getDB();
  const result = await db.collection(userCollection).insertOne(userData);
  return result.insertedId;
}

// Cập nhật thông tin user
async function update(id, userData) {
  const db = getDB();
  const result = await db.collection(userCollection).updateOne(
    { _id: new ObjectId(id) },
    { $set: userData }
  );
  return result.modifiedCount > 0;
}

// Search users by role and name query
async function searchUsersByRole(role, searchQuery) {
  const db = getDB();
  
  return db.collection(userCollection)
    .find({
      role: role,
      name: { $regex: searchQuery, $options: 'i' }
    })
    .limit(10)
    .toArray();
}

export default {
  findByEmail,
  findById,
  create,
  update,
  searchUsersByRole
};

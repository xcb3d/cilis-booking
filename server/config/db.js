import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'cilis-booking';

let db = null;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get database instance
const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export {
  connectDB,
  getDB
};

import mongoose from 'mongoose';
import { env } from './env.js';

// Establish (and keep) the single shared MongoDB connection.
export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log(`[db] connected to MongoDB: ${env.mongoUri}`);
  return mongoose.connection;
}

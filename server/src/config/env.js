import dotenv from 'dotenv';
dotenv.config();


export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bkafe',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  seedPassword: process.env.SEED_PASSWORD || 'Abc123@',
};

import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  apiUrl: process.env.API_URL || 'http://localhost:5000/api',
};

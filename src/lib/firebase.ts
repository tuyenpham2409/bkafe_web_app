/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Cấu hình Firebase sẽ đọc từ các biến môi trường trong file .env hoặc sử dụng cấu hình mặc định.
// Để kết nối dự án Firebase của riêng bạn:
// 1. Tạo file .env ở thư mục gốc (bkafe_web_app)
// 2. Điền các thông số cấu hình Firebase của bạn vào đó (xem file .env.example)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC5EM9g7UyUJDG0oyaY2bzidsC3B-7WDqo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bkafe-web-app-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bkafe-web-app-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bkafe-web-app-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "230448293772",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:230448293772:web:f3bab6563b05a955cb18a9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "pure-sanctum-f4dh4",
  appId: "1:965234572747:web:1ca90ee4c3d24c25ecca4e",
  apiKey: "AIzaSyCnwSMEMsj6W7SNUweHxvkke_UMi_jYsXk",
  authDomain: "pure-sanctum-f4dh4.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-1a35d9db-3bd3-4637-b4a1-56ef7f3a8ffe",
  storageBucket: "pure-sanctum-f4dh4.firebasestorage.app",
  messagingSenderId: "965234572747",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-1a35d9db-3bd3-4637-b4a1-56ef7f3a8ffe");

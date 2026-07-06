import React, { useState } from 'react';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Clean and validate username
    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setError('Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới (_) và dài từ 3-15 ký tự.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create authentication account first to authenticate the session
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // 2. Check username uniqueness in Firestore (this request is now authenticated)
      let isUsernameTaken = false;
      try {
        const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          if (!existingDoc.id.startsWith('demo-')) {
            isUsernameTaken = true;
          }
        }
      } catch (firestoreErr) {
        console.error("Firestore username check error:", firestoreErr);
        // Rollback authentication if firestore check fails
        await deleteUser(userCredential.user);
        setError('Lỗi kết nối cơ sở dữ liệu khi kiểm tra tên đăng nhập.');
        setLoading(false);
        return;
      }

      if (isUsernameTaken) {
        // Rollback authentication
        await deleteUser(userCredential.user);
        setError('Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.');
        setLoading(false);
        return;
      }

      // 3. Auto-assign admin if email matches, else user
      const role = email.trim() === 'admin@bkafe.hust.edu.vn' ? 'admin' : 'user';

      // 4. Save user profile to Firestore (migrate seeded data if present)
      let bio = '';
      let joinedAt = new Date().toISOString();
      
      try {
        const seededQuery = query(collection(db, 'users'), where('username', '==', cleanUsername));
        const seededSnap = await getDocs(seededQuery);
        
        if (!seededSnap.empty) {
          const seededDoc = seededSnap.docs[0];
          const seededData = seededDoc.data();
          bio = seededData.bio || '';
          joinedAt = seededData.joinedAt || joinedAt;
          
          const oldId = seededDoc.id;
          
          // Migrate posts
          const postsQuery = query(collection(db, 'posts'), where('authorId', '==', oldId));
          const postsSnap = await getDocs(postsQuery);
          for (const postDoc of postsSnap.docs) {
            await updateDoc(doc(db, 'posts', postDoc.id), { authorId: userCredential.user.uid });
          }
          
          // Migrate comments
          const commentsQuery = query(collection(db, 'comments'), where('authorId', '==', oldId));
          const commentsSnap = await getDocs(commentsQuery);
          for (const commentDoc of commentsSnap.docs) {
            await updateDoc(doc(db, 'comments', commentDoc.id), { authorId: userCredential.user.uid });
          }
          
          // Delete old seeded document if it had a different ID (e.g. demo-user-1)
          if (oldId !== userCredential.user.uid) {
            await deleteDoc(doc(db, 'users', oldId));
          }
        }
      } catch (migrateErr) {
        console.error("Failed to migrate pre-seeded user data:", migrateErr);
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email.trim(),
        displayName: displayName.trim(),
        username: cleanUsername,
        role,
        bio,
        joinedAt
      });

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-black text-center text-slate-900 mb-6 tracking-tight">Đăng ký tài khoản BKafe</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-semibold">{error}</div>}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên đăng nhập (username)</label>
          <input 
            type="text" 
            required 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="Ví dụ: tuyenpm23"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên hiển thị</label>
          <input 
            type="text" 
            required 
            value={displayName} 
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="Ví dụ: Phạm Minh Tuyên"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="sv@sis.hust.edu.vn"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mật khẩu</label>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="••••••••"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100 disabled:opacity-50 mt-2 text-sm cursor-pointer"
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-slate-600 font-medium">
        Đã có tài khoản? <Link to="/login" className="text-blue-600 font-bold hover:underline">Đăng nhập</Link>
      </div>
    </div>
  );
}

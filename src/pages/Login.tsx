import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [identifier, setIdentifier] = useState(''); // can be username or email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let loginEmail = identifier.trim();

    // Check if the input is a username (no '@' sign)
    if (!loginEmail.includes('@')) {
      try {
        const q = query(
          collection(db, 'users'), 
          where('username', '==', loginEmail.toLowerCase())
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setError('Không tìm thấy tài khoản với tên đăng nhập này.');
          setLoading(false);
          return;
        }
        // Extract associated email from user document
        const userDoc = querySnapshot.docs[0].data();
        loginEmail = userDoc.email;
      } catch (err) {
        console.error("Firestore lookup failed:", err);
        setError('Lỗi kết nối cơ sở dữ liệu khi kiểm tra tên đăng nhập.');
        setLoading(false);
        return;
      }
    }

    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-black text-center text-slate-900 mb-6 tracking-tight">Đăng nhập BKafe</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-semibold">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên đăng nhập hoặc Email</label>
          <input 
            type="text" 
            required 
            value={identifier} 
            onChange={e => setIdentifier(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="tuyenpm23 hoặc sv@sis.hust.edu.vn"
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
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-slate-600 font-medium">
        Chưa có tài khoản? <Link to="/register" className="text-blue-600 font-bold hover:underline">Đăng ký ngay</Link>
      </div>
    </div>
  );
}

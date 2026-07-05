import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Auto-assign admin if email matches a specific pattern, else user
      const role = email === 'admin@bkafe.hust.edu.vn' ? 'admin' : 'user';

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        role
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Đăng ký tài khoản</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
          <input 
            type="text" 
            required 
            value={displayName} 
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            placeholder="Ví dụ: Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            placeholder="sv@sis.hust.edu.vn"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
          Đăng ký
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-gray-600">
        Đã có tài khoản? <Link to="/login" className="text-blue-600 font-medium hover:underline">Đăng nhập</Link>
      </div>
    </div>
  );
}

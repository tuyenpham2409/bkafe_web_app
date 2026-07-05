import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Đăng nhập BKafe</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-4">
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
          Đăng nhập
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-gray-600">
        Chưa có tài khoản? <Link to="/register" className="text-blue-600 font-medium hover:underline">Đăng ký ngay</Link>
      </div>
    </div>
  );
}

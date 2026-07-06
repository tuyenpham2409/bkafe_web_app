import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import PasswordInput from '../components/PasswordInput';

const Req = () => <span className="text-red-500">*</span>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // forgot-password flow
  const [fgId, setFgId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fgMsg, setFgMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFgMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot', { identifier: fgId.trim() });
      setResetToken(res.resetToken || '');
      setFgMsg(res.resetToken ? 'Đã tạo mã đặt lại (điền mã + mật khẩu mới bên dưới).' : res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset', { token: resetToken.trim(), newPassword });
      alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      setMode('login');
      setResetToken('');
      setNewPassword('');
      setFgMsg('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-semibold">{error}</div>}

      {mode === 'login' ? (
        <>
          <h2 className="text-2xl font-black text-center text-slate-900 mb-6 tracking-tight">Đăng nhập BKafe</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tên đăng nhập (MSSV) hoặc Email <Req />
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="20233885 hoặc sv@sis.hust.edu.vn"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mật khẩu <Req />
              </label>
              <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
            </div>
            <div className="text-right">
              <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-xs font-bold text-blue-600 hover:underline">
                Quên mật khẩu?
              </button>
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
        </>
      ) : (
        <>
          <h2 className="text-2xl font-black text-center text-slate-900 mb-2 tracking-tight">Quên mật khẩu</h2>
          <p className="text-center text-xs text-slate-500 font-semibold mb-6">Nhập MSSV/email để lấy mã đặt lại mật khẩu.</p>
          {fgMsg && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100 font-semibold">{fgMsg}</div>}

          <form onSubmit={requestReset} className="space-y-3">
            <input
              type="text"
              required
              value={fgId}
              onChange={(e) => setFgId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm"
              placeholder="MSSV hoặc email"
            />
            <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50 text-sm">
              {loading ? 'Đang xử lý...' : 'Lấy mã đặt lại'}
            </button>
          </form>

          {resetToken && (
            <form onSubmit={doReset} className="space-y-3 mt-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mã đặt lại <Req /></label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mật khẩu mới <Req /></label>
                <PasswordInput value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
                Đặt lại mật khẩu
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => { setMode('login'); setError(''); }} className="text-sm text-blue-600 font-bold hover:underline">
              ← Quay lại đăng nhập
            </button>
          </div>
        </>
      )}
    </div>
  );
}

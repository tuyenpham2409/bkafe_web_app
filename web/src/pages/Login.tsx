import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';

const Req = () => <span className="req">*</span>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="card auth-card">
      {error && <div className="alert alert-danger">{error}</div>}

      <h2 className="auth-title">Đăng nhập BKafe</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Tên đăng nhập (MSSV) hoặc Email <Req />
          </label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="form-input"
            placeholder="20233885 hoặc sv@sis.hust.edu.vn"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Mật khẩu <Req />
          </label>
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
          style={{ width: '100%', padding: '12px', marginTop: '8px' }}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <div className="auth-footer">
        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
      </div>
    </div>
  );
}

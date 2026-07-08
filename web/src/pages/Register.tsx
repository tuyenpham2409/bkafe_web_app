import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';

const Req = () => <span className="req">*</span>;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ username: username.trim(), displayName: displayName.trim(), email: email.trim(), password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2 className="auth-title">Đăng ký tài khoản BKafe</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tên đăng nhập (username/MSSV) <Req /></label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            placeholder="Ví dụ: 20233885"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tên hiển thị <Req /></label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="form-input"
            placeholder="Ví dụ: Phạm Minh Tuyên"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Email <Req /></label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="sv@sis.hust.edu.vn"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Mật khẩu <Req /></label>
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
          <p style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: '600', marginTop: '4px' }}>Tối thiểu 6 ký tự.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
          style={{ width: '100%', padding: '12px', marginTop: '8px' }}
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
      <div className="auth-footer">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </div>
    </div>
  );
}

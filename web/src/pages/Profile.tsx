import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import PasswordInput from '../components/PasswordInput';
import { User as UserIcon, Calendar, Edit2, Check, X, Camera, Settings, KeyRound, AtSign } from 'lucide-react';

// Resize an image file to a small square base64 data URL (no external storage needed).
function resizeImageToDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');

  const isOwn = user?.id === id;

  const load = async () => {
    setLoading(true);
    try {
      const [p, ps] = await Promise.all([api.get(`/users/${id}`), api.get(`/posts?author=${id}`)]);
      setProfile(p); setPosts(ps);
      setEditName(p.displayName); setEditBio(p.bio || '');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !isOwn) return;
    if (!file.type.startsWith('image/')) return alert('Vui lòng chọn tệp ảnh.');
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      await api.put('/users/me', { photoURL: dataUrl });
      setProfile((p: any) => ({ ...p, photoURL: dataUrl }));
      await refreshUser();
    } catch { alert('Lỗi khi tải ảnh.'); } finally { setAvatarUploading(false); }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return alert('Tên hiển thị không được để trống.');
    try {
      await api.put('/users/me', { displayName: editName.trim(), bio: editBio.trim() });
      setProfile((p: any) => ({ ...p, displayName: editName.trim(), bio: editBio.trim() }));
      setIsEditing(false); await refreshUser();
    } catch (err: any) { alert(err.message); }
  };

  const changeUsername = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    try {
      const r = await api.put('/auth/username', { username: newUsername.trim() });
      setProfile((p: any) => ({ ...p, username: r.user.username, usernameChanged: true }));
      setNewUsername(''); setMsg('✅ Đã đổi tên đăng nhập.'); await refreshUser();
    } catch (err: any) { setMsg('❌ ' + err.message); }
  };
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    try {
      await api.put('/auth/password', { currentPassword: curPw, newPassword: newPw });
      setCurPw(''); setNewPw(''); setMsg('✅ Đã đổi mật khẩu.');
    } catch (err: any) { setMsg('❌ ' + err.message); }
  };

  if (loading) return <div className="text-center" style={{ padding: '48px 0', color: 'var(--slate-500)', fontWeight: '700' }}>Đang tải hồ sơ...</div>;
  if (!profile) return <div className="text-center" style={{ padding: '48px 0', color: 'var(--slate-500)', fontWeight: '700' }}>Không tìm thấy người dùng này.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div className="relative" style={{ flexShrink: 0, margin: '0 auto' }}>
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="" className="profile-large-avatar" />
            ) : (
              <div className="profile-large-avatar-placeholder">{profile.displayName?.charAt(0).toUpperCase() || 'U'}</div>
            )}
            {isOwn && (
              <label
                className="btn btn-primary btn-circle"
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '32px',
                  height: '32px',
                  border: '2px solid var(--white)',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-md)',
                }}
                title="Đổi ảnh đại diện"
              >
                {avatarUploading ? (
                  <span className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'var(--white)', borderRadius: '50%' }} />
                ) : (
                  <Camera size={16} />
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} disabled={avatarUploading} />
              </label>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            {isEditing ? (
              <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} required placeholder="Tên hiển thị" className="form-input" />
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} placeholder="Giới thiệu ngắn về bạn..." className="form-textarea" />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', boxShadow: 'none' }}><X size={14} /> Hủy</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}><Check size={14} /> Lưu</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--slate-900)' }}>{profile.displayName}</h1>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate-400)', marginTop: '2px' }}>@{profile.username}</div>
                  </div>
                  {isOwn && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', display: 'inline-flex', gap: '6px', boxShadow: 'none' }}><Edit2 size={14} /> Sửa hồ sơ</button>
                      <button onClick={() => setShowSettings((s) => !s)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', display: 'inline-flex', gap: '6px', boxShadow: 'none' }}><Settings size={14} /> Cài đặt</button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--slate-500)', fontWeight: '600', paddingTop: '4px' }}>
                  <span className="badge badge-slate" style={{ padding: '4px 10px', display: 'inline-flex', gap: '6px', textTransform: 'none' }}>
                    <UserIcon size={14} style={{ color: 'var(--slate-400)' }} />
                    {profile.role === 'admin' ? 'Quản trị viên' : 'Sinh viên HUST'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: 'var(--slate-400)' }} />
                    Tham gia: {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('vi-VN') : '—'}
                  </span>
                  {isOwn && <span style={{ color: 'var(--slate-400)' }}>({profile.email})</span>}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--slate-600)', fontStyle: 'italic', fontWeight: '500', paddingTop: '8px' }}>{profile.bio || 'Chưa có lời tự giới thiệu.'}</p>
              </>
            )}
          </div>
        </div>

        {/* Account settings (own profile) */}
        {isOwn && showSettings && !isEditing && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--slate-100)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {msg && <div className="alert alert-success" style={{ gridColumn: 'span 2' }}>{msg}</div>}
            <form onSubmit={changeUsername} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: '6px' }}><AtSign size={16} style={{ color: 'var(--primary-blue)' }} /> Đổi tên đăng nhập</h3>
              {profile.usernameChanged ? (
                <p className="alert alert-danger" style={{ fontSize: '12px', padding: '8px 12px' }}>Bạn đã đổi tên đăng nhập một lần và không thể đổi lại.</p>
              ) : (
                <>
                  <p style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: '600' }}>Chỉ được đổi <b>duy nhất một lần</b>.</p>
                  <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Tên đăng nhập mới" required className="form-input" />
                  <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px', alignSelf: 'flex-start' }}>Đổi username</button>
                </>
              )}
            </form>
            <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: '6px' }}><KeyRound size={16} style={{ color: 'var(--primary-blue)' }} /> Đổi mật khẩu</h3>
              <PasswordInput value={curPw} onChange={setCurPw} placeholder="Mật khẩu hiện tại" autoComplete="current-password" />
              <PasswordInput value={newPw} onChange={setNewPw} placeholder="Mật khẩu mới" autoComplete="new-password" />
              <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px', alignSelf: 'flex-start' }}>Đổi mật khẩu</button>
            </form>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="card">
        <h2 className="forum-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Câu hỏi đã đăng ({posts.length})</h2>
        <div className="post-list">
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="card post-card" style={{ display: 'block', textDecoration: 'none', padding: '16px', border: '1px solid var(--slate-100)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                <h3 className="post-card-title" style={{ fontSize: '16px' }}>
                  {post.title?.trim() || post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '')}
                </h3>
                {post.status !== 'approved' && (
                  <span className="badge" style={{
                    fontSize: '10px',
                    textTransform: 'none',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    border: '1px solid',
                    backgroundColor: post.status === 'pending' ? 'var(--amber-light)' : 'var(--red-light)',
                    borderColor: post.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: post.status === 'pending' ? 'var(--amber-dark)' : 'var(--red-dark)'
                  }}>
                    {post.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}
                  </span>
                )}
              </div>
              <p className="post-card-body line-clamp-2" style={{ marginBottom: '12px' }}>{post.content}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontWeight: '700', color: 'var(--slate-400)' }}>
                <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                <span>·</span>
                <span>{post.views || 0} lượt xem</span>
                <span>·</span>
                <span>{post.ratingCount > 0 ? `${post.ratingAvg.toFixed(1)}★` : 'Chưa đánh giá'}</span>
              </div>
            </Link>
          ))}
          {posts.length === 0 && <div className="text-center" style={{ padding: '32px 0', color: 'var(--slate-400)', fontWeight: '700', fontSize: '14px' }}>Chưa đăng câu hỏi nào.</div>}
        </div>
      </div>
    </div>
  );
}

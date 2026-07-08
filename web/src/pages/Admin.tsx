import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  Eye, CheckCircle, Clock, MessageSquare, Users, Trash2, ShieldCheck,
  UserPlus, ExternalLink, Search, ChevronLeft, XCircle, SlidersHorizontal,
  FileText, AlertCircle,
} from 'lucide-react';

const REJECT_REASONS = [
  'Nội dung không phù hợp thuần phong mỹ tục',
  'Spam hoặc quảng cáo',
  'Sai chủ đề',
  'Nội dung chưa rõ ràng, thiếu thông tin',
  'Vi phạm quy định cộng đồng HUST',
];

function relativeTime(date: string | Date | undefined): string {
  if (!date) return 'Chưa xác định';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000); // seconds
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function userActiveTime(date: string | Date | undefined): string {
  if (!date) return 'Chưa có lịch sử';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000); // seconds
  if (diff < 60) return 'Đang hoạt động';
  if (diff < 3600) return `Hoạt động ${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `Hoạt động ${Math.floor(diff / 3600)} giờ trước`;
  return `Hoạt động ${Math.floor(diff / 86400)} ngày trước`;
}

function displayTitle(post: any) {
  return post.title?.trim() || post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '');
}

// ─── Reject Modal ─────────────────────────────────────────
function RejectModal({ onConfirm, onClose, title = 'Từ chối duyệt câu hỏi' }: { onConfirm: (r: string) => void; onClose: () => void; title?: string }) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [custom, setCustom] = useState('');
  const finalReason = custom.trim() || reason;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '448px' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontWeight: '900', color: 'var(--slate-900)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <XCircle size={20} style={{ color: 'var(--red)' }} /> {title}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: '600', marginBottom: '12px' }}>Chọn lý do (sẽ gửi thông báo cho người đăng):</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {REJECT_REASONS.map((r) => (
            <label
              key={r}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '12px',
                border: reason === r && !custom ? '2px solid var(--primary-blue)' : '1px solid var(--slate-200)',
                backgroundColor: reason === r && !custom ? 'var(--primary-light)' : 'var(--white)',
                color: reason === r && !custom ? 'var(--primary-dark)' : 'var(--slate-700)',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <input type="radio" name="reason" checked={reason === r && !custom} onChange={() => { setReason(r); setCustom(''); }} />
              {r}
            </label>
          ))}
          <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Hoặc nhập lý do khác..." className="form-input" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ boxShadow: 'none' }}>Hủy</button>
          <button onClick={() => onConfirm(finalReason)} className="btn btn-danger">Xác nhận từ chối</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────
function DeleteModal({ onConfirm, onClose, label = 'câu hỏi' }: { onConfirm: (r: string) => void; onClose: () => void; label?: string }) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '448px' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontWeight: '900', color: 'var(--slate-900)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={20} style={{ color: 'var(--red)' }} /> Xoá {label}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: '600', marginBottom: '12px' }}>Lý do xoá (tùy chọn):</p>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do xoá..." className="form-input" style={{ marginBottom: '16px' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ boxShadow: 'none' }}>Hủy</button>
          <button onClick={() => onConfirm(reason)} className="btn btn-danger">Xác nhận xoá</button>
        </div>
      </div>
    </div>
  );
}

// ─── Ban Modal ───────────────────────────────────────────
function BanModal({ user, onConfirm, onClose }: { user: any; onConfirm: (bannedPosting: boolean, bannedCommenting: boolean, reason: string) => void; onClose: () => void }) {
  const [bannedPosting, setBannedPosting] = useState(user.bannedPosting ?? false);
  const [bannedCommenting, setBannedCommenting] = useState(user.bannedCommenting ?? false);
  const [reason, setReason] = useState('');
  const isUnlocking = !bannedPosting && !bannedCommenting;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '448px' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontWeight: '900', color: 'var(--slate-900)', marginBottom: '4px' }}>Hạn chế hoạt động: {user.displayName}</h3>
        <p style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: '600', marginBottom: '16px' }}>Chọn quyền cần hạn chế. Bỏ chọn để mở khóa.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid var(--slate-200)', cursor: 'pointer', backgroundColor: 'var(--white)', transition: 'var(--transition-base)' }}>
            <input type="checkbox" checked={bannedPosting} onChange={(e) => setBannedPosting(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--red)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate-900)' }}>Đăng bài</div>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Không được đăng câu hỏi mới</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid var(--slate-200)', cursor: 'pointer', backgroundColor: 'var(--white)', transition: 'var(--transition-base)' }}>
            <input type="checkbox" checked={bannedCommenting} onChange={(e) => setBannedCommenting(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--red)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate-900)' }}>Bình luận</div>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Không được bình luận và trả lời</div>
            </div>
          </label>
        </div>
        {!isUnlocking && (
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do hạn chế (sẽ gửi thông báo)" className="form-input" style={{ marginBottom: '16px' }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ boxShadow: 'none' }}>Hủy</button>
          <button onClick={() => onConfirm(bannedPosting, bannedCommenting, reason)} className={`btn ${isUnlocking ? 'btn-primary' : 'btn-danger'}`} style={{ backgroundColor: isUnlocking ? 'var(--green)' : 'var(--red)' }}>
            {isUnlocking ? 'Mở khóa' : 'Xác nhận hạn chế'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section: User Management ─────────────────────────────
function UsersSection({ onBack }: { onBack: () => void }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [nu, setNu] = useState({ username: '', displayName: '', email: '', password: '', role: 'user' });
  const [banTarget, setBanTarget] = useState<any | null>(null);

  useEffect(() => { api.get('/users').then(setUsers).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = users
    .filter((u) => {
      const qLow = q.toLowerCase();
      return (!qLow || u.displayName?.toLowerCase().includes(qLow) || u.username?.toLowerCase().includes(qLow) || u.email?.toLowerCase().includes(qLow))
        && (roleFilter === 'all' || u.role === roleFilter);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return +new Date(b.joinedAt) - +new Date(a.joinedAt);
      if (sortBy === 'oldest') return +new Date(a.joinedAt) - +new Date(b.joinedAt);
      if (sortBy === 'active') return +new Date(b.lastActiveAt || 0) - +new Date(a.lastActiveAt || 0);
      return 0;
    });

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await api.post('/users', nu); setUsers((us) => [r.user, ...us]); setNu({ username: '', displayName: '', email: '', password: '', role: 'user' }); }
    catch (err: any) { alert(err.message); }
  };
  const setRole = async (id: string, role: string) => { const r = await api.put(`/users/${id}`, { role }); setUsers((us) => us.map((u) => u.id === id ? r.user : u)); };
  const resetPw = async (id: string) => { const pw = prompt('Mật khẩu mới cho người dùng:'); if (!pw) return; await api.put(`/users/${id}`, { password: pw }); alert('Đã đặt lại mật khẩu.'); };
  const delUser = async (id: string) => { if (!confirm('Xoá người dùng này?')) return; try { await api.del(`/users/${id}`); setUsers((us) => us.filter((u) => u.id !== id)); } catch (e: any) { alert(e.message); } };
  const banUserFn = async (bannedPosting: boolean, bannedCommenting: boolean, reason: string) => {
    if (!banTarget) return;
    try {
      const r = await api.patch(`/users/${banTarget.id}/ban`, { bannedPosting, bannedCommenting, reason });
      setUsers((us) => us.map((u) => u.id === banTarget.id ? { ...u, bannedPosting: r.bannedPosting, bannedCommenting: r.bannedCommenting, banReason: r.banReason } : u));
      setBanTarget(null);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <button onClick={onBack} className="btn-icon"><ChevronLeft size={20} /></button>
        <h2 className="forum-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={24} style={{ color: 'var(--primary-blue)' }} /> Quản lý tài khoản ({filtered.length})
        </h2>
      </div>

      {/* Add user form */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--slate-100)', backgroundColor: 'var(--slate-50)', fontSize: '12px', fontWeight: '900', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thêm tài khoản mới</div>
        <form onSubmit={addUser} style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', alignItems: 'end' }}>
          <input required placeholder="Username *" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} className="form-input" />
          <input required placeholder="Tên hiển thị *" value={nu.displayName} onChange={(e) => setNu({ ...nu, displayName: e.target.value })} className="form-input" />
          <input required type="email" placeholder="Email *" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} className="form-input" />
          <input required placeholder="Mật khẩu *" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} className="form-input" />
          <select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })} className="form-select"><option value="user">User</option><option value="admin">Admin</option></select>
          <button className="btn btn-primary" style={{ padding: '8px 16px', height: '38px' }}><UserPlus size={16} /> Thêm</button>
        </form>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div className="search-container" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} className="search-icon" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, username, email..." className="search-input" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-select" style={{ width: 'auto', fontWeight: '700' }}>
            <option value="all">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select" style={{ width: 'auto', fontWeight: '700' }}>
            <option value="newest">Mới tham gia</option>
            <option value="oldest">Cũ nhất</option>
            <option value="active">Hoạt động gần đây</option>
          </select>
        </div>
      </div>

      {/* User list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ color: 'var(--slate-400)', fontWeight: '700', fontSize: '14px', padding: '32px', textAlign: 'center' }}>Đang tải...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((u) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: '1px solid var(--slate-100)', flexWrap: 'wrap' }}>
                {u.photoURL ? <img src={u.photoURL} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--slate-200)', flexShrink: 0 }} /> : <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px', flexShrink: 0 }}>{u.displayName?.charAt(0).toUpperCase()}</div>}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {u.displayName} <span style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: '600' }}>@{u.username}</span>
                    {u.bannedPosting && <span className="badge badge-red" style={{ fontSize: '9px', padding: '2px 6px', textTransform: 'none' }}>Khóa đăng bài</span>}
                    {u.bannedCommenting && <span className="badge badge-amber" style={{ fontSize: '9px', padding: '2px 6px', textTransform: 'none' }}>Khóa bình luận</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span>{u.email}</span>
                    <span>·</span>
                    <span style={{ color: u.lastActiveAt && (Math.floor((Date.now() - new Date(u.lastActiveAt).getTime()) / 1000) < 60) ? 'var(--green)' : 'var(--slate-400)', fontWeight: u.lastActiveAt && (Math.floor((Date.now() - new Date(u.lastActiveAt).getTime()) / 1000) < 60) ? '900' : '600' }}>
                      {userActiveTime(u.lastActiveAt)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)} className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', fontWeight: '700' }}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => resetPw(u.id)} className="btn-link" style={{ fontSize: '12px', padding: '4px 8px' }}>Đặt lại MK</button>
                  {u.id !== me?.id && u.role !== 'admin' && (
                    <button
                      onClick={() => setBanTarget(u)}
                      className="btn"
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        backgroundColor: u.bannedPosting || u.bannedCommenting ? 'var(--green-light)' : 'var(--amber-light)',
                        borderColor: u.bannedPosting || u.bannedCommenting ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: u.bannedPosting || u.bannedCommenting ? 'var(--green)' : 'var(--amber)',
                        boxShadow: 'none',
                      }}
                    >
                      {u.bannedPosting || u.bannedCommenting ? 'Mở khóa' : 'Hạn chế'}
                    </button>
                  )}
                  {u.id !== me?.id && (
                    <button onClick={() => delUser(u.id)} className="btn-icon btn-icon-danger" style={{ padding: '6px' }}><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ color: 'var(--slate-400)', fontWeight: '700', fontSize: '14px', padding: '32px', textAlign: 'center' }}>Không tìm thấy tài khoản nào.</div>}
          </div>
        )}
      </div>
      {banTarget && <BanModal user={banTarget} onConfirm={banUserFn} onClose={() => setBanTarget(null)} />}
    </div>
  );
}

// ─── Section: Post Management ─────────────────────────────
function PostsSection({ onBack }: { onBack: () => void }) {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/posts?status=pending'),
      api.get('/posts?status=approved'),
      api.get('/posts?status=rejected'),
    ]).then(([pend, appr, rej]) => {
      setAllPosts([...pend, ...appr, ...rej].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const tabPosts = allPosts
    .filter((p) => {
      if (activeTab === 'pending') return p.status === 'pending';
      if (activeTab === 'approved') return p.status === 'approved';
      return true;
    })
    .filter((p) => {
      const qL = q.toLowerCase();
      return !qL || displayTitle(p).toLowerCase().includes(qL) || p.authorName?.toLowerCase().includes(qL);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sortBy === 'oldest') return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      return 0;
    });

  const approve = async (id: string) => { const p = await api.patch(`/posts/${id}/approve`); setAllPosts((ps) => ps.map((x) => x.id === id ? { ...x, ...p } : x)); window.dispatchEvent(new Event('bkafe-posts-changed')); };
  const reject = async (id: string, reason: string) => { const p = await api.patch(`/posts/${id}/reject`, { reason }); setAllPosts((ps) => ps.map((x) => x.id === id ? { ...x, ...p } : x)); setRejectTarget(null); window.dispatchEvent(new Event('bkafe-posts-changed')); };
  const delPost = async (id: string, reason?: string) => { await api.del(`/posts/${id}`, reason ? { reason } : undefined); setAllPosts((ps) => ps.filter((x) => x.id !== id)); setDeleteTarget(null); window.dispatchEvent(new Event('bkafe-posts-changed')); };

  const pending = allPosts.filter((p) => p.status === 'pending').length;
  const approved = allPosts.filter((p) => p.status === 'approved').length;

  const btnTabStyle = (active: boolean) => ({
    padding: '6px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'var(--transition-base)',
    backgroundColor: active ? 'var(--white)' : 'transparent',
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
    color: active ? 'var(--slate-900)' : 'var(--slate-500)',
    cursor: 'pointer',
  } as React.CSSProperties);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <button onClick={onBack} className="btn-icon"><ChevronLeft size={20} /></button>
        <h2 className="forum-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={24} style={{ color: 'var(--primary-blue)' }} /> Quản lý câu hỏi
        </h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--slate-100)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {([['all', `Tất cả (${allPosts.length})`], ['pending', `Chờ duyệt (${pending})`], ['approved', `Đã duyệt (${approved})`]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setActiveTab(val)} style={btnTabStyle(activeTab === val)}>{label}</button>
        ))}
      </div>

      {/* Search + sort */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div className="search-container" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} className="search-icon" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tiêu đề, tác giả..." className="search-input" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={16} style={{ color: 'var(--slate-400)' }} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select" style={{ width: 'auto', fontWeight: '700' }}>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="views">Nhiều lượt xem</option>
          </select>
        </div>
      </div>

      {/* Post list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ color: 'var(--slate-400)', fontWeight: '700', fontSize: '14px', padding: '32px', textAlign: 'center' }}>Đang tải...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tabPosts.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px', borderBottom: '1px solid var(--slate-100)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span className="badge" style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      border: '1px solid',
                      textTransform: 'none',
                      backgroundColor: p.status === 'approved' ? 'var(--green-light)' : p.status === 'pending' ? 'var(--amber-light)' : 'var(--red-light)',
                      borderColor: p.status === 'approved' ? 'rgba(34,197,94,0.15)' : p.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: p.status === 'approved' ? 'var(--green)' : p.status === 'pending' ? 'var(--amber-dark)' : 'var(--red-dark)'
                    }}>
                      {p.status === 'approved' ? 'Đã duyệt' : p.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: '600' }}>{p.authorName} · {p.views || 0} xem · {relativeTime(p.createdAt)}</span>
                  </div>
                  <Link to={`/post/${p.id}`} style={{ fontWeight: '900', color: 'var(--slate-900)', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }} className="hover-underline">
                    {displayTitle(p)} <ExternalLink size={12} style={{ color: 'var(--slate-300)' }} />
                  </Link>
                  <p style={{ color: 'var(--slate-500)', fontSize: '12px', marginTop: '2px' }} className="line-clamp-1">{p.content}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {p.status === 'pending' && <button onClick={() => approve(p.id)} className="btn-icon" style={{ color: 'var(--green)' }} title="Duyệt"><CheckCircle size={16} /></button>}
                  {p.status === 'pending' && <button onClick={() => setRejectTarget(p.id)} className="btn-icon" style={{ color: 'var(--amber)' }} title="Từ chối"><XCircle size={16} /></button>}
                  {p.status === 'rejected' && <button onClick={() => approve(p.id)} className="btn-icon" style={{ color: 'var(--green)' }} title="Duyệt lại"><CheckCircle size={16} /></button>}
                  <button onClick={() => setDeleteTarget(p.id)} className="btn-icon btn-icon-danger" title="Xoá"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {tabPosts.length === 0 && <div style={{ color: 'var(--slate-400)', fontWeight: '700', fontSize: '12px', padding: '32px', textAlign: 'center' }}>Không có câu hỏi nào.</div>}
          </div>
        )}
      </div>

      {rejectTarget && <RejectModal onConfirm={(r) => reject(rejectTarget, r)} onClose={() => setRejectTarget(null)} />}
      {deleteTarget && <DeleteModal label="câu hỏi (thông báo sẽ được gửi cho tác giả)" onConfirm={(r) => delPost(deleteTarget, r)} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ─── Section: Comment Management ─────────────────────────
function CommentsSection({ onBack }: { onBack: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => { api.get('/comments').then(setComments).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = comments
    .filter((c) => {
      const qL = q.toLowerCase();
      return !qL || c.content?.toLowerCase().includes(qL) || c.authorName?.toLowerCase().includes(qL);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sortBy === 'oldest') return +new Date(a.createdAt) - +new Date(b.createdAt);
      return 0;
    });

  const delComment = async (id: string) => { if (!confirm('Xoá bình luận này?')) return; await api.del(`/comments/${id}`); setComments((cs) => cs.filter((c) => c.id !== id)); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <button onClick={onBack} className="btn-icon"><ChevronLeft size={20} /></button>
        <h2 className="forum-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={24} style={{ color: 'var(--primary-blue)' }} /> Quản lý bình luận ({filtered.length})
        </h2>
      </div>

      {/* Search + sort */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div className="search-container" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} className="search-icon" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo nội dung, tác giả..." className="search-input" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={16} style={{ color: 'var(--slate-400)' }} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select" style={{ width: 'auto', fontWeight: '700' }}>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ color: 'var(--slate-400)', fontWeight: '700', fontSize: '14px', padding: '32px', textAlign: 'center' }}>Đang tải...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '16px', borderBottom: '1px solid var(--slate-100)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}><span style={{ fontWeight: '900', color: 'var(--slate-900)' }}>{c.authorName}</span> <span style={{ color: 'var(--slate-400)' }}>({c.authorEmail})</span></div>
                  <p style={{ color: 'var(--slate-700)', fontSize: '12px', marginTop: '2px', whiteSpace: 'pre-wrap' }} className="line-clamp-3">{c.content}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--slate-400)', fontWeight: '600' }}>{relativeTime(c.createdAt)}</span>
                    <Link to={`/post/${c.postId}`} style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary-blue)', textDecoration: 'none' }} className="hover-underline">Xem bài →</Link>
                  </div>
                </div>
                <button onClick={() => delComment(c.id)} className="btn-icon btn-icon-danger" style={{ padding: '6px' }} title="Xoá"><Trash2 size={16} /></button>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ color: 'var(--slate-400)', fontWeight: '700', fontSize: '12px', padding: '32px', textAlign: 'center' }}>Không có bình luận nào.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────
type AdminView = 'dashboard' | 'users' | 'posts' | 'comments';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AdminView>('dashboard');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    api.get('/stats').then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  if (loading || authLoading) return <div className="text-center" style={{ padding: '48px 0', color: 'var(--slate-500)', fontWeight: '700' }}>Đang tải trang quản trị...</div>;

  if (view === 'users') return <UsersSection onBack={() => setView('dashboard')} />;
  if (view === 'posts') return <PostsSection onBack={() => setView('dashboard')} />;
  if (view === 'comments') return <CommentsSection onBack={() => setView('dashboard')} />;

  const kpis = [
    { label: 'Lượt xem trang', value: stats?.totalViews ?? 0, icon: Eye, color: 'blue', desc: 'Tính theo số phiên trình duyệt truy cập.' },
    { label: 'Đang truy cập', value: stats?.activeUsers ?? 1, icon: Users, color: 'rose', desc: 'Thành viên hoạt động 5 phút qua.' },
    { label: 'Người dùng', value: stats?.users ?? 0, icon: Users, color: 'indigo', onClick: () => setView('users') },
    { label: 'Chờ duyệt', value: stats?.pendingPosts ?? 0, icon: Clock, color: 'amber', onClick: () => setView('posts') },
    { label: 'Bài đã duyệt', value: stats?.approvedPosts ?? 0, icon: CheckCircle, color: 'green', onClick: () => setView('posts') },
    { label: 'Bình luận', value: stats?.comments ?? 0, icon: MessageSquare, color: 'indigo', onClick: () => setView('comments') },
  ];

  const colorStyles: any = {
    blue: { backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)' },
    rose: { backgroundColor: 'var(--red-light)', color: 'var(--red)' },
    green: { backgroundColor: 'var(--green-light)', color: 'var(--green)' },
    amber: { backgroundColor: 'var(--amber-light)', color: 'var(--amber)' },
    indigo: { backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)' }
  };

  const sections = [
    { key: 'users' as AdminView, icon: Users, label: 'Quản lý tài khoản', desc: 'Thêm, sửa, xoá và phân quyền tài khoản người dùng.', color: 'blue', badge: stats?.users },
    { key: 'posts' as AdminView, icon: FileText, label: 'Quản lý câu hỏi', desc: 'Duyệt, từ chối và quản lý tất cả câu hỏi trên hệ thống.', color: 'indigo', badge: stats?.pendingPosts, badgeLabel: 'chờ duyệt', badgeColor: 'amber' },
    { key: 'comments' as AdminView, icon: MessageSquare, label: 'Quản lý bình luận', desc: 'Xem và xoá các bình luận vi phạm quy định.', color: 'indigo', badge: stats?.comments },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card">
        <h1 className="forum-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={28} style={{ color: 'var(--red)' }} /> Trang quản trị
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--slate-400)', fontWeight: '600', marginTop: '4px' }}>
          Chào mừng trở lại, <span style={{ color: 'var(--slate-700)' }}>{user?.displayName}</span>! Click vào các mục bên dưới để quản lý.
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {kpis.map((k) => (
          <button
            key={k.label}
            onClick={k.onClick}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              textDecoration: 'none',
              border: '1px solid var(--slate-200)',
              transition: 'var(--transition-base)',
              textAlign: 'left',
              cursor: k.onClick ? 'pointer' : 'default',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ...(colorStyles[k.color] || { backgroundColor: 'var(--slate-50)', color: 'var(--slate-600)' })
              }}
            >
              <k.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--slate-900)' }}>{k.value}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              {k.desc && <div style={{ fontSize: '10px', color: 'var(--slate-400)', marginTop: '4px', fontWeight: '600', textTransform: 'none', lineHeight: 1.2 }}>{k.desc}</div>}
            </div>
          </button>
        ))}
      </div>

      {/* Section cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setView(s.key)}
            className="card"
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'var(--transition-base)',
              border: '1px solid var(--slate-200)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(colorStyles[s.color] || { backgroundColor: 'var(--slate-50)', color: 'var(--slate-600)' })
                }}
              >
                <s.icon size={24} />
              </div>
              {s.badge !== undefined && s.badge > 0 && (
                <span className="badge" style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid',
                  textTransform: 'none',
                  backgroundColor: s.badgeColor === 'amber' ? 'var(--amber-light)' : 'var(--slate-100)',
                  borderColor: s.badgeColor === 'amber' ? 'rgba(245,158,11,0.15)' : 'var(--slate-200)',
                  color: s.badgeColor === 'amber' ? 'var(--amber-dark)' : 'var(--slate-600)'
                }}>
                  {s.badge} {s.badgeLabel || ''}
                </span>
              )}
            </div>
            <h3 style={{ fontWeight: '900', color: 'var(--slate-900)', fontSize: '16px' }}>{s.label}</h3>
            <p style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: '500', lineHeight: 1.5 }}>{s.desc}</p>
            <div style={{ marginTop: 'auto', fontSize: '12px', fontWeight: '700', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '4px', paddingTop: '8px' }}>
              Mở quản lý <ExternalLink size={12} />
            </div>
          </button>
        ))}
      </div>

      {/* Pending posts alert */}
      {stats?.pendingPosts > 0 && (
        <button
          onClick={() => setView('posts')}
          className="btn"
          style={{
            width: '100%',
            backgroundColor: 'var(--amber-light)',
            borderColor: 'rgba(245,158,11,0.15)',
            border: '1px solid',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: 'none',
            justifyContent: 'flex-start',
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--amber)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '900', color: 'var(--amber-dark)', fontSize: '14px' }}>Có {stats.pendingPosts} câu hỏi đang chờ duyệt</div>
            <div style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: '700' }}>Click để xem và duyệt ngay</div>
          </div>
        </button>
      )}
    </div>
  );
}

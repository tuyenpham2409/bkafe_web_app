import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  Eye, CheckCircle, Clock, MessageSquare, Users, Trash2, ShieldCheck,
  UserPlus, ExternalLink, Search, ChevronLeft, XCircle, SlidersHorizontal,
  FileText, AlertCircle,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────
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

function displayTitle(post: any) {
  return post.title?.trim() || post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '');
}

// ─── Reject Modal ─────────────────────────────────────────
function RejectModal({ onConfirm, onClose, title = 'Từ chối duyệt câu hỏi' }: { onConfirm: (r: string) => void; onClose: () => void; title?: string }) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [custom, setCustom] = useState('');
  const finalReason = custom.trim() || reason;
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" /> {title}</h3>
        <p className="text-xs text-slate-500 font-semibold mb-3">Chọn lý do (sẽ gửi thông báo cho người đăng):</p>
        <div className="space-y-2 mb-3">
          {REJECT_REASONS.map((r) => (
            <label key={r} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm font-semibold ${reason === r && !custom ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
              <input type="radio" name="reason" checked={reason === r && !custom} onChange={() => { setReason(r); setCustom(''); }} />
              {r}
            </label>
          ))}
          <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Hoặc nhập lý do khác..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold">Hủy</button>
          <button onClick={() => onConfirm(finalReason)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">Xác nhận từ chối</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────
function DeleteModal({ onConfirm, onClose, label = 'câu hỏi' }: { onConfirm: (r: string) => void; onClose: () => void; label?: string }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-600" /> Xoá {label}</h3>
        <p className="text-xs text-slate-500 font-semibold mb-3">Lý do xoá (tùy chọn):</p>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do xoá..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 mb-4" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold">Hủy</button>
          <button onClick={() => onConfirm(reason)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">Xác nhận xoá</button>
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
    <div className="fixed inset-0 z-[200] bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-black text-slate-900 mb-1">Hạn chế hoạt động: {user.displayName}</h3>
        <p className="text-xs text-slate-500 font-semibold mb-4">Chọn quyền cần hạn chế. Bỏ chọn để mở khóa.</p>
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input type="checkbox" checked={bannedPosting} onChange={(e) => setBannedPosting(e.target.checked)} className="w-4 h-4 accent-red-600" />
            <div>
              <div className="text-sm font-bold text-slate-900">Đăng bài</div>
              <div className="text-xs text-slate-500">Không được đăng câu hỏi mới</div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input type="checkbox" checked={bannedCommenting} onChange={(e) => setBannedCommenting(e.target.checked)} className="w-4 h-4 accent-red-600" />
            <div>
              <div className="text-sm font-bold text-slate-900">Bình luận</div>
              <div className="text-xs text-slate-500">Không được bình luận và trả lời</div>
            </div>
          </label>
        </div>
        {!isUnlocking && (
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do hạn chế (sẽ gửi thông báo)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 mb-4" />
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold">Hủy</button>
          <button onClick={() => onConfirm(bannedPosting, bannedCommenting, reason)} className={`px-4 py-2 text-white rounded-lg text-sm font-bold ${isUnlocking ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" /> Quản lý tài khoản ({filtered.length})</h2>
      </div>

      {/* Add user form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Thêm tài khoản mới</div>
        <form onSubmit={addUser} className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 items-end">
          <input required placeholder="Username *" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <input required placeholder="Tên hiển thị *" value={nu.displayName} onChange={(e) => setNu({ ...nu, displayName: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <input required type="email" placeholder="Email *" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <input required placeholder="Mật khẩu *" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"><option value="user">User</option><option value="admin">Admin</option></select>
          <button className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"><UserPlus className="w-4 h-4" /> Thêm</button>
        </form>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, username, email..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white" />
        </div>
        <div className="flex gap-2">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none font-bold">
            <option value="all">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none font-bold">
            <option value="newest">Mới tham gia</option>
            <option value="oldest">Cũ nhất</option>
            <option value="active">Hoạt động gần đây</option>
          </select>
        </div>
      </div>

      {/* User list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400 font-bold text-sm">Đang tải...</div> : (
          <div className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <div key={u.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50">
                {u.photoURL ? <img src={u.photoURL} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" /> : <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">{u.displayName?.charAt(0).toUpperCase()}</div>}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-slate-900 truncate flex items-center gap-2 flex-wrap">
                    {u.displayName} <span className="text-slate-400 font-semibold">@{u.username}</span>
                    {u.bannedPosting && <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-red-100 text-red-700 rounded border border-red-200">Khóa đăng bài</span>}
                    {u.bannedCommenting && <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded border border-orange-200">Khóa bình luận</span>}
                  </div>
                  <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                    <span>{u.email}</span>
                    <span className="text-slate-300">·</span>
                    <span className={u.lastActiveAt ? 'text-green-600 font-semibold' : 'text-slate-400'}>
                      {u.lastActiveAt ? `Hoạt động ${relativeTime(u.lastActiveAt)}` : 'Chưa có lịch sử'}
                    </span>
                  </div>
                </div>
                <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)} className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white shrink-0">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => resetPw(u.id)} className="text-xs font-bold text-slate-500 hover:text-blue-600 px-2 shrink-0">Đặt lại MK</button>
                {u.id !== me?.id && u.role !== 'admin' && (
                  <button
                    onClick={() => setBanTarget(u)}
                    className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 border ${
                      u.bannedPosting || u.bannedCommenting
                        ? 'text-green-700 border-green-200 hover:bg-green-50'
                        : 'text-amber-700 border-amber-200 hover:bg-amber-50'
                    }`}
                    title={u.bannedPosting || u.bannedCommenting ? 'Mở khóa' : 'Hạn chế'}
                  >
                    {u.bannedPosting || u.bannedCommenting ? 'Mở khóa' : 'Hạn chế'}
                  </button>
                )}
                {u.id !== me?.id && (
                  <button onClick={() => delUser(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            {filtered.length === 0 && <div className="p-8 text-center text-slate-400 font-bold text-sm">Không tìm thấy tài khoản nào.</div>}
          </div>
        )}
      </div>
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

  const approve = async (id: string) => { const p = await api.patch(`/posts/${id}/approve`); setAllPosts((ps) => ps.map((x) => x.id === id ? { ...x, ...p } : x)); };
  const reject = async (id: string, reason: string) => { const p = await api.patch(`/posts/${id}/reject`, { reason }); setAllPosts((ps) => ps.map((x) => x.id === id ? { ...x, ...p } : x)); setRejectTarget(null); };
  const delPost = async (id: string, reason?: string) => { await api.del(`/posts/${id}`, reason ? { reason } : undefined); setAllPosts((ps) => ps.filter((x) => x.id !== id)); setDeleteTarget(null); };

  const pending = allPosts.filter((p) => p.status === 'pending').length;
  const approved = allPosts.filter((p) => p.status === 'approved').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><FileText className="w-6 h-6 text-indigo-600" /> Quản lý câu hỏi</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([['all', `Tất cả (${allPosts.length})`], ['pending', `Chờ duyệt (${pending})`], ['approved', `Đã duyệt (${approved})`]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setActiveTab(val)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === val ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tiêu đề, tác giả..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white" />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none font-bold">
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="views">Nhiều lượt xem</option>
          </select>
        </div>
      </div>

      {/* Post list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400 font-bold text-sm">Đang tải...</div> : (
          <div className="divide-y divide-slate-100">
            {tabPosts.map((p) => (
              <div key={p.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${p.status === 'approved' ? 'bg-green-50 border-green-100 text-green-700' : p.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                      {p.status === 'approved' ? 'Đã duyệt' : p.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{p.authorName} · {p.views || 0} xem · {relativeTime(p.createdAt)}</span>
                  </div>
                  <Link to={`/post/${p.id}`} className="font-extrabold text-slate-900 text-sm hover:text-blue-600 flex items-center gap-1">
                    {displayTitle(p)} <ExternalLink className="w-3 h-3 text-slate-300" />
                  </Link>
                  <p className="text-slate-500 text-xs line-clamp-1 mt-0.5">{p.content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Pending: [Duyệt] [Từ chối] [Xóa] */}
                  {p.status === 'pending' && <button onClick={() => approve(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Duyệt"><CheckCircle className="w-4 h-4" /></button>}
                  {p.status === 'pending' && <button onClick={() => setRejectTarget(p.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Từ chối"><XCircle className="w-4 h-4" /></button>}
                  {/* Rejected: [Duyệt lại] [Xóa] */}
                  {p.status === 'rejected' && <button onClick={() => approve(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Duyệt lại"><CheckCircle className="w-4 h-4" /></button>}
                  {/* Approved: [Xóa only] */}
                  {/* Delete: always */}
                  <button onClick={() => setDeleteTarget(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Xoá"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {tabPosts.length === 0 && <div className="p-8 text-center text-slate-400 font-bold text-xs">Không có câu hỏi nào.</div>}
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-indigo-600" /> Quản lý bình luận ({filtered.length})</h2>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo nội dung, tác giả..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white" />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none font-bold">
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400 font-bold text-sm">Đang tải...</div> : (
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50">
                <div className="min-w-0">
                  <div className="text-xs font-semibold"><span className="font-extrabold text-slate-900">{c.authorName}</span> <span className="text-slate-400">({c.authorEmail})</span></div>
                  <p className="text-slate-700 text-xs mt-0.5 whitespace-pre-wrap line-clamp-3">{c.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">{relativeTime(c.createdAt)}</span>
                    <Link to={`/post/${c.postId}`} className="text-[10px] font-bold text-blue-500 hover:underline">Xem bài →</Link>
                  </div>
                </div>
                <button onClick={() => delComment(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {filtered.length === 0 && <div className="p-8 text-center text-slate-400 font-bold text-xs">Không có bình luận nào.</div>}
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

  if (loading || authLoading) return <div className="text-center py-12 text-slate-500 font-bold">Đang tải trang quản trị...</div>;

  if (view === 'users') return <UsersSection onBack={() => setView('dashboard')} />;
  if (view === 'posts') return <PostsSection onBack={() => setView('dashboard')} />;
  if (view === 'comments') return <CommentsSection onBack={() => setView('dashboard')} />;

  // Dashboard view
  const kpis = [
    { label: 'Lượt xem trang', value: stats?.totalViews ?? 0, icon: Eye, color: 'blue' },
    { label: 'Bài đã duyệt', value: stats?.approvedPosts ?? 0, icon: CheckCircle, color: 'green', onClick: () => setView('posts') },
    { label: 'Chờ duyệt', value: stats?.pendingPosts ?? 0, icon: Clock, color: 'amber', onClick: () => setView('posts') },
    { label: 'Bình luận', value: stats?.comments ?? 0, icon: MessageSquare, color: 'indigo', onClick: () => setView('comments') },
    { label: 'Người dùng', value: stats?.users ?? 0, icon: Users, color: 'rose', onClick: () => setView('users') },
  ];
  const colorCls: any = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', amber: 'bg-amber-50 text-amber-600', indigo: 'bg-indigo-50 text-indigo-600', rose: 'bg-rose-50 text-rose-600' };

  const sections = [
    { key: 'users' as AdminView, icon: Users, label: 'Quản lý tài khoản', desc: 'Thêm, sửa, xoá và phân quyền tài khoản người dùng.', color: 'blue', badge: stats?.users },
    { key: 'posts' as AdminView, icon: FileText, label: 'Quản lý câu hỏi', desc: 'Duyệt, từ chối và quản lý tất cả câu hỏi trên hệ thống.', color: 'indigo', badge: stats?.pendingPosts, badgeLabel: 'chờ duyệt', badgeColor: 'amber' },
    { key: 'comments' as AdminView, icon: MessageSquare, label: 'Quản lý bình luận', desc: 'Xem và xoá các bình luận vi phạm quy định.', color: 'violet', badge: stats?.comments },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-red-600" /> Trang quản trị</h1>
        <p className="text-sm font-semibold text-slate-400 mt-1">Chào mừng trở lại, <span className="text-slate-700">{user?.displayName}</span>! Click vào các mục bên dưới để quản lý.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <button key={k.label} onClick={k.onClick} className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all text-left ${k.onClick ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : 'cursor-default'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorCls[k.color]}`}><k.icon className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-black text-slate-900">{k.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{k.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s) => (
          <button key={s.key} onClick={() => setView(s.key)} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorCls[s.color] || 'bg-slate-50 text-slate-600'}`}>
                <s.icon className="w-6 h-6" />
              </div>
              {s.badge !== undefined && s.badge > 0 && (
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${s.badgeColor === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                  {s.badge} {s.badgeLabel || ''}
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-blue-600 transition-colors">{s.label}</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">{s.desc}</p>
            <div className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1">
              Mở quản lý <ExternalLink className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      {/* Pending posts alert */}
      {stats?.pendingPosts > 0 && (
        <button onClick={() => setView('posts')} className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-amber-100 transition-colors text-left">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="font-extrabold text-amber-800 text-sm">Có {stats.pendingPosts} câu hỏi đang chờ duyệt</div>
            <div className="text-xs text-amber-600 font-semibold">Click để xem và duyệt ngay</div>
          </div>
        </button>
      )}
    </div>
  );
}

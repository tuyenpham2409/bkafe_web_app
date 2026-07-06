import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Eye, CheckCircle, Clock, MessageSquare, Users, Trash2, ShieldAlert, UserPlus, ExternalLink } from 'lucide-react';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [nu, setNu] = useState({ username: '', displayName: '', email: '', password: '', role: 'user' });

  const postsRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const usersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    Promise.all([
      api.get('/stats'),
      api.get('/posts?status=pending'),
      api.get('/posts?status=approved'),
      api.get('/posts?status=rejected'),
      api.get('/comments'),
      api.get('/users'),
    ]).then(([s, pend, appr, rej, cs, us]) => {
      setStats(s);
      setPosts([...pend, ...appr, ...rej].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
      setComments(cs); setUsers(us);
    }).catch((e) => console.error(e)).finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const approve = async (id: string) => { const p = await api.patch(`/posts/${id}/approve`); setPosts((ps) => ps.map((x) => x.id === id ? { ...x, ...p } : x)); };
  const reject = async (id: string) => { const reason = prompt('Lý do từ chối:', 'Nội dung chưa rõ ràng, thiếu thông tin'); if (!reason) return; const p = await api.patch(`/posts/${id}/reject`, { reason }); setPosts((ps) => ps.map((x) => x.id === id ? { ...x, ...p } : x)); };
  const delPost = async (id: string) => { if (!confirm('Xoá bài viết này?')) return; await api.del(`/posts/${id}`); setPosts((ps) => ps.filter((x) => x.id !== id)); };
  const delComment = async (id: string) => { if (!confirm('Xoá bình luận này?')) return; await api.del(`/comments/${id}`); setComments((cs) => cs.filter((x) => x.id !== id)); };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await api.post('/users', nu); setUsers((us) => [r.user, ...us]); setNu({ username: '', displayName: '', email: '', password: '', role: 'user' }); }
    catch (err: any) { alert(err.message); }
  };
  const setRole = async (id: string, role: string) => { const r = await api.put(`/users/${id}`, { role }); setUsers((us) => us.map((u) => u.id === id ? r.user : u)); };
  const resetPw = async (id: string) => { const pw = prompt('Mật khẩu mới cho người dùng:'); if (!pw) return; await api.put(`/users/${id}`, { password: pw }); alert('Đã đặt lại mật khẩu.'); };
  const delUser = async (id: string) => { if (!confirm('Xoá người dùng này?')) return; try { await api.del(`/users/${id}`); setUsers((us) => us.filter((u) => u.id !== id)); } catch (e: any) { alert(e.message); } };

  if (loading || authLoading) return <div className="text-center py-12 text-slate-500 font-bold">Đang tải bảng điều khiển...</div>;

  const kpis = [
    { label: 'Lượt xem trang', value: stats?.totalViews ?? 0, icon: Eye, color: 'blue', onClick: () => {} },
    { label: 'Bài đã duyệt', value: stats?.approvedPosts ?? 0, icon: CheckCircle, color: 'green', onClick: () => scrollTo(postsRef) },
    { label: 'Bài chờ duyệt', value: stats?.pendingPosts ?? 0, icon: Clock, color: 'amber', onClick: () => scrollTo(postsRef) },
    { label: 'Tổng bình luận', value: stats?.comments ?? 0, icon: MessageSquare, color: 'indigo', onClick: () => scrollTo(commentsRef) },
    { label: 'Người dùng', value: stats?.users ?? 0, icon: Users, color: 'rose', onClick: () => scrollTo(usersRef) },
  ];
  const colorCls: any = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', amber: 'bg-amber-50 text-amber-600', indigo: 'bg-indigo-50 text-indigo-600', rose: 'bg-rose-50 text-rose-600' };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><ShieldAlert className="w-7 h-7 text-red-600" /> Bảng điều khiển quản trị</h1>
        <p className="text-sm font-semibold text-slate-400 mt-1">Bấm vào các thẻ thống kê để cuộn tới khu vực quản lý tương ứng.</p>
      </div>

      {/* KPI cards (clickable → scroll) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <button key={k.label} onClick={k.onClick} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all text-left">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorCls[k.color]}`}><k.icon className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-black text-slate-900">{k.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{k.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Users */}
      <div ref={usersRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-20">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><Users className="w-5 h-5 text-slate-500" /><h2 className="font-extrabold text-slate-900 text-sm">Quản lý tài khoản ({users.length})</h2></div>
        <form onSubmit={addUser} className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 border-b border-slate-100 bg-slate-50/40 items-end">
          <input required placeholder="Username *" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <input required placeholder="Tên hiển thị *" value={nu.displayName} onChange={(e) => setNu({ ...nu, displayName: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <input required type="email" placeholder="Email *" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <input required placeholder="Mật khẩu *" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          <select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"><option value="user">User</option><option value="admin">Admin</option></select>
          <button className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"><UserPlus className="w-4 h-4" /> Thêm</button>
        </form>
        <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {users.map((u) => (
            <div key={u.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50/50">
              {u.photoURL ? <img src={u.photoURL} className="w-9 h-9 rounded-full object-cover border border-slate-200" /> : <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">{u.displayName?.charAt(0).toUpperCase()}</div>}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold text-slate-900 truncate">{u.displayName} <span className="text-slate-400 font-semibold">@{u.username}</span></div>
                <div className="text-xs text-slate-400 truncate">{u.email}</div>
              </div>
              <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)} className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white"><option value="user">User</option><option value="admin">Admin</option></select>
              <button onClick={() => resetPw(u.id)} className="text-xs font-bold text-slate-500 hover:text-blue-600 px-2">Đặt lại MK</button>
              <button onClick={() => delUser(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div ref={postsRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-20">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-slate-500" /><h2 className="font-extrabold text-slate-900 text-sm">Quản lý bài viết ({posts.length})</h2></div>
        <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
          {posts.map((p) => (
            <div key={p.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${p.status === 'approved' ? 'bg-green-50 border-green-100 text-green-700' : p.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700'}`}>{p.status === 'approved' ? 'Đã duyệt' : p.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}</span>
                  <span className="text-xs text-slate-400 font-semibold">{p.authorName} · {p.views || 0} xem</span>
                </div>
                <Link to={`/post/${p.id}`} className="font-extrabold text-slate-900 text-sm hover:text-blue-600 flex items-center gap-1">{p.title} <ExternalLink className="w-3 h-3 text-slate-300" /></Link>
                <p className="text-slate-500 text-xs line-clamp-1 mt-0.5">{p.content}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {p.status !== 'approved' && <button onClick={() => approve(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Duyệt"><CheckCircle className="w-4 h-4" /></button>}
                {p.status !== 'rejected' && <button onClick={() => reject(p.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Từ chối"><Clock className="w-4 h-4" /></button>}
                <button onClick={() => delPost(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Xoá"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <div className="p-8 text-center text-slate-400 font-bold text-xs">Chưa có bài viết nào.</div>}
        </div>
      </div>

      {/* Comments */}
      <div ref={commentsRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-20">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-slate-500" /><h2 className="font-extrabold text-slate-900 text-sm">Quản lý bình luận ({comments.length})</h2></div>
        <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50">
              <div className="min-w-0">
                <div className="text-xs font-semibold"><span className="font-extrabold text-slate-900">{c.authorName}</span> <span className="text-slate-400">({c.authorEmail})</span></div>
                <p className="text-slate-700 text-xs mt-0.5 whitespace-pre-wrap">{c.content}</p>
                <Link to={`/post/${c.postId}`} className="text-[10px] font-bold text-blue-500 hover:underline">Xem bài viết →</Link>
              </div>
              <button onClick={() => delComment(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {comments.length === 0 && <div className="p-8 text-center text-slate-400 font-bold text-xs">Chưa có bình luận nào.</div>}
        </div>
      </div>
    </div>
  );
}

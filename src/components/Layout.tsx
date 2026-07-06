import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  Coffee, LogOut, User as UserIcon, PlusCircle, ShieldAlert,
  Search, Menu, X, Home, Info, BookOpen, ExternalLink, Bell, Hash,
} from 'lucide-react';

interface Topic { slug: string; name: string; }

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ unread: number; items: any[] }>({ unread: 0, items: [] });
  const navigate = useNavigate();

  const load = async () => {
    try { setData(await api.get('/notifications')); } catch { /* ignore */ }
  };
  useEffect(() => { load(); }, []);

  const openMenu = async () => {
    setOpen((o) => !o);
    if (!open) await load();
  };
  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };
  const clickItem = async (n: any) => {
    if (!n.read) await api.patch(`/notifications/${n.id}/read`);
    setOpen(false);
    if (n.link) navigate(n.link);
    load();
  };

  return (
    <div className="relative">
      <button onClick={openMenu} className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all" title="Thông báo">
        <Bell className="w-5 h-5" />
        {data.unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-900">Thông báo</span>
              {data.unread > 0 && <button onClick={markAll} className="text-xs font-bold text-blue-600 hover:underline">Đánh dấu đã đọc</button>}
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
              {data.items.length === 0 && <div className="p-6 text-center text-xs font-bold text-slate-400">Chưa có thông báo nào.</div>}
              {data.items.map((n) => (
                <button key={n.id} onClick={() => clickItem(n)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                    {n.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    api.get('/topics').then(setTopics).catch(() => {});
  }, []);

  // Count one website view per browser session
  useEffect(() => {
    if (!sessionStorage.getItem('bkafe_site_viewed')) {
      sessionStorage.setItem('bkafe_site_viewed', 'true');
      api.post('/stats/view').catch(() => {});
    }
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const activeTopic = location.pathname.startsWith('/topic/') ? params.slug : null;
  const linkCls = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

  const SidebarNav = () => (
    <nav className="flex flex-col gap-1">
      <Link to="/" className={linkCls(location.pathname === '/')}><Home className="w-5 h-5" /> Trang chủ</Link>
      {topics.map((t) => (
        <Link key={t.slug} to={`/topic/${t.slug}`} className={linkCls(activeTopic === t.slug)}>
          <Hash className="w-5 h-5" /> {t.name}
        </Link>
      ))}
      <Link to="/about" className={linkCls(location.pathname === '/about')}><Info className="w-5 h-5" /> Giới thiệu & Liên hệ</Link>
      {user && (
        <Link to={`/profile/${user.id}`} className={linkCls(location.pathname.startsWith('/profile'))}><UserIcon className="w-5 h-5" /> Trang cá nhân</Link>
      )}
      {user?.role === 'admin' && (
        <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${location.pathname === '/admin' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}>
          <ShieldAlert className="w-5 h-5" /> Quản trị viên
        </Link>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-blue-600">
            <Coffee className="w-7 h-7 fill-blue-50" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BKafe</span>
          </Link>

          {location.pathname !== '/login' && location.pathname !== '/register' && (
            <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bài viết, câu hỏi..."
                  className="w-full bg-slate-100 text-sm px-4 py-2.5 pl-10 rounded-full border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </form>
          )}

          <div className="flex items-center gap-2 md:gap-3">
            {user ? (
              <>
                <Link to="/create-post" className="bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-full md:rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-100" title="Đăng câu hỏi">
                  <PlusCircle className="w-5 h-5" />
                  <span className="hidden md:inline">Đăng câu hỏi</span>
                </Link>
                <NotificationBell />
                <Link to={`/profile/${user.id}`} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-slate-100 pl-1 pr-3 py-1 rounded-full border border-slate-200">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">{user.displayName.charAt(0).toUpperCase()}</span>
                  )}
                  <span className="hidden md:inline max-w-[120px] truncate">{user.displayName}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-all" title="Đăng xuất">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-slate-600 hover:text-blue-600 font-semibold text-sm px-3 py-2 transition-colors">Đăng nhập</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100">Đăng ký</Link>
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm pt-16" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white border-b border-slate-200 p-4 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." className="w-full bg-slate-100 text-sm px-4 py-2.5 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </form>
            <SidebarNav />
          </div>
        </div>
      )}

      <div className={`flex-1 w-full max-w-[1400px] mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] ${location.pathname === '/admin' ? '' : 'lg:grid-cols-[240px_1fr_300px]'} gap-6`}>
        <aside className="hidden md:block space-y-6">
          <div className="sticky top-22 space-y-4">
            <SidebarNav />
            <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-100 space-y-3">
              <h4 className="font-extrabold text-sm">Hỏi đáp BKafe</h4>
              <p className="text-xs text-blue-100 leading-relaxed">Nơi sinh viên HUST trao đổi học thuật, chia sẻ kinh nghiệm học tập và đời sống sinh viên.</p>
              <Link to="/create-post" className="block text-center bg-white text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">Đặt câu hỏi ngay</Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0"><Outlet /></main>

        {location.pathname !== '/admin' && (
          <aside className="hidden lg:block space-y-6">
            <div className="sticky top-22 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                  <BookOpen className="w-4 h-4 text-indigo-500" /> Tài nguyên HUST
                </h3>
                <ul className="space-y-2 text-xs font-semibold">
                  <li><a href="https://hust.edu.vn" target="_blank" rel="noreferrer" className="flex items-center justify-between text-slate-600 hover:text-blue-600 p-2 hover:bg-slate-50 rounded-lg transition-all"><span>Trang chủ HUST</span><ExternalLink className="w-3.5 h-3.5 text-slate-400" /></a></li>
                  <li><a href="https://ctt.hust.edu.vn" target="_blank" rel="noreferrer" className="flex items-center justify-between text-slate-600 hover:text-blue-600 p-2 hover:bg-slate-50 rounded-lg transition-all"><span>Cổng thông tin đào tạo (CTT)</span><ExternalLink className="w-3.5 h-3.5 text-slate-400" /></a></li>
                  <li><a href="http://library.hust.edu.vn" target="_blank" rel="noreferrer" className="flex items-center justify-between text-slate-600 hover:text-blue-600 p-2 hover:bg-slate-50 rounded-lg transition-all"><span>Thư viện Tạ Quang Bửu</span><ExternalLink className="w-3.5 h-3.5 text-slate-400" /></a></li>
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-[1400px] mx-auto px-4 text-center text-xs text-slate-500 font-medium">&copy; {new Date().getFullYear()} BKafe</div>
      </footer>
    </div>
  );
}

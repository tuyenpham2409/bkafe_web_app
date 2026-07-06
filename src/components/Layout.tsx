import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { 
  Coffee, LogOut, User as UserIcon, PlusCircle, ShieldAlert, 
  Search, Menu, X, Home, Info, BookOpen, ExternalLink, BarChart2 
} from 'lucide-react';

export default function Layout() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ views: 0, posts: 0, comments: 0 });

  // Track global views (session-based to prevent double-counting on quick reloads)
  useEffect(() => {
    const trackView = async () => {
      const hasViewed = sessionStorage.getItem('bkafe_site_viewed');
      if (!hasViewed) {
        sessionStorage.setItem('bkafe_site_viewed', 'true');
        try {
          await addDoc(collection(db, 'comments'), {
            postId: 'global-stats',
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Error updating system stats:", e);
        }
      }
    };
    trackView();
  }, []);

  // Fetch website stats for the right sidebar
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Read views (count of comment documents with postId == 'global-stats')
        const viewsQuery = query(collection(db, 'comments'), where('postId', '==', 'global-stats'));
        const viewsSnap = await getDocs(viewsQuery);
        const viewsVal = 2450 + viewsSnap.size; // 2450 base views + new guest views
        
        // Read post count
        const postsSnap = await getDocs(collection(db, 'posts'));
        // Count only approved posts for user stats
        const postsVal = postsSnap.docs.filter(d => d.data().status === 'approved').length;
        
        // Read comment count (excluding global-stats documents)
        const commentsSnap = await getDocs(collection(db, 'comments'));
        const commentsVal = commentsSnap.docs.filter(d => d.data().postId !== 'global-stats').length;
        
        setStats({ views: viewsVal, posts: postsVal, comments: commentsVal });
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };
    fetchStats();
    // Refresh stats when location changes (page navigates)
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-blue-600">
            <Coffee className="w-7 h-7 fill-blue-50" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BKafe</span>
          </Link>
          
          {/* Search Bar */}
          {location.pathname !== '/login' && location.pathname !== '/register' && (
            <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm bài viết, tài liệu, người dùng..."
                  className="w-full bg-slate-100 text-sm px-4 py-2.5 pl-10 rounded-full border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </form>
          )}

          {/* Actions / Auth */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <Link 
                  to="/create-post" 
                  className="bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-full md:rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-100"
                  title="Tạo bài viết"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="hidden md:inline">Đăng câu hỏi</span>
                </Link>
                {userData?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors hidden md:flex items-center gap-1.5 font-semibold text-sm"
                    title="Bảng quản trị"
                  >
                    <ShieldAlert className="w-5 h-5" />
                    <span className="hidden lg:inline">Quản trị</span>
                  </Link>
                )}
                <Link 
                  to={`/profile/${currentUser.uid}`} 
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span className="hidden md:inline max-w-[120px] truncate">{userData?.displayName || currentUser.email}</span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-all"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-slate-600 hover:text-blue-600 font-semibold text-sm px-3 py-2 transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100">
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search/Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm pt-16 animate-in fade-in duration-200">
          <div className="bg-white border-b border-slate-200 p-4 space-y-4 shadow-xl">
            {location.pathname !== '/login' && location.pathname !== '/register' && (
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full bg-slate-100 text-sm px-4 py-2.5 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </form>
            )}
            
            <nav className="flex flex-col gap-2 font-medium">
              <Link to="/" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-700">
                <Home className="w-5 h-5 text-slate-400" /> Trang chủ
              </Link>
              <Link to="/about" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-700">
                <Info className="w-5 h-5 text-slate-400" /> Giới thiệu & Liên hệ
              </Link>
              {currentUser && (
                <Link to="/create-post" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-700">
                  <PlusCircle className="w-5 h-5 text-slate-400" /> Đăng câu hỏi
                </Link>
              )}
              {userData?.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-3 p-3 hover:bg-red-50 text-red-700 rounded-xl transition-colors">
                  <ShieldAlert className="w-5 h-5 text-red-500" /> Bảng quản trị (Admin)
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main Grid Wrapper */}
      <div className={`flex-1 w-full max-w-[1400px] mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[200px_1fr] ${location.pathname === '/admin' ? '' : 'lg:grid-cols-[240px_1fr_300px]'} gap-6`}>
        
        {/* Left Column: Navigation Sidebar (Tablet & Desktop only) */}
        <aside className="hidden md:block space-y-6">
          <div className="sticky top-22 space-y-4">
            <nav className="flex flex-col gap-1">
              <Link 
                to="/" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  location.pathname === '/' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Home className="w-5 h-5" />
                Trang chủ
              </Link>
              <Link 
                to="/about" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  location.pathname === '/about' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Info className="w-5 h-5" />
                Giới thiệu & Liên hệ
              </Link>
              {currentUser && (
                <Link 
                  to={`/profile/${currentUser.uid}`} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    location.pathname.startsWith('/profile') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  Trang cá nhân
                </Link>
              )}
              {userData?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    location.pathname === '/admin' 
                      ? 'bg-red-50 text-red-600' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  Quản trị viên
                </Link>
              )}
            </nav>
            
            <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-100 space-y-3">
              <h4 className="font-extrabold text-sm">Hỏi đáp BKafe</h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                Nơi sinh viên HUST trao đổi học thuật, chia sẻ kinh nghiệm học tập và đời sống sinh viên.
              </p>
              <Link 
                to="/create-post" 
                className="block text-center bg-white text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
              >
                Đặt câu hỏi ngay
              </Link>
            </div>
          </div>
        </aside>

        {/* Center Column: Main Content Area */}
        <main className="min-w-0">
          <Outlet />
        </main>

        {/* Right Column: Statistics & Info Sidebar (Desktop only) */}
        {location.pathname !== '/admin' && (
          <aside className="hidden lg:block space-y-6">
            <div className="sticky top-22 space-y-6">
              
              {/* Statistics Card (Admin Only) */}
              {userData?.role === 'admin' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                    Thống kê hệ thống
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <div className="text-lg font-black text-blue-600">{stats.views}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Xem trang</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <div className="text-lg font-black text-green-600">{stats.posts}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Câu hỏi</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <div className="text-lg font-black text-indigo-600">{stats.comments}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đáp án</div>
                    </div>
                  </div>
                </div>
              )}

              {/* HUST Resources Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Tài nguyên HUST
                </h3>
                <ul className="space-y-2 text-xs font-semibold">
                  <li>
                    <a 
                      href="https://hust.edu.vn" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center justify-between text-slate-600 hover:text-blue-600 p-2 hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <span>Trang chủ HUST</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://sis.hust.edu.vn" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center justify-between text-slate-600 hover:text-blue-600 p-2 hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <span>Cổng thông tin đào tạo (SIS)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="http://library.hust.edu.vn" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center justify-between text-slate-600 hover:text-blue-600 p-2 hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <span>Thư viện Tạ Quang Bửu</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </li>
                </ul>
              </div>
              
            </div>
          </aside>
        )}

      </div>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-[1400px] mx-auto px-4 text-center text-xs text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} BKafe
        </div>
      </footer>
    </div>
  );
}

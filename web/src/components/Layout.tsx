import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation, useParams, useNavigationType } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  Coffee, LogOut, User as UserIcon, PlusCircle, ShieldCheck,
  Search, Menu, X, Home, BookOpen, ExternalLink, Bell, Hash, Inbox,
} from 'lucide-react';

interface Topic { slug: string; name: string; }

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ unread: number; items: any[] }>({ unread: 0, items: [] });
  const navigate = useNavigate();

  const load = async () => {
    try { setData(await api.get('/notifications')); } catch { /* ignore */ }
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

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
      <button onClick={openMenu} className="btn-icon" title="Thông báo">
        <Bell size={20} />
        {data.unread > 0 && (
          <span className="bell-badge">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="dropdown-overlay" onClick={() => setOpen(false)} />
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <span className="dropdown-title">Thông báo</span>
              {data.unread > 0 && <button onClick={markAll} className="dropdown-action">Đánh dấu đã đọc</button>}
            </div>
            <div className="dropdown-content">
              {data.items.length === 0 && <div className="text-center font-bold" style={{ padding: '24px', fontSize: '12px', color: 'var(--slate-400)' }}>Chưa có thông báo nào.</div>}
              {data.items.map((n) => (
                <button key={n.id} onClick={() => clickItem(n)} className={`dropdown-item ${!n.read ? 'dropdown-item-unread' : ''}`}>
                  <div className="notification-title">
                    {!n.read && <span className="notification-dot" />}
                    {n.title}
                  </div>
                  <div className="notification-desc line-clamp-2">{n.message}</div>
                  <div className="notification-time">{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
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
  const [unreadContacts, setUnreadContacts] = useState(0);
  const [pendingPostCount, setPendingPostCount] = useState(0);

  const navType = useNavigationType();
  const [adTimerFinished, setAdTimerFinished] = useState(false);
  const [showAdPopup, setShowAdPopup] = useState(false);

  useEffect(() => {
    api.get('/topics').then(setTopics).catch(() => {});
  }, []);

  // 1. Global Scroll Restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll:${location.pathname}${location.search}`, String(window.scrollY));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const key = `scroll:${location.pathname}${location.search}`;
    if (navType === 'POP') {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const scrollVal = parseInt(saved, 10);
        window.scrollTo(0, scrollVal);
        const timers = [50, 150, 300, 500].map((d) =>
          setTimeout(() => window.scrollTo(0, scrollVal), d)
        );
        return () => timers.forEach(clearTimeout);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.search, navType]);

  // 2. Global Ad Popup Timer (60 seconds)
  useEffect(() => {
    if (!Cookies.get('hasSeenPopup')) {
      const t = setTimeout(() => {
        setAdTimerFinished(true);
      }, 60000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (adTimerFinished && location.pathname === '/' && !Cookies.get('hasSeenPopup')) {
      setShowAdPopup(true);
    }
  }, [adTimerFinished, location.pathname]);

  const closeAdPopup = () => {
    setShowAdPopup(false);
    Cookies.set('hasSeenPopup', 'true', { expires: 365 });
  };

  // Load admin-only badges with custom event listeners and periodic polling
  useEffect(() => {
    const updateBadges = () => {
      if (user?.role === 'admin') {
        api.get('/contacts').then((cs: any[]) => {
          setUnreadContacts(cs.filter((c: any) => !c.handled).length);
        }).catch(() => {});
        api.get('/posts?status=pending').then((ps: any[]) => {
          setPendingPostCount(ps.length);
        }).catch(() => {});
      } else {
        setUnreadContacts(0);
        setPendingPostCount(0);
      }
    };

    updateBadges();

    window.addEventListener('bkafe-contacts-changed', updateBadges);
    window.addEventListener('bkafe-posts-changed', updateBadges);
    
    // Poll every 10s as a fallback
    const interval = setInterval(updateBadges, 10000);

    return () => {
      window.removeEventListener('bkafe-contacts-changed', updateBadges);
      window.removeEventListener('bkafe-posts-changed', updateBadges);
      clearInterval(interval);
    };
  }, [user, location.pathname]);

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
    `nav-link ${active ? 'nav-link-active' : 'nav-link-inactive'}`;

  const isAdminPage = location.pathname === '/admin';

  const SidebarNav = () => (
    <nav className="sidebar-nav">
      <Link to="/" className={linkCls(location.pathname === '/')}>
        <span className="nav-link-left-content"><Home size={20} /> Trang chủ</span>
      </Link>
      {topics.map((t) => (
        <Link key={t.slug} to={`/topic/${t.slug}`} className={linkCls(activeTopic === t.slug)}>
          <span className="nav-link-left-content"><Hash size={20} /> {t.name}</span>
        </Link>
      ))}
      {user?.role === 'admin' ? (
        /* Admin sees "Hộp thư góp ý" with badge */
        <Link to="/about" className={linkCls(location.pathname === '/about')}>
          <span className="nav-link-left-content"><Inbox size={20} /> Hộp thư góp ý</span>
          {unreadContacts > 0 && (
            <span className="nav-badge">
              {unreadContacts > 99 ? '99+' : unreadContacts}
            </span>
          )}
        </Link>
      ) : (
        <Link to="/about" className={linkCls(location.pathname === '/about')}>
          <span className="nav-link-left-content"><Inbox size={20} /> Giới thiệu &amp; Liên hệ</span>
        </Link>
      )}
      {user?.role === 'admin' && (
        <Link to="/admin" className={`nav-link ${isAdminPage ? 'nav-link-admin-active' : 'nav-link-inactive'}`}>
          <span className="nav-link-left-content"><ShieldCheck size={20} /> Trang quản trị</span>
          {pendingPostCount > 0 && (
            <span className="nav-dot" title={`${pendingPostCount} bài chờ duyệt`} />
          )}
        </Link>
      )}
      {user && (
        <Link to={`/profile/${user.id}`} className={linkCls(location.pathname.startsWith('/profile'))}>
          <span className="nav-link-left-content"><UserIcon size={20} /> Trang cá nhân</span>
        </Link>
      )}
    </nav>
  );

  return (
    <div className="layout-wrapper">
      <header className="header">
        <div className="header-container">
          <Link to="/" className="brand-logo">
            <Coffee size={28} className="brand-logo-icon fill-blue-50" />
            <span className="brand-logo-text">BKafe</span>
          </Link>

          {location.pathname !== '/login' && location.pathname !== '/register' && (
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm câu hỏi, người dùng..."
                  className="search-input"
                />
                <Search size={18} className="search-icon" />
              </div>
            </form>
          )}

          <div className="header-actions">
            {user ? (
              <>
                {/* Admin shortcut button in header */}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`btn btn-secondary ${isAdminPage ? 'nav-link-admin-active' : ''}`}
                    style={{ display: 'inline-flex', padding: '8px 12px', fontSize: '13px', position: 'relative' }}
                    title="Trang quản trị"
                  >
                    <ShieldCheck size={16} />
                    <span className="hidden-tablet" style={{ marginLeft: '4px' }}>Trang quản trị</span>
                    {pendingPostCount > 0 && (
                      <span className="nav-dot" style={{ position: 'absolute', top: '2px', right: '2px' }} />
                    )}
                  </Link>
                )}
                <Link to="/create-post" className="btn-ask" title="Đăng câu hỏi">
                  <PlusCircle size={20} />
                  <span>Đăng câu hỏi</span>
                </Link>
                <NotificationBell />
                <Link to={`/profile/${user.id}`} className="user-profile-btn">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" />
                  ) : (
                    <span className="avatar-placeholder">{user.displayName.charAt(0).toUpperCase()}</span>
                  )}
                  <span className="truncate" style={{ maxWidth: '120px' }}>{user.displayName}</span>
                </Link>
                <button onClick={handleLogout} className="btn-icon btn-icon-danger" title="Đăng xuất">
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link to="/login" className="btn-link">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary btn-circle">Đăng ký</Link>
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="btn-icon mobile-menu-toggle" style={{ display: 'none' }}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-container" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch}>
              <div className="search-container">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." className="search-input" />
                <Search size={18} className="search-icon" />
              </div>
            </form>
            <SidebarNav />
          </div>
        </div>
      )}

      <div className={`main-layout ${isAdminPage ? '' : 'main-layout-three-cols'}`}>
        <aside className="aside-left">
          <div className="sticky-sidebar">
            <SidebarNav />
            <div className="sidebar-banner">
              <h4 className="sidebar-banner-title">Hỏi đáp BKafe</h4>
              <p className="sidebar-banner-desc">Nơi sinh viên HUST trao đổi học thuật, chia sẻ kinh nghiệm học tập và đời sống sinh viên.</p>
              <Link to="/create-post" className="sidebar-banner-btn">Đặt câu hỏi ngay</Link>
            </div>
          </div>
        </aside>

        <main className="main-content"><Outlet /></main>

        {!isAdminPage && (
          <aside className="aside-right">
            <div className="sticky-sidebar">
              <div className="widget">
                <h3 className="widget-title">
                  <BookOpen size={16} style={{ color: 'var(--primary-blue)' }} /> Tài nguyên HUST
                </h3>
                <ul className="widget-list">
                  <li>
                    <a href="https://hust.edu.vn" target="_blank" rel="noreferrer" className="widget-link">
                      <span>Trang chủ HUST</span>
                      <ExternalLink size={14} style={{ color: 'var(--slate-400)' }} />
                    </a>
                  </li>
                  <li>
                    <a href="https://ctt.hust.edu.vn" target="_blank" rel="noreferrer" className="widget-link">
                      <span>Cổng thông tin đào tạo (CTT)</span>
                      <ExternalLink size={14} style={{ color: 'var(--slate-400)' }} />
                    </a>
                  </li>
                  <li>
                    <a href="http://library.hust.edu.vn" target="_blank" rel="noreferrer" className="widget-link">
                      <span>Thư viện Tạ Quang Bửu</span>
                      <ExternalLink size={14} style={{ color: 'var(--slate-400)' }} />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>

      <footer className="footer">
        <div className="footer-container">&copy; {new Date().getFullYear()} BKafe</div>
      </footer>

      {showAdPopup && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button onClick={closeAdPopup} className="modal-close-btn"><X size={20} /></button>
            <div className="modal-content">
              <div className="modal-icon"><Coffee size={32} /></div>
              <h3 className="modal-title">Ưu đãi BKafe!</h3>
              <p className="modal-desc">Tham gia ngay cộng đồng sinh viên HUST để nhận tài liệu ôn thi độc quyền hoàn toàn miễn phí.</p>
              <button onClick={closeAdPopup} className="btn btn-primary modal-btn">Khám phá ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

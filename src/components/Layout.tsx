import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Coffee, LogOut, User as UserIcon, PlusCircle, ShieldAlert, Search } from 'lucide-react';

export default function Layout() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 shrink-0">
            <Coffee className="w-6 h-6 text-blue-600" />
            <span className="hidden sm:block">BKafe</span>
          </Link>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bài viết, mọi người..."
                className="w-full bg-gray-100 text-sm px-4 py-2 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            </div>
          </form>

          <div className="flex items-center gap-4 shrink-0">
            {currentUser ? (
              <>
                <Link to="/create-post" className="text-gray-500 hover:text-gray-900 hidden md:block">
                  <PlusCircle className="w-5 h-5" />
                </Link>
                {userData?.role === 'admin' && (
                  <Link to="/admin" className="text-red-500 hover:text-red-700 hidden md:block" title="Admin Panel">
                    <ShieldAlert className="w-5 h-5" />
                  </Link>
                )}
                <Link to={`/profile/${currentUser.uid}`} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                  <UserIcon className="w-5 h-5" />
                  <span className="hidden md:inline">{userData?.displayName || currentUser.email}</span>
                </Link>
                <button onClick={handleLogout} className="text-gray-500 hover:text-gray-900">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">Đăng nhập</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-center gap-6 px-4 py-3 bg-gray-50 border-t border-gray-200">
          <Link to="/" className="text-gray-600 font-medium text-sm">Trang chủ</Link>
          <Link to="/about" className="text-gray-600 font-medium text-sm">Liên hệ</Link>
          {currentUser && (
            <Link to="/create-post" className="text-blue-600 font-medium text-sm">Đăng bài</Link>
          )}
          {userData?.role === 'admin' && (
            <Link to="/admin" className="text-red-600 font-medium text-sm">Admin</Link>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

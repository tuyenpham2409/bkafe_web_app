import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search as SearchIcon, User, FileText } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Fetch all posts and users, then filter client-side for simple robust search
        const postsSnap = await getDocs(query(collection(db, 'posts')));
        const fetchedPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const usersSnap = await getDocs(query(collection(db, 'users')));
        const fetchedUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const lowerQ = q.toLowerCase().trim();
        
        // Filter approved posts matching title/content
        const filteredPosts = fetchedPosts.filter((post: any) => 
          post.status === 'approved' && 
          (post.title?.toLowerCase().includes(lowerQ) || post.content?.toLowerCase().includes(lowerQ))
        );
        
        // Filter users matching displayName, email, or username
        const filteredUsers = fetchedUsers.filter((user: any) => 
          user.displayName?.toLowerCase().includes(lowerQ) || 
          user.email?.toLowerCase().includes(lowerQ) ||
          user.username?.toLowerCase().includes(lowerQ)
        );

        setPosts(filteredPosts);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Search fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    if (q) {
      fetchResults();
    } else {
      setPosts([]);
      setUsers([]);
      setLoading(false);
    }
  }, [q]);

  if (!q) {
    return (
      <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="font-extrabold text-slate-700 mb-1">Tìm kiếm BKafe</h2>
        <p className="text-xs text-slate-400 font-semibold">Nhập từ khóa tìm kiếm trên thanh tiêu đề để tìm bài viết hoặc thành viên.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search info banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Kết quả tìm kiếm cho "{q}"</h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Tìm thấy {posts.length} câu hỏi và {users.length} sinh viên/quản trị viên
          </p>
        </div>
        <SearchIcon className="w-8 h-8 text-blue-500 fill-blue-50 shrink-0" />
      </div>

      {/* Grid: 2 columns for results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Posts results list (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 px-1">
            <FileText className="w-5 h-5 text-blue-500" />
            Câu hỏi thảo luận ({posts.length})
          </h2>
          
          {loading ? (
            <div className="text-slate-400 font-bold text-sm py-4">Đang tìm câu hỏi...</div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                <Link 
                  key={post.id} 
                  to={`/post/${post.id}`} 
                  className="block bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400/60 shadow-sm hover:shadow-md transition-all group"
                >
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                    {post.title}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-3">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <span className="text-slate-600 font-extrabold">{post.authorName}</span>
                    <span>·</span>
                    <span>{post.views || 0} lượt xem</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 text-slate-400 font-bold text-sm">
              Không tìm thấy câu hỏi nào tương thích.
            </div>
          )}
        </div>

        {/* Users results list (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2 px-1">
            <User className="w-5 h-5 text-indigo-500" />
            Thành viên ({users.length})
          </h2>
          
          {loading ? (
            <div className="text-slate-400 font-bold text-sm py-4">Đang tìm thành viên...</div>
          ) : users.length > 0 ? (
            <div className="space-y-3">
              {users.map(user => (
                <Link 
                  key={user.id} 
                  to={`/profile/${user.id}`} 
                  className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400/60 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 text-sm truncate">{user.displayName}</div>
                    <div className="text-xs font-semibold text-slate-400 truncate">@{user.username || 'username'}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 text-slate-400 font-bold text-sm">
              Không tìm thấy thành viên phù hợp.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

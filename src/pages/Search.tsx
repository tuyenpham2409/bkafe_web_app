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
        // Fetch all posts and users, then filter client-side for simple search
        const postsSnap = await getDocs(query(collection(db, 'posts')));
        const fetchedPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const usersSnap = await getDocs(query(collection(db, 'users')));
        const fetchedUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const lowerQ = q.toLowerCase();
        
        const filteredPosts = fetchedPosts.filter((post: any) => 
          post.status === 'approved' && 
          (post.title?.toLowerCase().includes(lowerQ) || post.content?.toLowerCase().includes(lowerQ))
        );
        
        const filteredUsers = fetchedUsers.filter((user: any) => 
          user.displayName?.toLowerCase().includes(lowerQ) || user.email?.toLowerCase().includes(lowerQ)
        );

        setPosts(filteredPosts);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
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
    return <div className="text-center py-10 text-gray-500">Hãy nhập từ khóa để tìm kiếm.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kết quả tìm kiếm cho "{q}"</h1>
        <p className="text-gray-500">Tìm thấy {posts.length} bài viết và {users.length} người dùng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Bài viết
          </h2>
          {loading ? (
            <div className="text-gray-500">Đang tìm kiếm...</div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <Link key={post.id} to={`/post/${post.id}`} className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-gray-600 line-clamp-2 text-sm">{post.content}</p>
                <div className="mt-3 text-xs text-gray-400">bởi {post.authorName}</div>
              </Link>
            ))
          ) : (
            <div className="text-gray-500 bg-white p-5 rounded-2xl border border-gray-100 text-center">Không tìm thấy bài viết nào.</div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-green-500" /> Người dùng
          </h2>
          {loading ? (
            <div className="text-gray-500">Đang tìm kiếm...</div>
          ) : users.length > 0 ? (
            users.map(user => (
              <Link key={user.id} to={`/profile/${user.id}`} className="block bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 transition-colors flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{user.displayName}</div>
                  <div className="text-xs text-gray-500 truncate w-32">{user.email}</div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-gray-500 bg-white p-5 rounded-2xl border border-gray-100 text-center">Không tìm thấy người dùng.</div>
          )}
        </div>
      </div>
    </div>
  );
}

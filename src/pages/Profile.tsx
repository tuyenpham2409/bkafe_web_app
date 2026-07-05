import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon, Calendar, FileText } from 'lucide-react';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileUser({ id: docSnap.id, ...docSnap.data() });
        }

        const q = query(
          collection(db, 'posts'),
          where('authorId', '==', id)
        );
        const postsSnap = await getDocs(q);
        let posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        posts = posts
          .filter((p: any) => p.status === 'approved' || id === currentUser?.uid) // Can see own pending posts
          .sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setUserPosts(posts);

      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUser]);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (!profileUser) return <div className="text-center py-10">Không tìm thấy người dùng.</div>;

  const isOwnProfile = currentUser?.uid === id;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-4xl shrink-0">
          {profileUser.displayName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900">{profileUser.displayName}</h1>
          <div className="text-gray-500 mt-1 flex items-center justify-center md:justify-start gap-2">
            <UserIcon className="w-4 h-4" />
            {profileUser.role === 'admin' ? 'Quản trị viên' : 'Sinh viên HUST'}
          </div>
          {isOwnProfile && (
            <div className="text-gray-400 text-sm mt-2">{profileUser.email}</div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5" /> Bài viết đã đăng ({userPosts.length})
        </h2>
        
        <div className="space-y-4">
          {userPosts.map(post => (
            <Link key={post.id} to={`/post/${post.id}`} className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
                {post.status === 'pending' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Chờ duyệt</span>
                )}
              </div>
              <p className="text-gray-600 line-clamp-2 text-sm">{post.content}</p>
              <div className="mt-3 text-xs text-gray-400 flex items-center gap-4">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('vi-VN') : ''}</span>
              </div>
            </Link>
          ))}
          {userPosts.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-200 text-gray-500">
              Chưa có bài viết nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

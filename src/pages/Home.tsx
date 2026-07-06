import { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { fetchPhotoURLs } from '../lib/avatars';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { MessageCircle, Share2, Eye, X, Coffee, Star } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: any;
  views: number;
  likes: number;
  shares: number;
  ratingAvg?: number;
  ratingCount?: number;
  status?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, 'posts')
        );
        const snapshot = await getDocs(q);
        let fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        fetchedPosts = fetchedPosts
          .filter(post => post.status === 'approved')
          .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

        // Use each author's CURRENT avatar (so changing avatar updates old posts too)
        const photoMap = await fetchPhotoURLs(fetchedPosts.map(p => (p as any).authorId));
        fetchedPosts = fetchedPosts.map(p => ({
          ...p,
          authorPhotoURL: photoMap[(p as any).authorId] !== undefined
            ? (photoMap[(p as any).authorId] || p.authorPhotoURL || '')
            : p.authorPhotoURL,
        }));

        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // Popup logic
    const hasSeenPopup = Cookies.get('hasSeenPopup');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 60000); // 1 minute
      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    setShowPopup(false);
    Cookies.set('hasSeenPopup', 'true', { expires: 365 });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Dành cho bạn</h1>
      
      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-200">
          Chưa có bài viết nào.
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <Link key={post.id} to={`/post/${post.id}`} className="block bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                {post.authorPhotoURL ? (
                  <img src={post.authorPhotoURL} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600">
                    {post.authorName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">{post.authorName}</div>
                  <div className="text-xs text-gray-500">
                    {post.createdAt?.toDate().toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>

              <div className="flex items-center gap-6 text-gray-500">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Star className={`w-5 h-5 ${(post.ratingCount || 0) > 0 ? 'fill-amber-400' : 'fill-slate-200 text-slate-300'}`} />
                  <span className="text-sm font-medium">
                    {(post.ratingCount || 0) > 0 ? `${(post.ratingAvg || 0).toFixed(1)}/5 (${post.ratingCount})` : 'Chưa đánh giá'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Thảo luận</span>
                </div>
                <div className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.shares || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.views || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ưu đãi BKafe!</h3>
              <p className="text-gray-600 mb-6">
                Tham gia ngay cộng đồng sinh viên HUST để nhận tài liệu ôn thi độc quyền hoàn toàn miễn phí.
              </p>
              <button onClick={closePopup} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                Khám phá ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

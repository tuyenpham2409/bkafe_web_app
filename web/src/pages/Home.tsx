import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import { api } from '../lib/api';
import { MessageCircle, Eye, X, Coffee, Star, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    api.get('/topics').then(setTopics).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = slug ? `?topic=${slug}&sort=newest` : '?sort=newest';
    api.get(`/posts${qs}`)
      .then(setPosts)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [slug]);

  // Ad popup after 1 minute, suppressed forever once closed (cookie)
  useEffect(() => {
    if (!Cookies.get('hasSeenPopup')) {
      const t = setTimeout(() => setShowPopup(true), 60000);
      return () => clearTimeout(t);
    }
  }, []);

  const closePopup = () => {
    setShowPopup(false);
    Cookies.set('hasSeenPopup', 'true', { expires: 365 });
  };

  const topicName = slug ? topics.find((t) => t.slug === slug)?.name : null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-1 text-slate-900">{topicName ? `Chủ đề: ${topicName}` : 'Dành cho bạn'}</h1>
      <p className="text-sm text-slate-400 font-semibold mb-6">{topicName ? 'Các câu hỏi thuộc chủ đề này.' : 'Tất cả câu hỏi mới nhất từ cộng đồng.'}</p>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Đang tải...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">Chưa có bài viết nào.</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="block bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                {post.authorPhotoURL ? (
                  <img src={post.authorPhotoURL} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600">{post.authorName?.charAt(0).toUpperCase() || 'U'}</div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{post.authorName}</div>
                  <div className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
                {topics.find((t) => t.slug === post.topic) && (
                  <span className="ml-auto shrink-0 text-[11px] font-extrabold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">#{topics.find((t) => t.slug === post.topic)?.name}</span>
                )}
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2">{post.title}</h2>
              <p className="text-slate-700 mb-4 line-clamp-3">{post.content}</p>

              {post.media?.length > 0 && (
                <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <ImageIcon className="w-4 h-4" /> {post.media.length} tệp đính kèm
                </div>
              )}

              <div className="flex items-center gap-6 text-slate-500">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Star className={`w-5 h-5 ${post.ratingCount > 0 ? 'fill-amber-400' : 'fill-slate-200 text-slate-300'}`} />
                  <span className="text-sm font-medium">{post.ratingCount > 0 ? `${post.ratingAvg.toFixed(1)}/5 (${post.ratingCount})` : 'Chưa đánh giá'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.commentCount ?? 0}</span>
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
            <button onClick={closePopup} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Coffee className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ưu đãi BKafe!</h3>
              <p className="text-slate-600 mb-6">Tham gia ngay cộng đồng sinh viên HUST để nhận tài liệu ôn thi độc quyền hoàn toàn miễn phí.</p>
              <button onClick={closePopup} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">Khám phá ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

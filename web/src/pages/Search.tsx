import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';

const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao → thấp' },
  { value: 'rating_asc', label: 'Đánh giá thấp → cao' },
];

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [topics, setTopics] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('newest');
  const [topic, setTopic] = useState('all');

  useEffect(() => { api.get('/topics').then(setTopics).catch(() => {}); }, []);

  // Fetch by keyword first, then apply sort/filter on the same query
  useEffect(() => {
    if (!q) { setPosts([]); return; }
    setLoading(true);
    const params = new URLSearchParams({ q, sort });
    if (topic !== 'all') params.set('topic', topic);
    api.get(`/posts?${params.toString()}`).then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, [q, sort, topic]);

  if (!q) {
    return (
      <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="font-extrabold text-slate-700 mb-1">Tìm kiếm BKafe</h2>
        <p className="text-xs text-slate-400 font-semibold">Nhập từ khoá trên thanh tiêu đề để tìm câu hỏi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-black text-slate-900">Kết quả cho "{q}"</h1>
        <p className="text-xs text-slate-500 font-bold mt-1">Tìm thấy {posts.length} câu hỏi.</p>

        {/* sort + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="text-sm font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-blue-500">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setTopic('all')} className={`text-xs font-bold px-3 py-1.5 rounded-full ${topic === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tất cả</button>
            {topics.map((t) => (
              <button key={t.slug} onClick={() => setTopic(t.slug)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${topic === t.slug ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t.name}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 font-bold text-sm py-4 text-center">Đang tìm...</div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="block bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400/60 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-400 mb-1">
                <span className="px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">#{topics.find((t) => t.slug === post.topic)?.name || post.topic}</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 mb-2">{post.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-3">{post.content}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span className="text-slate-600 font-extrabold">{post.authorName}</span><span>·</span>
                <span>{post.views || 0} lượt xem</span><span>·</span>
                <span>{post.ratingCount > 0 ? `${post.ratingAvg.toFixed(1)}★ (${post.ratingCount})` : 'Chưa đánh giá'}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 text-slate-400 font-bold text-sm">Không tìm thấy câu hỏi nào phù hợp.</div>
      )}
    </div>
  );
}

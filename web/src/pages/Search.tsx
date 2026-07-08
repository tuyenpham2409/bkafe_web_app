import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Search as SearchIcon, SlidersHorizontal, User as UserIcon } from 'lucide-react';

const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao → thấp' },
  { value: 'rating_asc', label: 'Đánh giá thấp → cao' },
];

type TabType = 'posts' | 'users';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [tab, setTab] = useState<TabType>('posts');
  const [topics, setTopics] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('newest');
  const [topic, setTopic] = useState('all');

  useEffect(() => { api.get('/topics').then(setTopics).catch(() => {}); }, []);

  // Fetch posts
  useEffect(() => {
    if (!q) { setPosts([]); return; }
    setLoading(true);
    const params = new URLSearchParams({ q, sort });
    if (topic !== 'all') params.set('topic', topic);
    api.get(`/posts?${params.toString()}`).then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, [q, sort, topic]);

  // Fetch users
  useEffect(() => {
    if (!q) { setUsers([]); return; }
    api.get(`/users/search?q=${encodeURIComponent(q)}`).then(setUsers).catch(() => {});
  }, [q]);

  const displayTitle = (post: any) =>
    post.title?.trim() || post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '');

  if (!q) {
    return (
      <div className="card text-center" style={{ padding: '48px 32px', color: 'var(--slate-400)', maxWidth: '768px', margin: '0 auto' }}>
        <SearchIcon size={48} style={{ color: 'var(--slate-300)', margin: '0 auto 12px auto' }} />
        <h2 style={{ fontWeight: '900', color: 'var(--slate-700)', marginBottom: '4px' }}>Tìm kiếm BKafe</h2>
        <p style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: '600' }}>Nhập từ khoá trên thanh tiêu đề để tìm câu hỏi hoặc người dùng.</p>
      </div>
    );
  }

  const btnTabStyle = (active: boolean) => ({
    padding: '6px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'var(--transition-base)',
    backgroundColor: active ? 'var(--white)' : 'transparent',
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
    color: active ? 'var(--slate-900)' : 'var(--slate-500)',
    cursor: 'pointer',
  } as React.CSSProperties);

  return (
    <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--slate-900)' }}>Kết quả cho "{q}"</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--slate-100)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
          <button
            onClick={() => setTab('posts')}
            style={btnTabStyle(tab === 'posts')}
          >
            Câu hỏi ({posts.length})
          </button>
          <button
            onClick={() => setTab('users')}
            style={btnTabStyle(tab === 'users')}
          >
            Người dùng ({users.length})
          </button>
        </div>

        {/* Sort + filter (only for posts) */}
        {tab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--slate-100)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={16} style={{ color: 'var(--slate-400)' }} />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="form-select" style={{ padding: '6px 12px', fontSize: '14px', fontWeight: '700', width: 'auto' }}>
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => setTopic('all')}
                className={`btn ${topic === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', boxShadow: 'none' }}
              >
                Tất cả
              </button>
              {topics.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => setTopic(t.slug)}
                  className={`btn ${topic === t.slug ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', boxShadow: 'none' }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post results */}
      {tab === 'posts' && (
        loading ? (
          <div style={{ color: 'var(--slate-400)', fontWeight: '700', fontSize: '14px', padding: '16px 0', textAlign: 'center' }}>Đang tìm...</div>
        ) : posts.length > 0 ? (
          <div className="post-list">
            {posts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="card post-card" style={{ display: 'block', textDecoration: 'none' }}>
                <div className="post-card-header" style={{ marginBottom: '8px' }}>
                  <span className="badge badge-slate">
                    #{topics.find((t) => t.slug === post.topic)?.name || post.topic}
                  </span>
                </div>
                <h3 className="post-card-title" style={{ fontSize: '16px', marginBottom: '8px' }}>{displayTitle(post)}</h3>
                <p className="post-card-body line-clamp-2" style={{ marginBottom: '12px' }}>{post.content}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--slate-400)' }}>
                  <span style={{ color: 'var(--slate-600)', fontWeight: '950' }}>{post.authorName}</span>
                  <span>·</span>
                  <span>{post.views || 0} lượt xem</span>
                  <span>·</span>
                  <span>{post.ratingCount > 0 ? `${post.ratingAvg.toFixed(1)}★ (${post.ratingCount})` : 'Chưa đánh giá'}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: '40px 16px', color: 'var(--slate-500)' }}>Không tìm thấy câu hỏi nào phù hợp.</div>
        )
      )}

      {/* User results */}
      {tab === 'users' && (
        users.length > 0 ? (
          <div className="post-list">
            {users.map((u) => (
              <Link key={u.id} to={`/profile/${u.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', padding: '16px' }}>
                {u.photoURL ? (
                  <img src={u.photoURL} alt="" className="post-card-avatar" style={{ width: '48px', height: '48px' }} />
                ) : (
                  <div className="post-card-avatar-placeholder" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                    {u.displayName?.charAt(0).toUpperCase() || <UserIcon size={24} />}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: '900', color: 'var(--slate-900)', fontSize: '14px' }}>{u.displayName}</div>
                  <div style={{ textTransform: 'none', fontSize: '12px', color: 'var(--slate-400)', fontWeight: '600' }}>@{u.username}</div>
                </div>
                {u.role === 'admin' && (
                  <span className="badge badge-red" style={{ textTransform: 'none' }}>Admin</span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: '40px 16px', color: 'var(--slate-500)' }}>Không tìm thấy người dùng nào.</div>
        )
      )}
    </div>
  );
}

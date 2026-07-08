import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { MessageCircle, Eye, Star, Play } from 'lucide-react';

export default function Home() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const topicName = slug ? topics.find((t) => t.slug === slug)?.name : null;

  // Helper: hiển thị thời gian ngắn gọn
  const displayTitle = (post: any) =>
    post.title?.trim() || post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '');

  return (
    <div className="home-container" style={{ maxWidth: '672px', margin: '0 auto' }}>
      <h1 className="forum-title" style={{ marginBottom: '4px' }}>
        {topicName ? `Chủ đề: ${topicName}` : 'Dành cho bạn'}
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--slate-400)', fontWeight: '600', marginBottom: '24px' }}>
        {topicName ? 'Các câu hỏi thuộc chủ đề này.' : 'Tất cả câu hỏi mới nhất từ cộng đồng.'}
      </p>

      {loading ? (
        <div className="text-center" style={{ padding: '40px 0', color: 'var(--slate-500)' }}>Đang tải...</div>
      ) : posts.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px 16px', color: 'var(--slate-500)' }}>Chưa có câu hỏi nào.</div>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="card post-card" style={{ display: 'flex', textDecoration: 'none' }}>
              <div className="post-card-header">
                <div className="post-card-author">
                  {post.authorPhotoURL ? (
                    <img src={post.authorPhotoURL} alt="" className="post-card-avatar" />
                  ) : (
                    <div className="post-card-avatar-placeholder">
                      {post.authorName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="post-card-author-info">
                    <div className="post-card-author-name">{post.authorName}</div>
                    <div className="post-card-date">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
                {topics.find((t) => t.slug === post.topic) && (
                  <span className="badge badge-slate" style={{ flexShrink: 0 }}>
                    #{topics.find((t) => t.slug === post.topic)?.name}
                  </span>
                )}
              </div>

              <h2 className="post-card-title">{displayTitle(post)}</h2>
              <p className="post-card-body line-clamp-3">{post.content}</p>

              {/* Media preview */}
              {post.media?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {post.media.slice(0, 3).map((m: any, i: number) => (
                    m.type === 'video' ? (
                      <div
                        key={i}
                        className="relative"
                        style={{
                          gridColumn: 'span 3',
                          aspectRatio: '16/9',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1px solid var(--slate-200)',
                          backgroundColor: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={20} style={{ color: 'var(--slate-800)', fill: 'var(--slate-800)' }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={i}
                        style={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1px solid var(--slate-200)',
                          gridColumn: post.media.length === 1 ? 'span 3' : 'auto',
                          aspectRatio: post.media.length === 1 ? '16/9' : '1/1',
                        }}
                      >
                        <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      </div>
                    )
                  ))}
                  {post.media.length > 3 && (
                    <div style={{
                      aspectRatio: '1/1',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(30, 41, 59, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--white)',
                      fontWeight: '900',
                      fontSize: '14px',
                    }}>
                      +{post.media.length - 3}
                    </div>
                  )}
                </div>
              )}

              <div className="post-card-footer">
                <div className="post-card-stats">
                  <div className="post-card-stat-item" style={{ color: 'var(--amber)' }}>
                    <Star
                      size={20}
                      style={{
                        fill: post.ratingCount > 0 ? 'var(--amber)' : 'var(--slate-200)',
                        stroke: post.ratingCount > 0 ? 'var(--amber)' : 'var(--slate-300)',
                      }}
                    />
                    <span>{post.ratingCount > 0 ? `${post.ratingAvg.toFixed(1)}/5 (${post.ratingCount})` : 'Chưa đánh giá'}</span>
                  </div>
                  <div className="post-card-stat-item">
                    <MessageCircle size={20} />
                    <span>{post.commentCount ?? 0}</span>
                  </div>
                </div>
                <div className="post-card-stat-item" style={{ marginLeft: 'auto' }}>
                  <Eye size={20} />
                  <span>{post.views || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

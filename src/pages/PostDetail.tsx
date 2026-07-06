import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLoginGate } from '../contexts/LoginGate';
import { api } from '../lib/api';
import { Share2, Eye, Star, MessageCircle, Send, MoreVertical, CheckCircle, XCircle, Edit, Trash2, Hash } from 'lucide-react';

const REJECT_REASONS = [
  'Nội dung không phù hợp thuần phong mỹ tục',
  'Spam hoặc quảng cáo',
  'Sai chủ đề',
  'Nội dung chưa rõ ràng, thiếu thông tin',
  'Vi phạm quy định cộng đồng HUST',
];

function AvatarCircle({ url, name, size }: { url?: string; name?: string; size: string }) {
  if (url) return <img src={url} alt={name || ''} className={`${size} rounded-full object-cover border border-slate-200`} />;
  return <div className={`${size} rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600`}>{name?.charAt(0).toUpperCase() || 'U'}</div>;
}

function StarRatingDisplay({ rating, count = 0 }: { rating: number; count?: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-4 h-4 ${rounded >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />)}
      </div>
      {count > 0 ? <span className="text-xs font-bold text-slate-500">{rating.toFixed(1)}/5 ({count} đánh giá)</span> : <span className="text-xs font-bold text-slate-400">Chưa có đánh giá</span>}
    </div>
  );
}

// Click to open, hover to preview, click a star to confirm.
function RatePopover({ myValue, onRate, direction = 'up', starClass = 'w-3.5 h-3.5' }: { myValue: number | null; onRate: (v: number) => void; direction?: 'up' | 'down'; starClass?: string }) {
  const { user } = useAuth();
  const { requireLogin } = useLoginGate();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover !== null ? hover : (myValue ?? 0);
  const trigger = () => { if (!user) return requireLogin('Bạn cần đăng nhập để đánh giá.'); setOpen((o) => !o); };
  return (
    <div className="relative inline-block">
      <button type="button" onClick={trigger} className={`flex items-center gap-1 transition-colors ${myValue !== null ? 'text-amber-500 font-extrabold' : 'text-slate-500 hover:text-amber-500'}`}>
        <Star className={`${starClass} ${myValue !== null ? 'fill-current' : ''}`} />
        {myValue !== null ? `Đã đánh giá ${myValue}★` : 'Đánh giá'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setHover(null); }} />
          <div onMouseLeave={() => setHover(null)} className={`absolute left-0 bg-white border border-slate-200 shadow-xl rounded-full px-2.5 py-1.5 flex items-center gap-0.5 z-20 ${direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}>
            <button type="button" onMouseEnter={() => setHover(0)} onClick={() => { onRate(0); setOpen(false); setHover(null); }} className="text-[10px] font-extrabold text-slate-400 hover:text-red-500 px-1 mr-0.5 border-r border-slate-100">0</button>
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onMouseEnter={() => setHover(s)} onClick={() => { onRate(s); setOpen(false); setHover(null); }} className="p-0.5 hover:scale-125 transition-transform">
                <Star className={`w-4 h-4 ${shown >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireLogin } = useLoginGate();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // admin controls
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '', topic: '' });
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);

  const isAdmin = user?.role === 'admin';
  const isOwner = user && post && user.id === post.authorId;

  const load = async () => {
    try {
      const [p, cs] = await Promise.all([api.get(`/posts/${id}`), api.get(`/posts/${id}/comments`)]);
      setPost(p);
      setComments(cs);
      setEditData({ title: p.title, content: p.content, topic: p.topic });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);
  useEffect(() => { api.get('/topics').then(setTopics).catch(() => {}); }, []);

  const share = async () => {
    try { const r = await api.post(`/posts/${id}/share`); setPost((p: any) => ({ ...p, shares: r.shares })); navigator.clipboard.writeText(location.href); alert('Đã sao chép liên kết!'); } catch (e) { console.error(e); }
  };

  const ratePost = async (value: number) => {
    try { const r = await api.post(`/posts/${id}/rate`, { value }); setPost((p: any) => ({ ...p, ratingAvg: r.ratingAvg, ratingCount: r.ratingCount, myRating: r.myRating })); } catch (e: any) { alert(e.message); }
  };
  const rateComment = async (c: any, value: number) => {
    try { const r = await api.post(`/comments/${c.id}/rate`, { value }); setComments((prev) => prev.map((x) => x.id === c.id ? { ...x, ratingAvg: r.ratingAvg, ratingCount: r.ratingCount, myRating: r.myRating } : x)); } catch (e: any) { alert(e.message); }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return requireLogin('Bạn cần đăng nhập để bình luận.');
    if (!commentContent.trim()) return;
    setSubmitting(true);
    try {
      const c = await api.post(`/posts/${id}/comments`, { content: commentContent.trim() });
      setComments((prev) => [...prev, c]);
      setCommentContent('');
    } catch (err: any) { alert(err.message); } finally { setSubmitting(false); }
  };

  const submitReply = async (parentId: string) => {
    if (!user) return requireLogin('Bạn cần đăng nhập để trả lời.');
    if (!replyContent.trim()) return;
    try {
      const c = await api.post(`/comments/${parentId}/reply`, { content: replyContent.trim() });
      setComments((prev) => [...prev, c]);
      setReplyContent(''); setReplyingTo(null);
    } catch (err: any) { alert(err.message); }
  };

  // admin/owner actions
  const doApprove = async () => { const p = await api.patch(`/posts/${id}/approve`); setPost((x: any) => ({ ...x, ...p })); setMenuOpen(false); };
  const doReject = async () => { const p = await api.patch(`/posts/${id}/reject`, { reason: rejectReason }); setPost((x: any) => ({ ...x, ...p })); setRejectOpen(false); setMenuOpen(false); };
  const doDelete = async () => { if (!confirm('Xoá bài viết này?')) return; await api.del(`/posts/${id}`); navigate('/'); };
  const saveEdit = async () => {
    const form = new FormData();
    form.append('title', editData.title); form.append('content', editData.content); form.append('topic', editData.topic);
    const p = await api.putForm(`/posts/${id}`, form);
    setPost((x: any) => ({ ...x, ...p })); setEditing(false);
  };
  const deleteComment = async (cid: string) => { if (!confirm('Xoá bình luận này?')) return; await api.del(`/comments/${cid}`); setComments((prev) => prev.filter((c) => c.id !== cid && c.parentId !== cid)); };

  if (loading) return <div className="text-center py-12 text-slate-500 font-bold">Đang tải nội dung...</div>;
  if (!post) return <div className="text-center py-12 text-slate-500 font-bold">Không tìm thấy câu hỏi này.</div>;

  const topComments = comments.filter((c) => !c.parentId);
  const repliesOf = (pid: string) => comments.filter((c) => c.parentId === pid);
  const topicName = topics.find((t) => t.slug === post.topic)?.name || post.topic;
  const statusBadge = post.status === 'approved' ? null : (
    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${post.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
      {post.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}
    </span>
  );

  const renderComment = (c: any, isReply: boolean) => {
    const myRating = c.myRating ?? null;
    const isRealUser = c.authorId;
    return (
      <div key={c.id} className={`flex gap-3 ${isReply ? 'mt-3' : ''}`}>
        <Link to={isRealUser ? `/profile/${c.authorId}` : '#'} className="shrink-0"><AvatarCircle url={c.authorPhotoURL} name={c.authorName} size={isReply ? 'w-8 h-8' : 'w-10 h-10'} /></Link>
        <div className="flex-1 min-w-0">
          <div className="inline-block bg-slate-100 border border-slate-200/40 rounded-2xl px-4 py-2.5 max-w-full">
            <Link to={isRealUser ? `/profile/${c.authorId}` : '#'} className="font-black text-xs text-slate-900 hover:underline hover:text-blue-600">{c.authorName}</Link>
            <p className="text-[14px] text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed font-medium">{c.content}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 ml-2 text-xs text-slate-500 font-bold">
            <span>{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
            {!isReply && <button type="button" onClick={() => { if (!user) return requireLogin('Đăng nhập để trả lời.'); setReplyingTo(replyingTo === c.id ? null : c.id); }} className="hover:text-blue-600">Trả lời</button>}
            <RatePopover myValue={myRating} onRate={(v) => rateComment(c, v)} />
            {c.ratingCount > 0 && <span className="flex items-center gap-0.5 text-amber-600"><Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />{c.ratingAvg.toFixed(1)}/5 ({c.ratingCount})</span>}
            {isAdmin && <button type="button" onClick={() => deleteComment(c.id)} className="text-red-500 hover:text-red-700">Xoá</button>}
          </div>
          {!isReply && replyingTo === c.id && user && (
            <div className="flex items-center gap-2 mt-2">
              <AvatarCircle url={user.photoURL} name={user.displayName} size="w-8 h-8" />
              <input autoFocus value={replyContent} onChange={(e) => setReplyContent(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitReply(c.id); }} placeholder={`Trả lời ${c.authorName}...`} className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white" />
              <button type="button" onClick={() => submitReply(c.id)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"><Send className="w-4 h-4" /></button>
            </div>
          )}
          {!isReply && repliesOf(c.id).length > 0 && <div className="mt-2 pl-4 border-l-2 border-slate-100">{repliesOf(c.id).map((r) => renderComment(r, true))}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3.5">
            <Link to={post.authorId ? `/profile/${post.authorId}` : '#'} className="shrink-0"><AvatarCircle url={post.authorPhotoURL} name={post.authorName} size="w-12 h-12" /></Link>
            <div>
              <Link to={post.authorId ? `/profile/${post.authorId}` : '#'} className="font-bold text-slate-900 hover:text-blue-600 text-base">{post.authorName}</Link>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span>{new Date(post.createdAt).toLocaleString('vi-VN')}</span><span>·</span>
                <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" /> {post.views || 0}</span><span>·</span>
                <Link to={`/topic/${post.topic}`} className="flex items-center gap-0.5 text-blue-500 hover:underline"><Hash className="w-3 h-3" />{topicName}</Link>
                {statusBadge}
              </div>
            </div>
          </div>

          {/* Admin / owner management menu */}
          {(isAdmin || isOwner) && (
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-5 h-5" /></button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 text-sm font-bold">
                    {isAdmin && post.status !== 'approved' && <button onClick={doApprove} className="w-full flex items-center gap-2 px-4 py-2 text-green-700 hover:bg-green-50"><CheckCircle className="w-4 h-4" /> Duyệt bài</button>}
                    {isAdmin && post.status !== 'rejected' && <button onClick={() => { setRejectOpen(true); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-amber-700 hover:bg-amber-50"><XCircle className="w-4 h-4" /> Từ chối duyệt</button>}
                    <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-blue-700 hover:bg-blue-50"><Edit className="w-4 h-4" /> Sửa bài</button>
                    <button onClick={doDelete} className="w-full flex items-center gap-2 px-4 py-2 text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /> Xoá bài</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {post.status === 'rejected' && post.rejectReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-red-700">Lý do từ chối: {post.rejectReason}</div>
        )}

        {editing ? (
          <div className="space-y-3">
            <select value={editData.topic} onChange={(e) => setEditData({ ...editData, topic: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white">
              {topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
            <input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl font-bold" />
            <textarea value={editData.content} onChange={(e) => setEditData({ ...editData, content: e.target.value })} rows={5} className="w-full px-4 py-2 border border-slate-200 rounded-xl resize-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold">Hủy</button>
              <button onClick={saveEdit} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Lưu</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-3">{post.title}</h1>
            <div className="mb-5 pb-4 border-b border-slate-100"><StarRatingDisplay rating={post.ratingAvg || 0} count={post.ratingCount || 0} /></div>
            <div className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium mb-6">{post.content}</div>

            {/* Media */}
            {post.media?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {post.media.map((m: any, i: number) => m.type === 'video' ? (
                  <video key={i} src={m.url} controls className="w-full rounded-xl border border-slate-200 col-span-2 sm:col-span-3" />
                ) : (
                  <a key={i} href={m.url} target="_blank" rel="noreferrer"><img src={m.url} alt="" className="w-full h-32 object-cover rounded-xl border border-slate-200 hover:opacity-90" /></a>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-4 border-t border-slate-100 text-slate-500 font-bold text-sm">
              <div className="px-3 py-2"><RatePopover myValue={post.myRating ?? null} onRate={ratePost} direction="down" starClass="w-5 h-5" /></div>
              <div className="flex items-center gap-1.5 px-3 py-2"><MessageCircle className="w-5 h-5 text-slate-400" /><span>Bình luận ({comments.length})</span></div>
              <button onClick={share} className="flex items-center gap-1.5 hover:bg-slate-50 hover:text-blue-600 px-3 py-2 rounded-xl transition-all ml-auto"><Share2 className="w-5 h-5" /><span>Chia sẻ ({post.shares || 0})</span></button>
            </div>
          </>
        )}
      </div>

      {/* Reject modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setRejectOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-slate-900 mb-3">Từ chối duyệt bài viết</h3>
            <p className="text-xs text-slate-500 font-semibold mb-3">Chọn lý do (sẽ gửi thông báo cho người đăng):</p>
            <div className="space-y-2 mb-4">
              {REJECT_REASONS.map((r) => (
                <label key={r} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm font-semibold ${rejectReason === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="reason" checked={rejectReason === r} onChange={() => setRejectReason(r)} />
                  {r}
                </label>
              ))}
              <input type="text" placeholder="Hoặc nhập lý do khác..." onChange={(e) => setRejectReason(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold">Hủy</button>
              <button onClick={doReject} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-black text-slate-900 tracking-tight pb-3 border-b border-slate-100">Phần bình luận và giải đáp</h2>
        {user ? (
          <form onSubmit={submitComment} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl w-fit">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Đang gửi với tên: <span className="text-slate-900">{user.displayName}</span> ({user.email})
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nội dung bình luận <span className="text-red-500">*</span></label>
              <textarea required rows={3} value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white resize-none" placeholder="Đóng góp lời giải..." />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/40">
              <span className="text-xs font-semibold text-slate-400">Chấm điểm bài viết bằng nút <span className="text-amber-500 font-bold">Đánh giá</span> phía trên.</span>
              <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shrink-0">{submitting ? 'Đang gửi...' : 'Đăng bình luận'}</button>
            </div>
          </form>
        ) : (
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 text-center">
            <p className="text-sm font-bold text-blue-700">
              Bạn cần <Link to="/login" className="underline font-black">Đăng nhập</Link> hoặc <Link to="/register" className="underline font-black">Đăng ký</Link> để bình luận và đánh giá.
            </p>
          </div>
        )}

        <div className="space-y-5 pt-4">
          {topComments.map((c) => renderComment(c, false))}
          {topComments.length === 0 && <div className="text-center py-8 bg-slate-50 rounded-2xl text-slate-400 font-bold text-sm">Chưa có bình luận nào. Hãy đóng góp câu trả lời đầu tiên!</div>}
        </div>
      </div>
    </div>
  );
}

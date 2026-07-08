import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLoginGate } from '../contexts/LoginGate';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import {
  Share2, Eye, Star, MessageCircle, Send, MoreVertical,
  CheckCircle, XCircle, Edit, Trash2, Hash, ArrowLeft, Plus, X, ImagePlus
} from 'lucide-react';

const Req = () => <span className="req">*</span>;

const viewedInSession = new Set<string>();

const REJECT_REASONS = [
  'Nội dung không phù hợp thuần phong mỹ tục',
  'Spam hoặc quảng cáo',
  'Sai chủ đề',
  'Nội dung chưa rõ ràng, thiếu thông tin',
  'Vi phạm quy định cộng đồng HUST',
];

function AvatarCircle({ url, name, size }: { url?: string; name?: string; size: string }) {
  const dims = size === 'w-12 h-12' ? { width: 48, height: 48 } : size === 'w-10 h-10' ? { width: 40, height: 40 } : { width: 32, height: 32 };
  if (url) return <img src={url} alt={name || ''} style={{ ...dims, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--slate-200)' }} />;
  return <div style={{ ...dims, borderRadius: '50%', backgroundColor: 'var(--primary-light)', border: '1px solid rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary-blue)' }}>{name?.charAt(0).toUpperCase() || 'U'}</div>;
}

function StarRatingDisplay({ rating, count = 0 }: { rating: number; count?: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex-center" style={{ gap: '6px' }}>
      <div className="flex-center">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={16}
            style={{
              color: rounded >= s ? 'var(--amber)' : 'var(--slate-200)',
              fill: rounded >= s ? 'var(--amber)' : 'var(--slate-200)',
            }}
          />
        ))}
      </div>
      {count > 0 ? (
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--slate-500)' }}>
          {rating.toFixed(1)}/5 ({count} đánh giá)
        </span>
      ) : (
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--slate-400)' }}>
          Chưa có đánh giá
        </span>
      )}
    </div>
  );
}

function RatePopover({ myValue, onRate, direction = 'up', starSize = 14 }: { myValue: number | null; onRate: (v: number) => void; direction?: 'up' | 'down'; starSize?: number }) {
  const { user } = useAuth();
  const { requireLogin } = useLoginGate();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const realValue = (myValue === 0 || myValue === null) ? null : myValue;
  const shown = hover !== null ? hover : (realValue ?? 0);
  const trigger = () => { if (!user) return requireLogin('Bạn cần đăng nhập để đánh giá.'); setOpen((o) => !o); };
  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <button
        type="button"
        onClick={trigger}
        className="btn-link"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          color: realValue !== null ? 'var(--amber)' : 'var(--slate-500)',
          fontWeight: realValue !== null ? '900' : '700',
          fontSize: '13px',
        }}
      >
        <Star size={starSize} style={{ fill: realValue !== null ? 'var(--amber)' : 'none', color: realValue !== null ? 'var(--amber)' : 'currentColor' }} />
        {realValue !== null ? `Đã đánh giá ${realValue}★` : 'Đánh giá'}
      </button>
      {open && (
        <>
          <div className="dropdown-overlay" onClick={() => { setOpen(false); setHover(null); }} />
          <div
            onMouseLeave={() => setHover(null)}
            style={{
              position: 'absolute',
              left: 0,
              backgroundColor: 'var(--white)',
              border: '1px solid var(--slate-200)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '9999px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              zIndex: 20,
              bottom: direction === 'up' ? '100%' : 'auto',
              top: direction === 'down' ? '100%' : 'auto',
              marginBottom: direction === 'up' ? '6px' : '0',
              marginTop: direction === 'down' ? '6px' : '0',
            }}
          >
            <button type="button" onMouseEnter={() => setHover(0)} onClick={() => { onRate(0); setOpen(false); setHover(null); }} style={{ fontSize: '10px', fontWeight: '900', color: 'var(--slate-400)', padding: '0 4px', marginRight: '2px', borderRight: '1px solid var(--slate-100)', cursor: 'pointer' }}>0</button>
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onMouseEnter={() => setHover(s)} onClick={() => { onRate(s); setOpen(false); setHover(null); }} style={{ padding: '2px', cursor: 'pointer' }}>
                <Star size={16} style={{ color: shown >= s ? 'var(--amber)' : 'var(--slate-200)', fill: shown >= s ? 'var(--amber)' : 'var(--slate-200)' }} />
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
  const { showToast } = useToast();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [commentContent, setCommentContent] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);

  // comment editing
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editCommentMedia, setEditCommentMedia] = useState<any[]>([]);
  const [editCommentFiles, setEditCommentFiles] = useState<File[]>([]);

  // admin controls
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '', topic: '' });
  const [editMedia, setEditMedia] = useState<any[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const isAdmin = user?.role === 'admin';
  const isOwner = user && post && user.id === post.authorId;

  const load = async () => {
    try {
      setLoading(true);
      const alreadyViewed = viewedInSession.has(id!);
      if (!alreadyViewed) viewedInSession.add(id!);

      const [p, cs] = await Promise.all([
        alreadyViewed ? api.get(`/posts/${id}?noview=1`) : api.get(`/posts/${id}`),
        api.get(`/posts/${id}/comments`),
      ]);
      setPost(p);
      setComments(cs);
      setEditData({ title: p.title, content: p.content, topic: p.topic });
      setEditMedia(p.media || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [id]);
  useEffect(() => { api.get('/topics').then(setTopics).catch(() => {}); }, []);

  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (sharing) return;
    setSharing(true);
    setTimeout(() => setSharing(false), 3000);
    try {
      const r = await api.post(`/posts/${id}/share`);
      setPost((p: any) => ({ ...p, shares: r.shares }));
      await navigator.clipboard.writeText(location.href);
      showToast('Đã sao chép liên kết!', 'success');
    } catch (e) { console.error(e); }
  };

  const ratePost = async (value: number) => {
    try { const r = await api.post(`/posts/${id}/rate`, { value }); setPost((p: any) => ({ ...p, ratingAvg: r.ratingAvg, ratingCount: r.ratingCount, myRating: r.myRating })); } catch (e: any) { alert(e.message); }
  };
  const rateComment = async (c: any, value: number) => {
    try { const r = await api.post(`/comments/${c.id}/rate`, { value }); setComments((prev) => prev.map((x) => x.id === c.id ? { ...x, ratingAvg: r.ratingAvg, ratingCount: r.ratingCount, myRating: r.myRating } : x)); } catch (e: any) { alert(e.message); }
  };

  const MAX_IMG = 5 * 1024 * 1024;
  const MAX_VID = 20 * 1024 * 1024;

  const validateAndAddFiles = (
    incoming: FileList | null,
    current: File[],
    existingCount: number,
    setFiles: React.Dispatch<React.SetStateAction<File[]>>
  ) => {
    const selected = Array.from(incoming || []) as File[];
    const invalid: string[] = [];
    const valid = selected.filter((f) => {
      if (f.type.startsWith('video/') && f.size > MAX_VID) { invalid.push(`"${f.name}" vượt 20MB`); return false; }
      if (f.type.startsWith('image/') && f.size > MAX_IMG) { invalid.push(`"${f.name}" vượt 5MB`); return false; }
      return true;
    });
    if (invalid.length) showToast(`File quá lớn: ${invalid.join(', ')}`, 'error');
    const canAdd = Math.max(0, 5 - existingCount - current.length);
    setFiles((prev) => [...prev, ...valid].slice(0, prev.length + canAdd));
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return requireLogin('Bạn cần đăng nhập để bình luận.');
    if (!commentContent.trim()) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('content', commentContent.trim());
      commentFiles.forEach((f) => form.append('media', f));
      const c = await api.postForm(`/posts/${id}/comments`, form);
      setComments((prev) => [...prev, c]);
      setCommentContent('');
      setCommentFiles([]);
    } catch (err: any) { alert(err.message); } finally { setSubmitting(false); }
  };

  const handleReplyClick = (c: any) => {
    if (!user) return requireLogin('Đăng nhập để trả lời.');
    setReplyingTo(replyingTo === c.id ? null : c.id);
    setReplyContent(`@${c.authorName} `);
    setReplyFiles([]);
  };

  const submitReply = async (comment: any) => {
    if (!user) return requireLogin('Bạn cần đăng nhập để trả lời.');
    if (!replyContent.trim()) return;
    try {
      const form = new FormData();
      form.append('content', replyContent.trim());
      replyFiles.forEach((f) => form.append('media', f));
      const c = await api.postForm(`/comments/${comment.id}/reply`, form);
      setComments((prev) => [...prev, c]);
      setReplyContent('');
      setReplyFiles([]);
      setReplyingTo(null);
    } catch (err: any) { alert(err.message); }
  };

  const startEditComment = (c: any) => {
    setEditingComment(c.id);
    setEditCommentContent(c.content);
    setEditCommentMedia(c.media || []);
    setEditCommentFiles([]);
  };

  const saveEditComment = async (c: any) => {
    if (!editCommentContent.trim()) return;
    try {
      const form = new FormData();
      form.append('content', editCommentContent.trim());
      form.append('keepMedia', JSON.stringify(editCommentMedia.map((m: any) => m.url)));
      editCommentFiles.forEach((f) => form.append('media', f));
      const updated = await api.putForm(`/comments/${c.id}`, form);
      setComments((prev) => prev.map((x) => x.id === c.id ? updated : x));
      setEditingComment(null);
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const deleteComment = async (cid: string) => {
    if (!confirm('Xoá bình luận này?')) return;
    try {
      await api.del(`/comments/${cid}`);
      const getAllDescendantIds = (parentId: string): string[] => {
        const children = comments.filter((c) => c.parentId === parentId);
        return children.reduce(
          (acc: string[], child: any) => [...acc, child.id, ...getAllDescendantIds(child.id)],
          []
        );
      };
      const toRemove = new Set([cid, ...getAllDescendantIds(cid)]);
      setComments((prev) => prev.filter((c) => !toRemove.has(c.id)));
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const doApprove = async () => {
    try { const p = await api.patch(`/posts/${id}/approve`); setPost((x: any) => ({ ...x, ...p })); setMenuOpen(false); window.dispatchEvent(new Event('bkafe-posts-changed')); }
    catch (e: any) { showToast(e.message, 'error'); }
  };
  const doReject = async () => {
    try { const p = await api.patch(`/posts/${id}/reject`, { reason: rejectReason }); setPost((x: any) => ({ ...x, ...p })); setRejectOpen(false); setMenuOpen(false); window.dispatchEvent(new Event('bkafe-posts-changed')); }
    catch (e: any) { showToast(e.message, 'error'); }
  };
  const doDelete = async () => {
    try {
      await api.del(`/posts/${id}`, deleteReason ? { reason: deleteReason } : undefined);
      setDeleteOpen(false);
      window.dispatchEvent(new Event('bkafe-posts-changed'));
      navigate(-1);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const addEditFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []) as File[];
    const invalid: string[] = [];
    const valid = selected.filter((f) => {
      if (f.type.startsWith('video/') && f.size > MAX_VID) { invalid.push(`"${f.name}" vượt quá 20MB`); return false; }
      if (f.type.startsWith('image/') && f.size > MAX_IMG) { invalid.push(`"${f.name}" vượt quá 5MB`); return false; }
      return true;
    });
    if (invalid.length) showToast(`File quá lớn: ${invalid.join(', ')}`, 'error');
    const totalSlots = editMedia.length + editNewFiles.length;
    const canAdd = Math.max(0, 5 - totalSlots);
    setEditNewFiles((prev) => [...prev, ...valid].slice(0, prev.length + canAdd));
    e.target.value = '';
  };

  const saveEdit = async () => {
    const form = new FormData();
    form.append('title', editData.title);
    form.append('content', editData.content);
    form.append('topic', editData.topic);
    form.append('keepMedia', JSON.stringify(editMedia.map((m) => m.url)));
    editNewFiles.forEach((f) => form.append('media', f));
    const p = await api.putForm(`/posts/${id}`, form);
    setPost((x: any) => ({ ...x, ...p }));
    setEditMedia(p.media || []);
    setEditNewFiles([]);
    setEditing(false);
    window.dispatchEvent(new Event('bkafe-posts-changed'));
    if (p.status === 'pending') {
      showToast('Bài viết đã được cập nhật và đang chờ duyệt lại.', 'info');
    } else {
      showToast('Bài viết đã được cập nhật thành công.', 'success');
    }
  };

  if (loading) return <div className="text-center" style={{ padding: '48px 0', color: 'var(--slate-500)', fontWeight: '700' }}>Đang tải nội dung...</div>;
  if (!post) return <div className="text-center" style={{ padding: '48px 0', color: 'var(--slate-500)', fontWeight: '700' }}>Không tìm thấy câu hỏi này.</div>;

  const topComments = comments.filter((c) => !c.parentId);
  const topicName = topics.find((t) => t.slug === post.topic)?.name || post.topic;
  
  const statusBadge = post.status === 'approved' ? null : (
    <span className="badge" style={{
      fontSize: '11px',
      padding: '2px 8px',
      borderRadius: '6px',
      border: '1px solid',
      textTransform: 'none',
      backgroundColor: post.status === 'pending' ? 'var(--amber-light)' : 'var(--red-light)',
      borderColor: post.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      color: post.status === 'pending' ? 'var(--amber-dark)' : 'var(--red-dark)'
    }}>
      {post.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}
    </span>
  );

  const renderComment = (c: any, depth: number = 0) => {
    const myRating = c.myRating ?? null;
    const isRealUser = c.authorId;
    const children = comments.filter((x) => x.parentId === c.id);
    const isCommentOwner = user && user.id === c.authorId;
    const isEditingThis = editingComment === c.id;

    return (
      <div key={c.id} style={{ display: 'flex', gap: '12px', marginTop: depth > 0 ? '12px' : '0' }}>
        <Link to={isRealUser ? `/profile/${c.authorId}` : '#'} style={{ flexShrink: 0 }}>
          <AvatarCircle url={c.authorPhotoURL} name={c.authorName} size={depth === 0 ? 'w-10 h-10' : 'w-8 h-8'} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditingThis ? (
            /* ── Edit mode ── */
            <div className="card" style={{ padding: '12px', backgroundColor: 'var(--slate-50)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                autoFocus
                rows={3}
                value={editCommentContent}
                onChange={(e) => setEditCommentContent(e.target.value)}
                className="form-textarea"
                style={{ backgroundColor: 'var(--white)' }}
              />
              {/* Media manager */}
              <div>
                <label className="form-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Ảnh / Video (tối đa 5)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {editCommentMedia.map((m: any, i: number) => (
                    <div key={`kem-${i}`} className="relative" style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--slate-200)' }}>
                      {m.type === 'video' ? <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <button
                        type="button"
                        onClick={() => setEditCommentMedia((p) => p.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'var(--white)', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', cursor: 'pointer' }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {editCommentFiles.map((f, i) => (
                    <div key={`kef-${i}`} className="relative" style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary-blue)' }}>
                      {f.type.startsWith('video/') ? <video src={URL.createObjectURL(f)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <button
                        type="button"
                        onClick={() => setEditCommentFiles((p) => p.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'var(--white)', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', cursor: 'pointer' }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {(editCommentMedia.length + editCommentFiles.length) < 5 && (
                    <label
                      className="btn btn-secondary"
                      style={{ width: '64px', height: '64px', borderRadius: '8px', border: '2px dashed var(--slate-300)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--slate-400)', cursor: 'pointer', boxShadow: 'none' }}
                    >
                      <Plus size={16} />
                      <span style={{ fontSize: '9px', fontWeight: '700' }}>Thêm</span>
                      <input type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={(e) => validateAndAddFiles(e.target.files, editCommentFiles, editCommentMedia.length, setEditCommentFiles)} />
                    </label>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setEditingComment(null)} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px', boxShadow: 'none' }}>Hủy</button>
                <button type="button" onClick={() => saveEditComment(c)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>Lưu</button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <>
              <div className="comment-card" style={{ display: 'inline-block', maxWidth: '100%', backgroundColor: 'var(--slate-100)', padding: '10px 16px', borderRadius: '16px' }}>
                <Link to={isRealUser ? `/profile/${c.authorId}` : '#'} style={{ fontWeight: '900', fontSize: '12px', color: 'var(--slate-900)', textDecoration: 'none' }} className="hover-underline">{c.authorName}</Link>
                <p style={{ fontSize: '14px', color: 'var(--slate-700)', marginTop: '4px', whitespace: 'pre-wrap', lineHeight: '1.6', fontWeight: '500' }}>{c.content}</p>
                {c.media?.length > 0 && (
                  <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: c.media.length === 1 ? '1fr' : '1fr 1fr', marginTop: '8px' }}>
                    {c.media.map((m: any, i: number) => m.type === 'video'
                      ? <video key={i} src={m.url} controls style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--slate-200)', maxHeight: '192px' }} />
                      : <a key={i} href={m.url} target="_blank" rel="noreferrer"><img src={m.url} alt="" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--slate-200)', objectFit: 'cover', maxHeight: '160px' }} /></a>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginTop: '4px', marginLeft: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--slate-500)' }}>
                <span>{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                {c.updatedAt && c.updatedAt !== c.createdAt && <span style={{ color: 'var(--slate-400)', fontWeight: 'normal' }}>(đã sửa)</span>}
                <button type="button" onClick={() => handleReplyClick(c)} className="btn-link" style={{ padding: 0 }}>Trả lời</button>
                <RatePopover myValue={myRating} onRate={(v) => rateComment(c, v)} />
                {c.ratingCount > 0 && (
                  <span className="flex-center" style={{ gap: '2px', color: 'var(--amber)' }}>
                    <Star size={14} style={{ fill: 'var(--amber)', color: 'var(--amber)' }} />
                    {c.ratingAvg.toFixed(1)}/5 ({c.ratingCount})
                  </span>
                )}
                {isCommentOwner && <button type="button" onClick={() => startEditComment(c)} className="btn-link" style={{ padding: 0, color: 'var(--primary-blue)' }}>Sửa</button>}
                {(isAdmin || isCommentOwner) && <button type="button" onClick={() => deleteComment(c.id)} className="btn-link" style={{ padding: 0, color: 'var(--red)' }}>Xoá</button>}
              </div>
            </>
          )}

          {/* Reply input */}
          {replyingTo === c.id && user && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="flex-center" style={{ gap: '8px' }}>
                <AvatarCircle url={user.photoURL} name={user.displayName} size="w-8 h-8" />
                <input
                  autoFocus
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submitReply(c); }}
                  placeholder={`Trả lời ${c.authorName}...`}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={() => submitReply(c)} className="btn btn-primary btn-circle" style={{ padding: '8px', width: '36px', height: '36px' }}><Send size={16} /></button>
              </div>
              {/* Reply file picker */}
              <div style={{ marginLeft: '40px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {replyFiles.map((f, i) => (
                  <div key={i} className="relative" style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary-blue)' }}>
                    {f.type.startsWith('video/') ? <video src={URL.createObjectURL(f)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <button
                      type="button"
                      onClick={() => setReplyFiles((p) => p.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'var(--white)', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', cursor: 'pointer' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {replyFiles.length < 5 && (
                  <label
                    className="btn btn-secondary"
                    style={{ width: '56px', height: '56px', borderRadius: '8px', border: '2px dashed var(--slate-300)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--slate-400)', cursor: 'pointer', boxShadow: 'none' }}
                  >
                    <Plus size={14} />
                    <span style={{ fontSize: '8px', fontWeight: '700' }}>Ảnh/Video</span>
                    <input type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={(e) => validateAndAddFiles(e.target.files, replyFiles, 0, setReplyFiles)} />
                  </label>
                )}
              </div>
            </div>
          )}
          {children.length > 0 && (
            <div className={depth < 2 ? "comment-nested-list" : ""} style={{ marginTop: '8px' }}>
              {children.map((r) => renderComment(r, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '768px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ alignSelf: 'flex-start', boxShadow: 'none' }}
      >
        <ArrowLeft size={16} />
        Quay lại
      </button>

      <div className="card">
        <div className="post-card-header" style={{ marginBottom: '20px' }}>
          <div className="post-card-author">
            <Link to={post.authorId ? `/profile/${post.authorId}` : '#'} style={{ flexShrink: 0 }}>
              <AvatarCircle url={post.authorPhotoURL} name={post.authorName} size="w-12 h-12" />
            </Link>
            <div>
              <Link to={post.authorId ? `/profile/${post.authorId}` : '#'} style={{ fontWeight: '750', fontSize: '16px', color: 'var(--slate-900)', textDecoration: 'none' }} className="hover-underline">{post.authorName}</Link>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '2px', fontSize: '12px', color: 'var(--slate-400)', fontWeight: '600' }}>
                <span>{new Date(post.createdAt).toLocaleString('vi-VN')}</span>
                <span>·</span>
                <span className="flex-center" style={{ gap: '2px' }}><Eye size={14} /> {post.views || 0}</span>
                <span>·</span>
                <Link to={`/topic/${post.topic}`} style={{ color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }} className="hover-underline"><Hash size={12} />{topicName}</Link>
                {statusBadge}
              </div>
            </div>
          </div>

          {/* Admin / owner management menu */}
          {(isAdmin || isOwner) && (
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="btn-icon">
                <MoreVertical size={20} />
              </button>
              {menuOpen && (
                <>
                  <div className="dropdown-overlay" onClick={() => setMenuOpen(false)} />
                  <div className="context-menu" style={{ display: 'flex', flexDirection: 'column' }}>
                    {isAdmin && post.status === 'pending' && <button onClick={doApprove} className="context-menu-item" style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} /> Duyệt bài</button>}
                    {isAdmin && post.status === 'pending' && <button onClick={() => { setRejectOpen(true); setMenuOpen(false); }} className="context-menu-item" style={{ color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '8px' }}><XCircle size={16} /> Từ chối duyệt</button>}
                    {isAdmin && post.status === 'rejected' && <button onClick={doApprove} className="context-menu-item" style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} /> Duyệt lại</button>}
                    {isOwner && post.status !== 'rejected' && <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="context-menu-item" style={{ color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}><Edit size={16} /> Sửa bài</button>}
                    {(isAdmin || isOwner) && <button onClick={() => { setDeleteOpen(true); setMenuOpen(false); }} className="context-menu-item context-menu-item-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Trash2 size={16} /> Xoá bài</button>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {post.status === 'rejected' && post.rejectReason && (
          <div className="alert alert-danger">Lý do từ chối: {post.rejectReason}</div>
        )}

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select value={editData.topic} onChange={(e) => setEditData({ ...editData, topic: e.target.value })} className="form-select">
              {topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
            <input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} placeholder="Tiêu đề (có thể bỏ trống)" className="form-input" style={{ fontWeight: '700' }} />
            <textarea value={editData.content} onChange={(e) => setEditData({ ...editData, content: e.target.value })} rows={5} className="form-textarea" />

            {/* Media manager */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ảnh / Video (tối đa 5)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {editMedia.map((m: any, i: number) => (
                  <div key={`existing-${i}`} className="relative" style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--slate-200)', backgroundColor: 'var(--slate-50)' }}>
                    {m.type === 'video'
                      ? <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <button
                      type="button"
                      onClick={() => setEditMedia((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'var(--white)', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {editNewFiles.map((f, i) => (
                  <div key={`new-${i}`} className="relative" style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--primary-blue)', backgroundColor: 'var(--primary-light)' }}>
                    {f.type.startsWith('video/')
                      ? <video src={URL.createObjectURL(f)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <button
                      type="button"
                      onClick={() => setEditNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'var(--white)', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {(editMedia.length + editNewFiles.length) < 5 && (
                  <label
                    className="btn btn-secondary"
                    style={{ width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed var(--slate-300)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--slate-400)', cursor: 'pointer', boxShadow: 'none' }}
                  >
                    <Plus size={24} />
                    <span style={{ fontSize: '10px', fontWeight: '700' }}>Thêm</span>
                    <input type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={addEditFiles} />
                  </label>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => { setEditing(false); setEditNewFiles([]); setEditMedia(post.media || []); }} className="btn btn-secondary" style={{ boxShadow: 'none' }}>Hủy</button>
              <button onClick={saveEdit} className="btn btn-primary">Lưu</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="post-card-title" style={{ fontSize: '24px', marginBottom: '12px', lineHeight: 1.3 }}>
              {post.title?.trim() || post.content?.substring(0, 60) + (post.content?.length > 60 ? '...' : '')}
            </h1>
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--slate-100)' }}>
              <StarRatingDisplay rating={post.ratingAvg || 0} count={post.ratingCount || 0} />
            </div>
            <div style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--slate-700)', whitespace: 'pre-wrap', fontWeight: '500', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {post.content}
            </div>

            {/* Media */}
            {post.media?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {post.media.map((m: any, i: number) => m.type === 'video' ? (
                  <video key={i} src={m.url} controls style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--slate-200)', gridColumn: 'span 2' }} />
                ) : (
                  <a key={i} href={m.url} target="_blank" rel="noreferrer">
                    <img src={m.url} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--slate-200)' }} className="hover-opacity" />
                  </a>
                ))}
              </div>
            )}

            <div className="post-card-footer" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate-500)' }}>
              <div className="post-card-stat-item">
                <RatePopover myValue={post.myRating ?? null} onRate={ratePost} direction="down" starSize={20} />
              </div>
              <div className="post-card-stat-item">
                <MessageCircle size={20} style={{ color: 'var(--slate-400)' }} />
                <span>Bình luận ({comments.length})</span>
              </div>
              <button onClick={share} className="btn" style={{ marginLeft: 'auto', padding: '6px 12px', border: 'none', boxShadow: 'none', background: 'none', color: 'var(--slate-500)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Share2 size={20} />
                <span>Chia sẻ ({post.shares || 0})</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Reject modal */}
      {rejectOpen && (
        <div className="modal-overlay" onClick={() => setRejectOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '448px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--slate-900)', marginBottom: '12px' }}>Từ chối duyệt bài viết</h3>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: '600', marginBottom: '12px' }}>Chọn lý do (sẽ gửi thông báo cho người đăng):</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {REJECT_REASONS.map((r) => (
                <label
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: rejectReason === r ? '2px solid var(--primary-blue)' : '1px solid var(--slate-200)',
                    backgroundColor: rejectReason === r ? 'var(--primary-light)' : 'var(--white)',
                    color: rejectReason === r ? 'var(--primary-dark)' : 'var(--slate-700)',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  <input type="radio" name="reason" checked={rejectReason === r} onChange={() => setRejectReason(r)} />
                  {r}
                </label>
              ))}
              <input type="text" placeholder="Hoặc nhập lý do khác..." onChange={(e) => setRejectReason(e.target.value)} className="form-input" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setRejectOpen(false)} className="btn btn-secondary" style={{ boxShadow: 'none' }}>Hủy</button>
              <button onClick={doReject} className="btn btn-danger">Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div className="modal-overlay" onClick={() => setDeleteOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '448px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--slate-900)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={20} style={{ color: 'var(--red)' }} /> Xoá câu hỏi
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: '600', marginBottom: '12px' }}>
              {isAdmin && !isOwner
                ? 'Lý do xoá (sẽ gửi thông báo cho người đăng):'
                : 'Xác nhận xoá bài viết này?'}
            </p>
            {isAdmin && !isOwner && (
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Nhập lý do xoá..."
                className="form-input"
                style={{ marginBottom: '16px' }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setDeleteOpen(false)} className="btn btn-secondary" style={{ boxShadow: 'none' }}>Hủy</button>
              <button onClick={doDelete} className="btn btn-danger">Xác nhận xoá</button>
            </div>
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 className="comments-title" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--slate-100)' }}>Phần bình luận và giải đáp</h2>
        {user ? (
          <form onSubmit={submitComment} className="comment-form" style={{ backgroundColor: 'var(--slate-50)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--slate-600)', backgroundColor: 'var(--slate-100)', border: '1px solid var(--slate-200)', padding: '8px 12px', borderRadius: '12px', width: 'fit-content', marginBottom: '12px' }}>
              <span className="notification-dot animate-pulse" style={{ backgroundColor: 'var(--green)' }}></span>
              Đang gửi với tên: <span style={{ color: 'var(--slate-900)' }}>{user.displayName}</span> ({user.email})
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nội dung bình luận <Req /></label>
              <textarea required rows={3} value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="form-textarea" style={{ backgroundColor: 'var(--white)' }} placeholder="Đóng góp lời giải..." />
            </div>
            {/* Media attachment */}
            {commentFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {commentFiles.map((f, i) => (
                  <div key={i} className="relative" style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--primary-blue)' }}>
                    {f.type.startsWith('video/') ? <video src={URL.createObjectURL(f)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <button
                      type="button"
                      onClick={() => setCommentFiles((p) => p.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'var(--white)', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', cursor: 'pointer' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(226, 232, 240, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {commentFiles.length < 5 && (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: 'var(--slate-500)', cursor: 'pointer' }}>
                    <ImagePlus size={16} />
                    Ảnh/Video
                    <input type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={(e) => validateAndAddFiles(e.target.files, commentFiles, 0, setCommentFiles)} />
                  </label>
                )}
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--slate-400)' }} className="hidden-tablet">Chấm điểm bằng nút <span style={{ color: 'var(--amber)', fontWeight: '700' }}>Đánh giá</span> phía trên.</span>
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '8px 16px', flexShrink: 0 }}>{submitting ? 'Đang gửi...' : 'Đăng bình luận'}</button>
            </div>
          </form>
        ) : (
          <div style={{ backgroundColor: 'var(--primary-light)', borderColor: 'rgba(37, 99, 235, 0.1)', padding: '16px', borderRadius: '16px', border: '1px solid', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: '750', color: 'var(--primary-dark)' }}>
              Bạn cần <Link to="/login" style={{ textDecoration: 'underline', color: 'var(--primary-blue)', fontWeight: '900' }}>Đăng nhập</Link> hoặc <Link to="/register" style={{ textDecoration: 'underline', color: 'var(--primary-blue)', fontWeight: '900' }}>Đăng ký</Link> để bình luận và đánh giá.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
          {topComments.map((c) => renderComment(c, 0))}

          {topComments.length === 0 && (
            <div className="card text-center" style={{ padding: '32px 16px', color: 'var(--slate-400)', fontWeight: '700', fontSize: '14px', backgroundColor: 'var(--slate-50)' }}>
              Chưa có bình luận nào. Hãy đóng góp câu trả lời đầu tiên!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

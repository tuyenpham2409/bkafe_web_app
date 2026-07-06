import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Share2, Eye, Star, MessageCircle, CornerDownRight, Send } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Small reusable UI helpers                                          */
/* ------------------------------------------------------------------ */

// Round avatar that shows the uploaded photo or falls back to the initial letter.
function AvatarCircle({ url, name, size, className = '' }: { url?: string; name?: string; size: string; className?: string }) {
  if (url) {
    return <img src={url} alt={name || ''} className={`${size} rounded-full object-cover border border-slate-200 ${className}`} />;
  }
  return (
    <div className={`${size} rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 ${className}`}>
      {name?.charAt(0).toUpperCase() || 'U'}
    </div>
  );
}

// Read-only summary: "★★★★☆  4.2/5 (12 đánh giá)"
function StarRatingDisplay({ rating, count = 0 }: { rating: number; count?: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`w-4 h-4 ${rounded >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
        ))}
      </div>
      {count > 0 ? (
        <span className="text-xs font-bold text-slate-500">{rating.toFixed(1)}/5 ({count} đánh giá)</span>
      ) : (
        <span className="text-xs font-bold text-slate-400">Chưa có đánh giá</span>
      )}
    </div>
  );
}

// Inline star picker used inside the review form (hover to preview, click to choose).
function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover !== null ? hover : value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onClick={() => onChange(s)}
          className="p-0.5 transition-transform hover:scale-110"
          title={`${s} sao`}
        >
          <Star className={`w-7 h-7 ${shown >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
        </button>
      ))}
      <span className="ml-2 text-sm font-black text-slate-600">{value}/5</span>
    </div>
  );
}

// Click to open, hover to preview, click a star to confirm (does not disappear on small mouse moves).
function RatePopover({ myValue, onRate }: { myValue: number | null; onRate: (v: number) => void }) {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover !== null ? hover : (myValue ?? 0);

  const trigger = () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để đánh giá bình luận!');
      return;
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={trigger}
        className={`flex items-center gap-1 transition-colors ${myValue !== null ? 'text-amber-500 font-extrabold' : 'text-slate-500 hover:text-amber-500'}`}
      >
        <Star className={`w-3.5 h-3.5 ${myValue !== null ? 'fill-current' : ''}`} />
        {myValue !== null ? `Đã đánh giá ${myValue}★` : 'Đánh giá'}
      </button>

      {open && (
        <>
          {/* click-outside catcher */}
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setHover(null); }} />
          <div
            onMouseLeave={() => setHover(null)}
            className="absolute bottom-full left-0 mb-1.5 bg-white border border-slate-200 shadow-xl rounded-full px-2.5 py-1.5 flex items-center gap-0.5 z-20 animate-in fade-in slide-in-from-bottom-1"
          >
            <button
              type="button"
              onMouseEnter={() => setHover(0)}
              onClick={() => { onRate(0); setOpen(false); setHover(null); }}
              className="text-[10px] font-extrabold text-slate-400 hover:text-red-500 px-1 mr-0.5 border-r border-slate-100"
              title="0 sao"
            >
              0
            </button>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHover(s)}
                onClick={() => { onRate(s); setOpen(false); setHover(null); }}
                className="p-0.5 transition-transform hover:scale-125"
                title={`${s} sao`}
              >
                <Star className={`w-4 h-4 ${shown >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rating helper: keeps one rating per user in a `ratings` map        */
/* ------------------------------------------------------------------ */
async function applyRating(
  collectionName: 'posts' | 'comments',
  docId: string,
  existingRatings: Record<string, number> | undefined,
  uid: string,
  value: number
) {
  const newRatings: Record<string, number> = { ...(existingRatings || {}) };
  newRatings[uid] = value;
  const values = Object.values(newRatings);
  const count = values.length;
  const avg = count ? values.reduce((a, b) => a + b, 0) / count : 0;
  await updateDoc(doc(db, collectionName, docId), { ratings: newRatings, ratingAvg: avg, ratingCount: count });
  return { ratings: newRatings, ratingAvg: avg, ratingCount: count };
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();

  // Review form state
  const [commentContent, setCommentContent] = useState('');
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [postRating, setPostRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Sync identity fields from the logged-in account
  useEffect(() => {
    if (currentUser && userData) {
      setCommentName(userData.displayName || '');
      setCommentEmail(currentUser.email || '');
    } else {
      setCommentName('');
      setCommentEmail('');
    }
  }, [currentUser, userData]);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          setPost(data);
          // Pre-fill the review stars with this user's existing rating (if any)
          if (currentUser && data.ratings && data.ratings[currentUser.uid] !== undefined) {
            setPostRating(data.ratings[currentUser.uid]);
          }
          // Count a view (rules require auth; guests simply don't increment)
          try { await updateDoc(docRef, { views: increment(1) }); } catch { /* ignore for guests */ }
        }

        const q = query(collection(db, 'comments'), where('postId', '==', id));
        const commentsSnap = await getDocs(q);
        const fetched = commentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        fetched.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setComments(fetched);
      } catch (error) {
        console.error('Error fetching detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndComments();
  }, [id, currentUser]);

  const handleShare = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'posts', id), { shares: increment(1) });
      setPost((prev: any) => ({ ...prev, shares: (prev.shares || 0) + 1 }));
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết vào bộ nhớ tạm!');
    } catch (e) {
      console.error(e);
    }
  };

  // Submit a top-level review: creates a comment AND records the star rating for the post.
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    if (!commentContent.trim()) {
      alert('Vui lòng nhập nội dung bình luận!');
      return;
    }

    setSubmitting(true);
    try {
      const newComment = {
        postId: id,
        authorId: currentUser.uid,
        authorName: commentName.trim(),
        authorEmail: commentEmail.trim(),
        authorPhotoURL: userData?.photoURL || '',
        content: commentContent.trim(),
        parentId: null,
        postRating,
        ratings: {},
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'comments'), newComment);

      // Record this user's rating on the post itself
      const updated = await applyRating('posts', id, post.ratings, currentUser.uid, postRating);
      setPost((prev: any) => ({ ...prev, ...updated }));

      setComments([
        { id: docRef.id, ...newComment, createdAt: { toMillis: () => Date.now(), toDate: () => new Date() } },
        ...comments,
      ]);
      setCommentContent('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Đã xảy ra lỗi khi gửi bình luận.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit a reply to a comment
  const submitReply = async (parentId: string) => {
    if (!id || !currentUser || !replyContent.trim()) return;
    setReplySubmitting(true);
    try {
      const newReply = {
        postId: id,
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email || 'User',
        authorEmail: currentUser.email || '',
        authorPhotoURL: userData?.photoURL || '',
        content: replyContent.trim(),
        parentId,
        ratings: {},
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'comments'), newReply);
      setComments((prev) => [
        ...prev,
        { id: docRef.id, ...newReply, createdAt: { toMillis: () => Date.now(), toDate: () => new Date() } },
      ]);
      setReplyContent('');
      setReplyingTo(null);
    } catch (e) {
      console.error('Error adding reply:', e);
      alert('Đã xảy ra lỗi khi gửi trả lời.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const rateComment = async (comment: any, value: number) => {
    if (!currentUser) return;
    try {
      const updated = await applyRating('comments', comment.id, comment.ratings, currentUser.uid, value);
      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, ...updated } : c)));
    } catch (e) {
      console.error('Error rating comment:', e);
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500 font-bold">Đang tải nội dung...</div>;
  if (!post) return <div className="text-center py-12 text-slate-500 font-bold">Không tìm thấy câu hỏi này.</div>;

  const topComments = comments.filter((c) => !c.parentId);
  const repliesOf = (pid: string) =>
    comments
      .filter((c) => c.parentId === pid)
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));

  // Renders a single comment (top-level or reply)
  const renderComment = (comment: any, isReply: boolean) => {
    const myRating = currentUser ? (comment.ratings?.[currentUser.uid] ?? null) : null;
    const isRealUser = comment.authorId && comment.authorId !== 'anonymous';
    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'mt-3' : ''}`}>
        <Link
          to={isRealUser ? `/profile/${comment.authorId}` : '#'}
          className={isRealUser ? 'hover:ring-2 ring-blue-500 rounded-full transition-all shrink-0' : 'shrink-0 cursor-default'}
        >
          <AvatarCircle url={comment.authorPhotoURL} name={comment.authorName} size={isReply ? 'w-8 h-8' : 'w-10 h-10'} />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="inline-block bg-slate-100 border border-slate-200/40 rounded-2xl px-4 py-2.5 max-w-full">
            <div className="flex items-center gap-2">
              <Link
                to={isRealUser ? `/profile/${comment.authorId}` : '#'}
                className={`font-black text-xs text-slate-900 ${isRealUser ? 'hover:underline hover:text-blue-600' : 'cursor-default'}`}
              >
                {comment.authorName}
              </Link>
              {!isRealUser && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-md">Vãng lai</span>
              )}
            </div>
            <p className="text-[14px] text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed font-medium">{comment.content}</p>
          </div>

          {/* Footer: time · reply · rate · average */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 ml-2 text-xs text-slate-500 font-bold">
            <span>{comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'}</span>

            {!isReply && (
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) { alert('Vui lòng đăng nhập để trả lời!'); return; }
                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                }}
                className="hover:text-blue-600 transition-colors"
              >
                Trả lời
              </button>
            )}

            <RatePopover myValue={myRating} onRate={(v) => rateComment(comment, v)} />

            {comment.ratingCount > 0 && (
              <span className="flex items-center gap-0.5 text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {comment.ratingAvg.toFixed(1)}/5 ({comment.ratingCount})
              </span>
            )}
          </div>

          {/* Reply form */}
          {!isReply && replyingTo === comment.id && currentUser && (
            <div className="flex items-center gap-2 mt-2">
              <AvatarCircle url={userData?.photoURL} name={commentName} size="w-8 h-8" />
              <input
                type="text"
                autoFocus
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitReply(comment.id); }}
                placeholder={`Trả lời ${comment.authorName}...`}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => submitReply(comment.id)}
                disabled={replySubmitting || !replyContent.trim()}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-40"
                title="Gửi trả lời"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Nested replies */}
          {!isReply && repliesOf(comment.id).length > 0 && (
            <div className="mt-2 pl-4 border-l-2 border-slate-100">
              {repliesOf(comment.id).map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Post card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3.5 mb-5">
          <Link
            to={post.authorId ? `/profile/${post.authorId}` : '#'}
            className="hover:ring-2 ring-blue-500 rounded-full transition-all shrink-0"
          >
            <AvatarCircle url={post.authorPhotoURL} name={post.authorName} size="w-12 h-12" className="text-lg" />
          </Link>
          <div>
            <Link
              to={post.authorId ? `/profile/${post.authorId}` : '#'}
              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-base"
            >
              {post.authorName}
            </Link>
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString('vi-VN') : ''}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" /> {post.views || 0} lượt xem</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 leading-tight mb-3">{post.title}</h1>

        {/* Post rating summary (average of all reviewers) */}
        <div className="mb-5 pb-4 border-b border-slate-100">
          <StarRatingDisplay rating={post.ratingAvg || 0} count={post.ratingCount || 0} />
        </div>

        <div className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium mb-6">{post.content}</div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 text-slate-500 font-bold text-sm">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <MessageCircle className="w-5 h-5 text-slate-400" />
            <span>Thảo luận ({comments.length})</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:bg-slate-50 hover:text-blue-600 px-3 py-2 rounded-xl transition-all ml-auto"
          >
            <Share2 className="w-5 h-5" />
            <span>Chia sẻ ({post.shares || 0})</span>
          </button>
        </div>
      </div>

      {/* Discussion */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-black text-slate-900 tracking-tight pb-3 border-b border-slate-100">
          Phần bình luận và giải đáp
        </h2>

        {/* Review form (logged-in only) */}
        {currentUser ? (
          <form onSubmit={submitComment} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <h3 className="font-extrabold text-sm text-slate-700">Đóng góp ý kiến & Đánh giá</h3>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl w-fit">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Đang gửi với tên: <span className="text-slate-900">{commentName}</span> ({commentEmail})
            </div>

            {/* Star rating for the post */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Đánh giá của bạn cho bài viết *</label>
              <StarSelector value={postRating} onChange={setPostRating} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nội dung bình luận *</label>
              <textarea
                required
                rows={3}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white resize-none"
                placeholder="Bạn nghĩ gì về câu hỏi này? Đóng góp lời giải..."
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200/40">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-100"
              >
                {submitting ? 'Đang gửi...' : 'Đăng bình luận & đánh giá'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 text-center space-y-2">
            <p className="text-sm font-bold text-blue-700 leading-relaxed">
              Bạn cần{' '}
              <Link to="/login" className="underline text-blue-800 hover:text-blue-950 font-black">Đăng nhập</Link>{' '}
              hoặc{' '}
              <Link to="/register" className="underline text-blue-800 hover:text-blue-950 font-black">Đăng ký tài khoản</Link>{' '}
              để gửi bình luận và đánh giá bài đăng này.
            </p>
          </div>
        )}

        {/* Comment list */}
        <div className="space-y-5 pt-4">
          {topComments.map((comment) => renderComment(comment, false))}

          {topComments.length === 0 && (
            <div className="text-center py-8 bg-slate-50 rounded-2xl text-slate-400 font-bold text-sm flex flex-col items-center gap-1">
              <CornerDownRight className="w-5 h-5 text-slate-300" />
              Chưa có bình luận nào. Hãy đóng góp câu trả lời đầu tiên!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

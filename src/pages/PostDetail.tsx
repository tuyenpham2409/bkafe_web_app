import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Share2, Eye, Star, MessageCircle } from 'lucide-react';

// Star Rating Display helper
function StarRatingDisplay({ rating, count = 0 }: { rating: number, count?: number }) {
  const roundedStars = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${roundedStars >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} 
          />
        ))}
      </div>
      {count > 0 ? (
        <span className="text-xs font-bold text-slate-500 ml-1.5">
          {rating.toFixed(1)}/5 ({count} đánh giá)
        </span>
      ) : (
        <span className="text-xs font-bold text-slate-400 ml-1.5">Chưa có đánh giá</span>
      )}
    </div>
  );
}

// Clickable Comment Rating Component (0-5 stars)
function CommentRating({ 
  commentId, 
  initialRating = 0, 
  initialCount = 0,
  onRate
}: { 
  commentId: string, 
  initialRating?: number, 
  initialCount?: number,
  onRate?: (rating: number, count: number) => void
}) {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(initialRating);
  const [count, setCount] = useState(initialCount);
  const [showPopover, setShowPopover] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);

  // Load user's vote from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('bkafe_comment_ratings') || '{}');
    if (saved[commentId] !== undefined) {
      setMyRating(saved[commentId]);
    }
  }, [commentId]);

  useEffect(() => {
    setRating(initialRating);
    setCount(initialCount);
  }, [initialRating, initialCount]);

  const handleRate = async (value: number) => {
    try {
      let newCount = count;
      let newRating = rating;

      const saved = JSON.parse(localStorage.getItem('bkafe_comment_ratings') || '{}');
      const oldValue = saved[commentId];

      if (oldValue === undefined) {
        // First time rating
        newCount = count + 1;
        newRating = ((rating * count) + value) / newCount;
      } else {
        // Change rating
        newRating = ((rating * count) - oldValue + value) / count;
      }

      setRating(newRating);
      setCount(newCount);
      setMyRating(value);

      saved[commentId] = value;
      localStorage.setItem('bkafe_comment_ratings', JSON.stringify(saved));

      await updateDoc(doc(db, 'comments', commentId), {
        ratingAvg: newRating,
        ratingCount: newCount
      });
      
      if (onRate) {
        onRate(newRating, newCount);
      }
      setShowPopover(false);
    } catch (e) {
      console.error("Error rating comment:", e);
    }
  };

  const handleTriggerClick = () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để đánh giá bình luận!");
      return;
    }
    setShowPopover(!showPopover);
  };

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={handleTriggerClick}
        className={`hover:text-amber-500 transition-colors flex items-center gap-0.5 cursor-pointer ${myRating !== null ? 'text-amber-500 font-extrabold' : 'text-slate-500'}`}
      >
        {myRating !== null ? `Đã đánh giá: ${myRating}★` : `Đánh giá`} {count > 0 ? `(${rating.toFixed(1)}★)` : ''}
      </button>
      
      {showPopover && (
        <>
          {/* Overlay to close popover when clicking outside */}
          <div className="fixed inset-0 z-10" onClick={() => setShowPopover(false)} />
          <div className="absolute bottom-full left-0 mb-1.5 bg-white border border-slate-200 shadow-xl rounded-full px-3 py-1.5 flex items-center gap-1.5 z-20 animate-in fade-in slide-in-from-bottom-2">
            <button 
              type="button"
              onClick={() => handleRate(0)}
              className="text-xs font-extrabold text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded border-r border-slate-100 pr-2 mr-0.5"
              title="0 sao"
            >
              0★
            </button>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                className="text-slate-200 hover:text-amber-400 hover:scale-125 transition-all p-0.5"
              >
                <Star className={`w-4 h-4 hover:fill-amber-400 ${myRating !== null && myRating >= star ? 'text-amber-400 fill-current' : 'text-slate-200 fill-current'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Clickable Post Rating Widget (0-5 stars)
function PostRatingWidget({ 
  postId, 
  initialRating = 0, 
  initialCount = 0,
  onRate
}: { 
  postId: string, 
  initialRating?: number, 
  initialCount?: number,
  onRate?: (rating: number, count: number) => void
}) {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(initialRating);
  const [count, setCount] = useState(initialCount);
  const [showPopover, setShowPopover] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);

  // Load user's vote from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('bkafe_post_ratings') || '{}');
    if (saved[postId] !== undefined) {
      setMyRating(saved[postId]);
    }
  }, [postId]);

  useEffect(() => {
    setRating(initialRating);
    setCount(initialCount);
  }, [initialRating, initialCount]);

  const handleRate = async (value: number) => {
    try {
      let newCount = count;
      let newRating = rating;

      const saved = JSON.parse(localStorage.getItem('bkafe_post_ratings') || '{}');
      const oldValue = saved[postId];

      if (oldValue === undefined) {
        // First time rating
        newCount = count + 1;
        newRating = ((rating * count) + value) / newCount;
      } else {
        // Change rating
        newRating = ((rating * count) - oldValue + value) / count;
      }

      setRating(newRating);
      setCount(newCount);
      setMyRating(value);

      saved[postId] = value;
      localStorage.setItem('bkafe_post_ratings', JSON.stringify(saved));

      await updateDoc(doc(db, 'posts', postId), {
        ratingAvg: newRating,
        ratingCount: newCount
      });
      
      if (onRate) {
        onRate(newRating, newCount);
      }
      setShowPopover(false);
    } catch (e) {
      console.error("Error rating post:", e);
    }
  };

  const handleTriggerClick = () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để đánh giá bài viết!");
      return;
    }
    setShowPopover(!showPopover);
  };

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={handleTriggerClick}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:bg-slate-50 cursor-pointer ${myRating !== null ? 'text-amber-500 bg-amber-50/40 hover:bg-amber-50' : 'text-slate-500 hover:text-amber-500'}`}
      >
        <Star className={`w-5 h-5 ${myRating !== null ? 'fill-current' : ''}`} />
        <span>
          {myRating !== null ? `Đã đánh giá: ${myRating}★` : `Đánh giá bài viết`} {count > 0 ? `(${rating.toFixed(1)}★)` : ''}
        </span>
      </button>

      {showPopover && (
        <>
          {/* Overlay to close popover when clicking outside */}
          <div className="fixed inset-0 z-10" onClick={() => setShowPopover(false)} />
          <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 shadow-xl rounded-full px-3 py-1.5 flex items-center gap-1.5 z-20 animate-in fade-in slide-in-from-top-2">
            <button 
              type="button"
              onClick={() => handleRate(0)}
              className="text-xs font-extrabold text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded border-r border-slate-100 pr-2 mr-0.5"
              title="0 sao"
            >
              0★
            </button>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                className="text-slate-200 hover:text-amber-400 hover:scale-125 transition-all p-0.5"
              >
                <Star className={`w-4 h-4 hover:fill-amber-400 ${myRating !== null && myRating >= star ? 'text-amber-400 fill-current' : 'text-slate-200 fill-current'}`} />
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
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();

  // Form states
  const [commentContent, setCommentContent] = useState('');
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [postRating, setPostRating] = useState(5); // Default 5 stars
  const [submitting, setSubmitting] = useState(false);

  // Sync user info into fields when logged in
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
          setPost({ id: docSnap.id, ...docSnap.data() });
          await updateDoc(docRef, { views: increment(1) });
        }

        const q = query(collection(db, 'comments'), where('postId', '==', id));
        const commentsSnap = await getDocs(q);
        const fetchedComments = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedComments.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setComments(fetchedComments);
      } catch (error) {
        console.error("Error fetching detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndComments();
  }, [id]);

  const handleLike = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'posts', id), { likes: increment(1) });
      setPost((prev: any) => ({ ...prev, likes: (prev.likes || 0) + 1 }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'posts', id), { shares: increment(1) });
      setPost((prev: any) => ({ ...prev, shares: (prev.shares || 0) + 1 }));
      navigator.clipboard.writeText(window.location.href);
      alert("Đã sao chép liên kết vào bộ nhớ tạm!");
    } catch (e) {
      console.error(e);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    if (!commentName.trim() || !commentEmail.trim() || !commentContent.trim()) {
      alert("Vui lòng điền đầy đủ các trường thông tin!");
      return;
    }

    setSubmitting(true);
    try {
      const newComment = {
        postId: id,
        authorId: currentUser ? currentUser.uid : 'anonymous',
        authorName: commentName.trim(),
        authorEmail: commentEmail.trim(),
        content: commentContent.trim(),
        postRating: postRating,
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), newComment);
      
      // Update local comments state
      setComments([{
        id: docRef.id,
        ...newComment,
        createdAt: { toDate: () => new Date() } // placeholder for instant display
      }, ...comments]);
      
      setCommentContent('');
      // Reset postRating to 5, reset anonymous inputs if not logged in
      setPostRating(5);
      if (!currentUser) {
        setCommentName('');
        setCommentEmail('');
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Đã xảy ra lỗi khi gửi bình luận.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500 font-bold">Đang tải nội dung...</div>;
  if (!post) return <div className="text-center py-12 text-slate-500 font-bold">Không tìm thấy câu hỏi này.</div>;

  const averagePostRating = post?.ratingAvg || 0;
  const totalPostRatingCount = post?.ratingCount || 0;

  return (
    <div className="space-y-6">
      {/* Post Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {/* Post Meta */}
        <div className="flex items-center gap-3.5 mb-5">
          <Link 
            to={post.authorId ? `/profile/${post.authorId}` : '#'} 
            className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 text-lg hover:ring-2 ring-blue-500 transition-all shrink-0"
          >
            {post.authorName?.charAt(0).toUpperCase() || 'U'}
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

        {/* Post Title */}
        <h1 className="text-2xl font-black text-slate-900 leading-tight mb-3">{post.title}</h1>
        
        {/* Post Star Rating (Dynamic average from reviews) */}
        <div className="mb-5 pb-4 border-b border-slate-100">
          <StarRatingDisplay rating={averagePostRating} count={totalPostRatingCount} />
        </div>

        {/* Post Body */}
        <div className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium mb-6">
          {post.content}
        </div>

        {/* Post Actions */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 text-slate-500 font-bold text-sm">
          <button 
            onClick={handleLike} 
            className="flex items-center gap-1.5 hover:bg-slate-50 hover:text-red-600 px-3 py-2 rounded-xl transition-all"
          >
            <Heart className="w-5 h-5" />
            <span>Thích ({post.likes || 0})</span>
          </button>
          
          {/* Post Rating widget */}
          <PostRatingWidget 
            postId={post.id} 
            initialRating={post.ratingAvg || 0} 
            initialCount={post.ratingCount || 0}
            onRate={(newRating, newCount) => {
              setPost((prev: any) => ({ ...prev, ratingAvg: newRating, ratingCount: newCount }));
            }}
          />

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

      {/* Discussion & Comments */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-black text-slate-900 tracking-tight pb-3 border-b border-slate-100">
          Phần bình luận và giải đáp
        </h2>
        
        {/* Comment Form (Open to Logged-in Users only) */}
        {currentUser ? (
          <form onSubmit={submitComment} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <h3 className="font-extrabold text-sm text-slate-700">Đóng góp ý kiến & Đánh giá</h3>
            
            {/* Identity fields */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl w-fit">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Đang gửi với tên: <span className="text-slate-900">{commentName}</span> ({commentEmail})
            </div>

            {/* Comment text area */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nội dung bình luận *</label>
              <textarea 
                required 
                rows={3}
                value={commentContent}
                onChange={e => setCommentContent(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white resize-none"
                placeholder="Bạn nghĩ gì về câu hỏi này? Đóng góp lời giải..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2 border-t border-slate-200/40">
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-100"
              >
                {submitting ? 'Đang gửi...' : 'Đăng bình luận'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 text-center space-y-2">
            <p className="text-sm font-bold text-blue-700 leading-relaxed">
              Bạn cần{" "}
              <Link to="/login" className="underline text-blue-800 hover:text-blue-950 font-black">
                Đăng nhập
              </Link>{" "}
              hoặc{" "}
              <Link to="/register" className="underline text-blue-800 hover:text-blue-950 font-black">
                Đăng ký tài khoản
              </Link>{" "}
              để gửi bình luận và đánh giá bài đăng này.
            </p>
          </div>
        )}

        {/* Facebook-style Comment List */}
        <div className="space-y-5 pt-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {/* Commenter Avatar */}
              <Link 
                to={comment.authorId !== 'anonymous' ? `/profile/${comment.authorId}` : '#'} 
                className={`w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 text-sm shrink-0 ${comment.authorId !== 'anonymous' ? 'hover:ring-2 ring-blue-500 transition-all' : 'cursor-default'}`}
              >
                {comment.authorName?.charAt(0).toUpperCase() || 'U'}
              </Link>
              
              {/* Comment Bubble */}
              <div className="flex-1 min-w-0">
                <div className="relative inline-block bg-slate-100 border border-slate-200/35 rounded-2xl px-4 py-2.5 max-w-full">
                  <div className="flex items-center gap-2">
                    <Link 
                      to={comment.authorId !== 'anonymous' ? `/profile/${comment.authorId}` : '#'} 
                      className={`font-black text-xs text-slate-900 ${comment.authorId !== 'anonymous' ? 'hover:underline hover:text-blue-600' : 'cursor-default'}`}
                    >
                      {comment.authorName}
                    </Link>
                    {comment.authorId === 'anonymous' && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-md">Vãng lai</span>
                    )}
                  </div>
                  
                  <p className="text-[14px] text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed font-medium">
                    {comment.content}
                  </p>
                  
                  {/* Comment Rating Badge inside Bubble */}
                  {comment.ratingCount > 0 && (
                    <div className="absolute -bottom-2 -right-2 bg-white shadow-md border border-slate-100 rounded-full px-2 py-0.5 flex items-center gap-0.5 text-[10px] font-black text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{comment.ratingAvg ? comment.ratingAvg.toFixed(1) : '0.0'}</span>
                    </div>
                  )}
                </div>

                {/* Comment Actions / Footer */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 ml-2 text-xs text-slate-500 font-bold">
                  <span>
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'}
                  </span>
                  <button className="hover:text-slate-800 transition-colors">Thích</button>
                  <button className="hover:text-slate-800 transition-colors">Trả lời</button>
                  
                  {/* Comment Click Rating Trigger */}
                  <CommentRating 
                    commentId={comment.id}
                    initialRating={comment.ratingAvg}
                    initialCount={comment.ratingCount}
                    onRate={(newRating, newCount) => {
                      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, ratingAvg: newRating, ratingCount: newCount } : c));
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="text-center py-8 bg-slate-50 rounded-2xl text-slate-400 font-bold text-sm">
              Chưa có bình luận nào. Hãy đóng góp câu trả lời đầu tiên!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

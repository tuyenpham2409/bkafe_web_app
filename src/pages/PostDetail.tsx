import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, addDoc, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Share2, Eye, Star, MessageCircle, MoreHorizontal } from 'lucide-react';

// A simple hoverable rating component for comments
function CommentRating({ commentId, initialRating = 0, initialCount = 0 }: { commentId: string, initialRating?: number, initialCount?: number }) {
  const [rating, setRating] = useState(initialRating);
  const [count, setCount] = useState(initialCount);
  const [isHovering, setIsHovering] = useState(false);

  const handleRate = async (value: number) => {
    try {
      // In a real app we'd track who rated, here we just do a simple average for demo
      const newCount = count + 1;
      const newRating = ((rating * count) + value) / newCount;
      
      setRating(newRating);
      setCount(newCount);
      
      await updateDoc(doc(db, 'comments', commentId), {
        ratingAvg: newRating,
        ratingCount: newCount
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button className="text-xs font-bold text-gray-500 hover:underline">
        Đánh giá {count > 0 ? `(${rating.toFixed(1)}★)` : ''}
      </button>
      
      {isHovering && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 shadow-lg rounded-full px-2 py-1 flex items-center gap-1 z-10 animate-in fade-in slide-in-from-bottom-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              className="text-gray-300 hover:text-yellow-400 transition-colors p-1"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          ))}
        </div>
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
  const [postRating, setPostRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

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
        let fetchedComments = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
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
      alert("Đã sao chép liên kết!");
    } catch (e) {
      console.error(e);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!currentUser || !userData) {
      alert("Vui lòng đăng nhập để bình luận!");
      return;
    }
    
    setSubmitting(true);
    try {
      const newComment = {
        postId: id,
        authorId: currentUser.uid,
        authorName: userData.displayName,
        authorEmail: currentUser.email,
        content: commentContent,
        postRating: postRating,
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'comments'), newComment);
      
      setComments([{
        id: docRef.id,
        ...newComment,
        createdAt: { toDate: () => new Date() } // temporary for UI
      }, ...comments]);
      
      setCommentContent('');
      setPostRating(5);
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Lỗi khi gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (!post) return <div className="text-center py-10 text-gray-500">Không tìm thấy bài viết.</div>;

  // Calculate average post rating from comments
  const averagePostRating = comments.length > 0 
    ? comments.reduce((acc, curr) => acc + (curr.postRating || 5), 0) / comments.length 
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Post Detail */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/profile/${post.authorId}`} className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg hover:ring-2 ring-blue-500 transition-all shrink-0">
            {post.authorName?.charAt(0).toUpperCase() || 'U'}
          </Link>
          <div>
            <Link to={`/profile/${post.authorId}`} className="font-semibold text-gray-900 text-base hover:underline">
              {post.authorName}
            </Link>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString('vi-VN') : ''}
              <span>·</span>
              <Eye className="w-3 h-3" /> {post.views || 0}
            </div>
          </div>
          
          {comments.length > 0 && (
             <div className="ml-auto flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
               <Star className="w-4 h-4 fill-current" />
               {averagePostRating.toFixed(1)}
             </div>
          )}
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h1>
        <p className="text-gray-800 whitespace-pre-wrap text-[15px] leading-relaxed mb-6">{post.content}</p>
        
        <div className="flex items-center gap-6 text-gray-500 pt-3 border-t border-gray-100">
          <button onClick={handleLike} className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded transition-colors">
            <Heart className="w-5 h-5" />
            <span className="font-medium text-sm">{post.likes || 0} Thích</span>
          </button>
          <button className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium text-sm">{comments.length} Bình luận</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="font-medium text-sm">{post.shares || 0} Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Bình luận</h3>
        
        {currentUser ? (
          <form onSubmit={submitComment} className="flex items-start gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0">
              {userData?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <textarea 
                  required 
                  value={commentContent} 
                  onChange={e => setCommentContent(e.target.value)}
                  rows={2}
                  className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-[15px]"
                  placeholder="Viết bình luận công khai..."
                />
              </div>
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Đánh giá bài viết:</span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setPostRating(star)}
                        className={`p-1 ${postRating >= star ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {submitting ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 text-gray-500 mb-6 bg-gray-50 rounded-lg">
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Đăng nhập</Link> để tham gia bình luận.
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <Link to={`/profile/${comment.authorId}`} className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 shrink-0 hover:ring-2 ring-gray-300">
                {comment.authorName?.charAt(0).toUpperCase() || 'U'}
              </Link>
              <div className="flex-1">
                <div className="inline-block bg-gray-100 rounded-2xl px-4 py-2 relative">
                  <Link to={`/profile/${comment.authorId}`} className="font-bold text-[13px] text-gray-900 hover:underline">
                    {comment.authorName}
                  </Link>
                  <p className="text-[15px] text-gray-900 whitespace-pre-wrap">{comment.content}</p>
                  
                  {comment.postRating > 0 && (
                    <div className="absolute -bottom-2 -right-2 bg-white shadow-sm border border-gray-100 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 text-xs">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="font-medium text-gray-600">{comment.postRating}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-1 ml-2">
                  <span className="text-xs text-gray-500">
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'}
                  </span>
                  <button className="text-xs font-bold text-gray-500 hover:underline">Thích</button>
                  <button className="text-xs font-bold text-gray-500 hover:underline">Trả lời</button>
                  
                  {/* Hover rating component for the comment itself */}
                  <CommentRating 
                    commentId={comment.id} 
                    initialRating={comment.ratingAvg} 
                    initialCount={comment.ratingCount} 
                  />
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-6 text-gray-500">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, updateDoc, deleteDoc, doc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, CheckCircle, Edit, Save, X, Database, ShieldAlert, Eye, MessageSquare, FileText } from 'lucide-react';

export default function Admin() {
  const { userData, loading: authLoading, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [totalViews, setTotalViews] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (userData?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const postsSnap = await getDocs(query(collection(db, 'posts')));
        let fetchedPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedPosts.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setPosts(fetchedPosts);
        
        const commentsSnap = await getDocs(query(collection(db, 'comments')));
        const allComments = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const viewsCount = allComments.filter((c: any) => c.postId === 'global-stats').length;
        setTotalViews(2450 + viewsCount);

        const displayComments = allComments
          .filter((c: any) => c.postId !== 'global-stats')
          .sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setComments(displayComments);
      } catch (error) {
        console.error("Admin fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData, authLoading, navigate]);

  const handleApprove = async (postId: string) => {
    try {
      await updateDoc(doc(db, 'posts', postId), { status: 'approved' });
      setPosts(posts.map(p => p.id === postId ? { ...p, status: 'approved' } : p));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá bài viết này?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(posts.filter(p => p.id !== postId));
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (post: any) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const saveEdit = async () => {
    if (!editingPostId) return;
    try {
      await updateDoc(doc(db, 'posts', editingPostId), {
        title: editTitle,
        content: editContent
      });
      setPosts(posts.map(p => p.id === editingPostId ? { ...p, title: editTitle, content: editContent } : p));
      setEditingPostId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá bình luận này?')) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      setComments(comments.filter(c => c.id !== commentId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('Hành động này sẽ tạo thêm dữ liệu mẫu. Bạn có chắc chắn?')) return;
    setIsSeeding(true);
    try {
      const demoUserId = currentUser?.uid;
      const demoUserName = "Ngọc Lan";
      
      const newPostRef = await addDoc(collection(db, 'posts'), {
        title: "Kinh nghiệm học Đại số Tuyến tính",
        content: "Mọi người có tài liệu hay tips nào để học tốt môn Đại số tuyến tính không ạ? Sắp tới thi cuối kỳ rồi mà em thấy hoang mang quá 😢",
        authorId: demoUserId,
        authorName: "Nguyễn Hải Dương",
        status: "approved",
        views: 124,
        likes: 32,
        shares: 5,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'comments'), {
        postId: newPostRef.id,
        authorId: "demo-user-1",
        authorName: demoUserName,
        authorEmail: "ngoclan@example.com",
        content: "Cậu thử lên thư viện mượn quyển bài tập của thầy Trần Đình Phùng xem, rất bám sát đề thi luôn.",
        postRating: 5,
        ratingAvg: 4.5,
        ratingCount: 2,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'comments'), {
        postId: newPostRef.id,
        authorId: "demo-user-2",
        authorName: "Trung Le",
        authorEmail: "trungle@example.com",
        content: "Năm ngoái anh học thì cứ làm kĩ đề cương là qua em nhé.",
        postRating: 4,
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: serverTimestamp()
      });

      alert("Thêm dữ liệu mẫu thành công! Vui lòng tải lại trang.");
      window.location.reload();
    } catch (e) {
      console.error("Lỗi khi tạo dữ liệu mẫu:", e);
      alert("Lỗi khi tạo dữ liệu mẫu.");
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading || authLoading) return <div className="text-center py-12 text-slate-500 font-bold">Đang tải bảng điều khiển...</div>;

  const approvedPostsCount = posts.filter(p => p.status === 'approved').length;
  const pendingPostsCount = posts.filter(p => p.status === 'pending').length;
  const totalCommentsCount = comments.length;

  return (
    <div className="space-y-6">
      {/* Admin Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-600 animate-pulse" />
            Bảng điều khiển Admin chuyên dụng
          </h1>
          <p className="text-sm font-semibold text-slate-400">Không gian quản lý nội dung và các bài đăng dành riêng cho Admin BKafe</p>
          <button 
            onClick={handleSeedData} 
            disabled={isSeeding}
            className="mt-2.5 flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-700 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-purple-100 transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-purple-50"
          >
            <Database className="w-4 h-4" />
            {isSeeding ? 'Đang thiết lập...' : 'Khởi tạo lại dữ liệu mẫu chuẩn'}
          </button>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Views */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalViews}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lượt xem trang</div>
          </div>
        </div>

        {/* Card 2: Approved Posts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{approvedPostsCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài viết đã duyệt</div>
          </div>
        </div>

        {/* Card 3: Pending Posts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
          {pendingPostsCount > 0 && (
            <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{pendingPostsCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài viết chờ duyệt</div>
          </div>
        </div>

        {/* Card 4: Comments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalCommentsCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số bình luận</div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Admin Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Posts Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h2 className="font-extrabold text-slate-900 text-sm">Quản lý câu hỏi ({posts.length})</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {posts.map(post => (
              <div key={post.id} className="p-5 transition-all hover:bg-slate-50/30">
                {editingPostId === post.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tiêu đề bài viết</label>
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Nội dung bài viết</label>
                      <textarea 
                        value={editContent} 
                        onChange={e => setEditContent(e.target.value)} 
                        rows={5}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-xs font-extrabold transition-all cursor-pointer">
                        <X className="w-4 h-4" /> Hủy
                      </button>
                      <button onClick={saveEdit} className="px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-1 text-xs font-extrabold transition-all shadow-sm cursor-pointer">
                        <Save className="w-4 h-4" /> Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${
                          post.status === 'approved' 
                            ? 'bg-green-50 border-green-100 text-green-700' 
                            : 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse'
                        }`}>
                          {post.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">Tác giả: <strong className="text-slate-600">{post.authorName}</strong></span>
                        <span className="text-[10px] text-slate-350 font-bold">({post.views || 0} xem)</span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">{post.title}</h3>
                      <p className="text-slate-650 text-xs line-clamp-2 leading-relaxed">{post.content}</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {post.status === 'pending' && (
                        <button 
                          onClick={() => handleApprove(post.id)} 
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all cursor-pointer"
                          title="Duyệt bài đăng"
                        >
                          <CheckCircle className="w-4.5 h-4.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => startEdit(post)} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="Sửa nội dung"
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)} 
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Xoá bài đăng"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {posts.length === 0 && <div className="p-8 text-center text-slate-400 font-bold text-xs">Chưa có câu hỏi nào.</div>}
          </div>
        </div>

        {/* Comments Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-500" />
            <h2 className="font-extrabold text-slate-900 text-sm">Quản lý bình luận ({comments.length})</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {comments.map(comment => (
              <div key={comment.id} className="p-5 flex items-start justify-between gap-4 transition-all hover:bg-slate-50/30">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="font-extrabold text-slate-900 text-xs">{comment.authorName}</span>
                    <span className="text-slate-400 truncate max-w-[150px]">({comment.authorEmail})</span>
                    {comment.ratingCount > 0 && (
                      <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-bold text-[9px]">
                        {comment.ratingAvg.toFixed(1)}★ ({comment.ratingCount} đánh giá)
                      </span>
                    )}
                  </div>
                  <p className="text-slate-750 text-xs leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                  <div className="text-[9px] font-bold text-slate-350 truncate">
                    ID bài viết: {comment.postId}
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteComment(comment.id)} 
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg shrink-0 transition-all cursor-pointer" 
                  title="Xóa bình luận"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
            {comments.length === 0 && <div className="p-8 text-center text-slate-400 font-bold text-xs">Chưa có bình luận nào.</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, updateDoc, deleteDoc, doc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, CheckCircle, Edit, Save, X, Database } from 'lucide-react';

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
        
        let views = 0;
        fetchedPosts.forEach((p: any) => { views += (p.views || 0); });
        setTotalViews(views);

        const commentsSnap = await getDocs(query(collection(db, 'comments')));
        let fetchedComments = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedComments.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setComments(fetchedComments);
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

  if (loading || authLoading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển Admin</h1>
          <p className="text-gray-500 mt-1">Quản lý nội dung hệ thống BKafe</p>
          <button 
            onClick={handleSeedData} 
            disabled={isSeeding}
            className="mt-4 flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {isSeeding ? 'Đang tạo...' : 'Tạo dữ liệu mẫu'}
          </button>
        </div>
        <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-xl border border-blue-100 text-center w-full md:w-auto">
          <div className="text-sm font-medium">Tổng lượt xem toàn hệ thống</div>
          <div className="text-3xl font-bold">{totalViews}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Quản lý Bài viết</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {posts.map(post => (
            <div key={post.id} className="p-6">
              {editingPostId === post.id ? (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-bold"
                  />
                  <textarea 
                    value={editContent} 
                    onChange={e => setEditContent(e.target.value)} 
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1 text-sm font-medium">
                      <X className="w-4 h-4" /> Hủy
                    </button>
                    <button onClick={saveEdit} className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded flex items-center gap-1 text-sm font-medium">
                      <Save className="w-4 h-4" /> Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${post.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {post.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                      <span className="text-sm text-gray-500">bởi {post.authorName}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{post.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {post.status === 'pending' && (
                      <button onClick={() => handleApprove(post.id)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Duyệt bài">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => startEdit(post)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Sửa">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeletePost(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {posts.length === 0 && <div className="p-6 text-center text-gray-500">Chưa có bài viết nào.</div>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Quản lý Bình luận</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {comments.map(comment => (
            <div key={comment.id} className="p-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{comment.authorName}</span>
                  <span className="text-gray-400 text-sm">({comment.authorEmail})</span>
                  {comment.postRating > 0 && (
                    <span className="text-yellow-500 text-sm font-medium">★ {comment.postRating}</span>
                  )}
                </div>
                <p className="text-gray-700 text-sm">{comment.content}</p>
              </div>
              <button onClick={() => handleDeleteComment(comment.id)} className="p-2 text-red-600 hover:bg-red-50 rounded shrink-0" title="Xóa bình luận">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {comments.length === 0 && <div className="p-6 text-center text-gray-500">Chưa có bình luận nào.</div>}
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    setLoading(true);
    try {
      // Admins bypass pending state, users need approval
      const status = userData.role === 'admin' ? 'approved' : 'pending';
      
      await addDoc(collection(db, 'posts'), {
        title,
        content,
        authorId: currentUser.uid,
        authorName: userData.displayName,
        createdAt: serverTimestamp(),
        status,
        views: 0,
        likes: 0,
        shares: 0
      });

      if (status === 'pending') {
        alert('Bài viết của bạn đã được gửi và đang chờ Admin duyệt.');
      }
      navigate('/');
    } catch (error) {
      console.error("Error creating post:", error);
      alert('Đã xảy ra lỗi khi tạo bài viết.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="text-center py-10">Vui lòng đăng nhập để đăng bài.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Tạo bài viết mới</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
          <input 
            type="text" 
            required 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            placeholder="Nhập tiêu đề bài viết..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
          <textarea 
            required 
            value={content} 
            onChange={e => setContent(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
            placeholder="Bạn đang nghĩ gì? Hãy đặt câu hỏi hoặc chia sẻ..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
            Hủy
          </button>
          <button type="submit" disabled={loading} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
            {loading ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        </div>
      </form>
    </div>
  );
}

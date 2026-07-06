import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AboutContact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'contacts'), {
        name,
        email,
        message,
        createdAt: serverTimestamp()
      });
      
      setSubmitted(true);
      setTimeout(() => {
        setName('');
        setEmail('');
        setMessage('');
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting contact:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Về BKafe</h1>
        <div className="prose prose-gray text-gray-700 leading-relaxed space-y-4">
          <p>
            Chào mừng bạn đến với <strong>BKafe</strong> - Nền tảng hỏi đáp trực tuyến dành riêng cho sinh viên Đại học Bách khoa Hà Nội (HUST).
          </p>
          <p>
            Dự án được xây dựng bởi <strong>Nhóm 4</strong> (Phạm Minh Tuyên - 20233885 và Lê Hà Hải Vân). 
            Mục tiêu của chúng tôi là tạo ra một không gian trao đổi học thuật, chia sẻ kinh nghiệm và giải đáp các thắc mắc trong quá trình học tập tại trường.
          </p>
          <p>
            Tại BKafe, bạn có thể dễ dàng đặt câu hỏi, thảo luận, và tìm kiếm thông tin hữu ích từ cộng đồng sinh viên HUST.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Liên hệ & Góp ý</h2>
        
        {submitted ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-center">
            Cảm ơn bạn đã gửi ý kiến! Chúng tôi sẽ phản hồi sớm nhất có thể.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                placeholder="Tên của bạn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                placeholder="Email liên hệ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung ý kiến</label>
              <textarea 
                required 
                value={message} 
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none"
                placeholder="Nhập nội dung bạn muốn gửi..."
              />
            </div>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? 'Đang gửi...' : 'Gửi liên hệ'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

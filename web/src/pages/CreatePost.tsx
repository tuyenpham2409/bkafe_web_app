import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { ImagePlus, X, FileVideo, AlertTriangle } from 'lucide-react';

const Req = () => <span className="text-red-500">*</span>;

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [topics, setTopics] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/topics').then((t) => { setTopics(t); if (t[0]) setTopic(t[0].slug); }).catch(() => {});
  }, []);

  // Chưa đăng nhập — hiển thị UI tương tự phần bình luận
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-3">Yêu cầu đăng nhập</h2>
          <p className="text-sm font-bold text-blue-700 mb-6">
            Bạn cần{' '}
            <Link to="/login" className="underline font-black text-blue-600 hover:text-blue-800">Đăng nhập</Link>
            {' '}hoặc{' '}
            <Link to="/register" className="underline font-black text-blue-600 hover:text-blue-800">Đăng ký</Link>
            {' '}để đặt câu hỏi và đánh giá.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
              Đăng nhập
            </Link>
            <Link to="/register" className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
    e.target.value = '';
  };
  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim() || !topic) {
      setError('Vui lòng nhập nội dung và chọn chủ đề.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      if (title.trim()) form.append('title', title.trim());
      form.append('content', content.trim());
      form.append('topic', topic);
      files.forEach((f) => form.append('media', f));
      await api.postForm('/posts', form);
      navigate('/');
      // Toast hiện sau khi navigate
      if (user.role !== 'admin') {
        showToast('Câu hỏi đã được gửi và đang chờ Admin duyệt!', 'info');
      } else {
        showToast('Câu hỏi đã được đăng thành công!', 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Đặt câu hỏi mới</h1>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-semibold">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Chủ đề <Req /></label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white">
            {topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tiêu đề <span className="text-xs text-slate-400 font-normal">(không bắt buộc)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            placeholder="Nhập tiêu đề câu hỏi (có thể bỏ trống)..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung <Req /></label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none"
            placeholder="Bạn đang nghĩ gì? Hãy đặt câu hỏi hoặc chia sẻ..."
          />
        </div>

        {/* Media */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh / Video đính kèm (tối đa 5)</label>
          <div className="flex flex-wrap gap-3">
            {files.map((f, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                {f.type.startsWith('image') ? (
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FileVideo className="w-8 h-8 text-slate-400" />
                )}
                <button type="button" onClick={() => removeFile(i)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {files.length < 5 && (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors">
                <ImagePlus className="w-6 h-6" />
                <span className="text-[10px] font-bold">Thêm</span>
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={addFiles} />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang đăng...' : 'Đăng câu hỏi'}
          </button>
        </div>
      </form>
    </div>
  );
}

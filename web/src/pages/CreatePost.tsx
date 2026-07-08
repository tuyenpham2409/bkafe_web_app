import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { ImagePlus, X, FileVideo, AlertTriangle } from 'lucide-react';

const Req = () => <span className="req">*</span>;

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

  // Chưa đăng nhập — hiển thị UI yêu cầu đăng nhập
  if (!user) {
    return (
      <div className="card text-center" style={{ maxWidth: '672px', margin: '0 auto', padding: '40px', backgroundColor: 'var(--primary-light)', borderColor: 'rgba(37, 99, 235, 0.15)' }}>
        <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--white)', color: 'var(--primary-blue)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: 'var(--shadow-sm)' }}>
          <AlertTriangle size={32} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--slate-900)', marginBottom: '12px' }}>Yêu cầu đăng nhập</h2>
        <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '24px' }}>
          Bạn cần{' '}
          <Link to="/login" style={{ textDecoration: 'underline', fontWeight: '900', color: 'var(--primary-blue)' }}>Đăng nhập</Link>
          {' '}hoặc{' '}
          <Link to="/register" style={{ textDecoration: 'underline', fontWeight: '900', color: 'var(--primary-blue)' }}>Đăng ký</Link>
          {' '}để đặt câu hỏi và đánh giá.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            Đăng nhập
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ padding: '10px 24px' }}>
            Đăng ký
          </Link>
        </div>
      </div>
    );
  }

  const MAX_IMAGE = 5 * 1024 * 1024;  // 5MB
  const MAX_VIDEO = 20 * 1024 * 1024; // 20MB

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []) as File[];
    const invalid: string[] = [];
    const valid = selected.filter((f) => {
      if (f.type.startsWith('video/') && f.size > MAX_VIDEO) { invalid.push(`"${f.name}" vượt quá 20MB`); return false; }
      if (f.type.startsWith('image/') && f.size > MAX_IMAGE) { invalid.push(`"${f.name}" vượt quá 5MB`); return false; }
      return true;
    });
    if (invalid.length) setError(`File quá lớn: ${invalid.join(', ')}. Ảnh tối đa 5MB, video tối đa 20MB.`);
    else setError('');
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
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
    <div className="card" style={{ maxWidth: '672px', margin: '0 auto' }}>
      <h1 className="forum-title" style={{ marginBottom: '24px' }}>Đặt câu hỏi mới</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Chủ đề <Req /></label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} required className="form-select">
            {topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Tiêu đề <span style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: 'normal', textTransform: 'none' }}>(không bắt buộc)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="Nhập tiêu đề câu hỏi (có thể bỏ trống)..."
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Nội dung <Req /></label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="form-textarea"
            placeholder="Bạn đang nghĩ gì? Hãy đặt câu hỏi hoặc chia sẻ..."
          />
        </div>

        {/* Media */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ textTransform: 'none' }}>Ảnh / Video đính kèm (tối đa 5, ảnh ≤5MB, video ≤20MB)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {files.map((f, i) => (
              <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--slate-200)', backgroundColor: 'var(--slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {f.type.startsWith('image') ? (
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FileVideo size={32} style={{ color: 'var(--slate-400)' }} />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'var(--white)',
                    borderRadius: '50%',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {files.length < 5 && (
              <label
                className="btn btn-secondary"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  border: '2px dashed var(--slate-300)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  color: 'var(--slate-400)',
                  padding: 0,
                  boxShadow: 'none',
                }}
              >
                <ImagePlus size={24} />
                <span style={{ fontSize: '10px', fontWeight: '700' }}>Thêm</span>
                <input type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={addFiles} />
              </label>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary" style={{ boxShadow: 'none' }}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
          >
            {loading ? 'Đang đăng...' : 'Đăng câu hỏi'}
          </button>
        </div>
      </form>
    </div>
  );
}

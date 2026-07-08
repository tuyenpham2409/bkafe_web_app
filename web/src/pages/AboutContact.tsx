import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Mail, Trash2, CheckCircle, Inbox, ImagePlus, X, FileVideo } from 'lucide-react';

const Req = () => <span className="req">*</span>;

// Admin sees the inbox of feedback; everyone else sees the about page + contact form.
function AdminInbox() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unhandledCount, setUnhandledCount] = useState(0);

  const load = () => api.get('/contacts').then((cs) => {
    setContacts(cs);
    setUnhandledCount(cs.filter((c: any) => !c.handled).length);
  }).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const toggle = async (id: string) => { const r = await api.patch(`/contacts/${id}/handled`); setContacts((cs) => cs.map((c) => c.id === id ? { ...c, handled: r.handled } : c)); setUnhandledCount((n) => r.handled ? n - 1 : n + 1); window.dispatchEvent(new Event('bkafe-contacts-changed')); };
  const remove = async (id: string) => { if (!confirm('Xoá góp ý này?')) return; await api.del(`/contacts/${id}`); setContacts((cs) => cs.filter((c) => c.id !== id)); window.dispatchEvent(new Event('bkafe-contacts-changed')); };

  return (
    <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card">
        <h1 className="forum-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Inbox size={24} style={{ color: 'var(--primary-blue)' }} /> Hộp thư góp ý
          {unhandledCount > 0 && (
            <span className="nav-badge" style={{ marginLeft: '8px', minWidth: '24px', height: '24px', fontSize: '12px' }}>
              {unhandledCount}
            </span>
          )}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--slate-400)', fontWeight: '600', marginTop: '4px' }}>
          Các ý kiến/liên hệ do người dùng gửi về ({contacts.length}) —
          {unhandledCount > 0 ? <span style={{ color: 'var(--amber)', fontWeight: '750' }}> {unhandledCount} chưa xử lý</span> : <span style={{ color: 'var(--green)', fontWeight: '750' }}> Tất cả đã xử lý</span>}
        </p>
      </div>
      {loading ? (
        <div className="text-center" style={{ padding: '32px 0', color: 'var(--slate-400)', fontWeight: '700' }}>Đang tải...</div>
      ) : contacts.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px 16px', color: 'var(--slate-400)', fontWeight: '700' }}>Chưa có góp ý nào.</div>
      ) : (
        contacts.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{
              borderColor: c.handled ? 'var(--slate-200)' : 'var(--primary-blue)',
              opacity: c.handled ? 0.7 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '900', color: 'var(--slate-900)', fontSize: '14px' }}>{c.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: '600' }}>&lt;{c.email}&gt;</span>
                  {c.handled && (
                    <span className="badge badge-green" style={{ fontSize: '10px', textTransform: 'none', padding: '2px 6px' }}>
                      Đã xử lý
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--slate-700)', marginTop: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{c.message}</p>
                {/* Media đính kèm */}
                {c.media?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {c.media.map((m: any, i: number) => m.type === 'video' ? (
                      <video key={i} src={m.url} controls style={{ width: '192px', borderRadius: '12px', border: '1px solid var(--slate-200)' }} />
                    ) : (
                      <a key={i} href={m.url} target="_blank" rel="noreferrer">
                        <img src={m.url} alt="" style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--slate-200)' }} className="hover-opacity" />
                      </a>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: '700', marginTop: '8px' }}>{new Date(c.createdAt).toLocaleString('vi-VN')}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => toggle(c.id)} className="btn-icon" style={{ color: 'var(--green)', padding: '6px' }} title="Đánh dấu đã xử lý">
                  <CheckCircle size={18} />
                </button>
                <button onClick={() => remove(c.id)} className="btn-icon btn-icon-danger" style={{ color: 'var(--red)', padding: '6px' }} title="Xoá">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function AboutContact() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill from the logged-in account (still editable)
  useEffect(() => {
    if (user) { setName(user.displayName || ''); setEmail(user.email || ''); }
  }, [user]);

  if (user?.role === 'admin') return <AdminInbox />;

  const [fileError, setFileError] = useState('');

  const MAX_IMAGE = 5 * 1024 * 1024;
  const MAX_VIDEO = 20 * 1024 * 1024;

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []) as File[];
    const invalid: string[] = [];
    const valid = selected.filter((f) => {
      if (f.type.startsWith('video/') && f.size > MAX_VIDEO) { invalid.push(`"${f.name}" vượt quá 20MB`); return false; }
      if (f.type.startsWith('image/') && f.size > MAX_IMAGE) { invalid.push(`"${f.name}" vượt quá 5MB`); return false; }
      return true;
    });
    if (invalid.length) setFileError(`File quá lớn: ${invalid.join(', ')}. Ảnh tối đa 5MB, video tối đa 20MB.`);
    else setFileError('');
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('email', email);
      form.append('message', message);
      files.forEach((f) => form.append('media', f));
      await api.postForm('/contacts', form);
      setSubmitted(true);
      window.dispatchEvent(new Event('bkafe-contacts-changed'));
      setTimeout(() => { setMessage(''); setFiles([]); setSubmitted(false); }, 3000);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="card">
        <h1 className="forum-title" style={{ fontSize: '30px', marginBottom: '24px' }}>Về BKafe</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--slate-700)', lineHeight: '1.7' }}>
          <p>Chào mừng bạn đến với <strong>BKafe</strong> — Nền tảng hỏi đáp trực tuyến dành riêng cho sinh viên Đại học Bách khoa Hà Nội (HUST).</p>
          <p>Dự án được xây dựng bởi <strong>Nhóm 4</strong> (Phạm Minh Tuyên - 20233885 và Lê Hà Hải Vân). Mục tiêu là tạo không gian trao đổi học thuật, chia sẻ kinh nghiệm và giải đáp thắc mắc trong quá trình học tập.</p>
          <p>Tại BKafe, bạn có thể dễ dàng đặt câu hỏi, thảo luận và tìm kiếm thông tin hữu ích từ cộng đồng sinh viên HUST.</p>
        </div>
      </div>

      <div className="card">
        <h2 className="forum-title" style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={24} style={{ color: 'var(--primary-blue)' }} /> Liên hệ &amp; Góp ý
        </h2>
        {submitted ? (
          <div className="alert alert-success" style={{ textAlign: 'center' }}>Cảm ơn bạn đã gửi ý kiến! Chúng tôi sẽ phản hồi sớm nhất có thể.</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Họ tên <Req /></label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Tên của bạn" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email <Req /></label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="Email liên hệ" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nội dung ý kiến <Req /></label>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="form-textarea" placeholder="Nhập nội dung bạn muốn gửi..." />
            </div>

            {/* Media upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ảnh / Video đính kèm (tối đa 5, ảnh ≤5MB, video ≤20MB)</label>
              {fileError && <div className="alert alert-danger" style={{ fontSize: '12px', padding: '8px 12px', marginBottom: '12px' }}>{fileError}</div>}
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
                      boxShadow: 'none',
                      padding: 0,
                    }}
                    className="btn btn-secondary"
                  >
                    <ImagePlus size={24} />
                    <span style={{ fontSize: '10px', fontWeight: '700' }}>Thêm</span>
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={addFiles} />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
              style={{ alignSelf: 'flex-start' }}
            >
              {loading ? 'Đang gửi...' : 'Gửi liên hệ'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

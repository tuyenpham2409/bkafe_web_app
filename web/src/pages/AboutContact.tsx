import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Mail, Trash2, CheckCircle, Inbox } from 'lucide-react';

const Req = () => <span className="text-red-500">*</span>;

// Admin sees the inbox of feedback; everyone else sees the about page + contact form.
function AdminInbox() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/contacts').then(setContacts).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const toggle = async (id: string) => { const r = await api.patch(`/contacts/${id}/handled`); setContacts((cs) => cs.map((c) => c.id === id ? { ...c, handled: r.handled } : c)); };
  const remove = async (id: string) => { if (!confirm('Xoá góp ý này?')) return; await api.del(`/contacts/${id}`); setContacts((cs) => cs.filter((c) => c.id !== id)); };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Inbox className="w-6 h-6 text-blue-600" /> Hộp thư góp ý</h1>
        <p className="text-sm text-slate-400 font-semibold mt-1">Các ý kiến/liên hệ do người dùng gửi về ({contacts.length}).</p>
      </div>
      {loading ? <div className="text-center py-8 text-slate-400 font-bold">Đang tải...</div> : contacts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400 font-bold">Chưa có góp ý nào.</div>
      ) : contacts.map((c) => (
        <div key={c.id} className={`bg-white rounded-2xl border p-5 shadow-sm ${c.handled ? 'border-slate-200 opacity-70' : 'border-blue-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                <span className="text-xs text-slate-400 font-semibold">&lt;{c.email}&gt;</span>
                {c.handled && <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-green-50 text-green-600 rounded border border-green-100">Đã xử lý</span>}
              </div>
              <p className="text-sm text-slate-700 mt-1.5 whitespace-pre-wrap">{c.message}</p>
              <div className="text-[11px] text-slate-400 font-bold mt-2">{new Date(c.createdAt).toLocaleString('vi-VN')}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggle(c.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Đánh dấu đã xử lý"><CheckCircle className="w-4.5 h-4.5" /></button>
              <button onClick={() => remove(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Xoá"><Trash2 className="w-4.5 h-4.5" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AboutContact() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Prefill from the logged-in account (still editable)
  useEffect(() => {
    if (user) { setName(user.displayName || ''); setEmail(user.email || ''); }
  }, [user]);

  if (user?.role === 'admin') return <AdminInbox />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contacts', { name, email, message });
      setSubmitted(true);
      setTimeout(() => { setMessage(''); setSubmitted(false); }, 3000);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Về BKafe</h1>
        <div className="text-slate-700 leading-relaxed space-y-4">
          <p>Chào mừng bạn đến với <strong>BKafe</strong> — Nền tảng hỏi đáp trực tuyến dành riêng cho sinh viên Đại học Bách khoa Hà Nội (HUST).</p>
          <p>Dự án được xây dựng bởi <strong>Nhóm 4</strong> (Phạm Minh Tuyên - 20233885 và Lê Hà Hải Vân). Mục tiêu là tạo không gian trao đổi học thuật, chia sẻ kinh nghiệm và giải đáp thắc mắc trong quá trình học tập.</p>
          <p>Tại BKafe, bạn có thể dễ dàng đặt câu hỏi, thảo luận và tìm kiếm thông tin hữu ích từ cộng đồng sinh viên HUST.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Mail className="w-6 h-6 text-blue-600" /> Liên hệ & Góp ý</h2>
        {submitted ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-center">Cảm ơn bạn đã gửi ý kiến! Chúng tôi sẽ phản hồi sớm nhất có thể.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên <Req /></label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" placeholder="Tên của bạn" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email <Req /></label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none" placeholder="Email liên hệ" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung ý kiến <Req /></label>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none" placeholder="Nhập nội dung bạn muốn gửi..." />
            </div>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">{loading ? 'Đang gửi...' : 'Gửi liên hệ'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import PasswordInput from '../components/PasswordInput';
import { User as UserIcon, Calendar, Edit2, Check, X, Camera, Settings, KeyRound, AtSign } from 'lucide-react';

// Resize an image file to a small square base64 data URL (no external storage needed).
function resizeImageToDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');

  const isOwn = user?.id === id;

  const load = async () => {
    setLoading(true);
    try {
      const [p, ps] = await Promise.all([api.get(`/users/${id}`), api.get(`/posts?author=${id}`)]);
      setProfile(p); setPosts(ps);
      setEditName(p.displayName); setEditBio(p.bio || '');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !isOwn) return;
    if (!file.type.startsWith('image/')) return alert('Vui lòng chọn tệp ảnh.');
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      await api.put('/users/me', { photoURL: dataUrl });
      setProfile((p: any) => ({ ...p, photoURL: dataUrl }));
      await refreshUser();
    } catch { alert('Lỗi khi tải ảnh.'); } finally { setAvatarUploading(false); }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return alert('Tên hiển thị không được để trống.');
    try {
      await api.put('/users/me', { displayName: editName.trim(), bio: editBio.trim() });
      setProfile((p: any) => ({ ...p, displayName: editName.trim(), bio: editBio.trim() }));
      setIsEditing(false); await refreshUser();
    } catch (err: any) { alert(err.message); }
  };

  const changeUsername = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    try {
      const r = await api.put('/auth/username', { username: newUsername.trim() });
      setProfile((p: any) => ({ ...p, username: r.user.username, usernameChanged: true }));
      setNewUsername(''); setMsg('✅ Đã đổi tên đăng nhập.'); await refreshUser();
    } catch (err: any) { setMsg('❌ ' + err.message); }
  };
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    try {
      await api.put('/auth/password', { currentPassword: curPw, newPassword: newPw });
      setCurPw(''); setNewPw(''); setMsg('✅ Đã đổi mật khẩu.');
    } catch (err: any) { setMsg('❌ ' + err.message); }
  };

  if (loading) return <div className="text-center py-12 text-slate-500 font-bold">Đang tải hồ sơ...</div>;
  if (!profile) return <div className="text-center py-12 text-slate-500 font-bold">Không tìm thấy người dùng này.</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative shrink-0">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md shadow-blue-100" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-4xl shadow-md shadow-blue-100">{profile.displayName?.charAt(0).toUpperCase() || 'U'}</div>
            )}
            {isOwn && (
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shadow-md border-2 border-white" title="Đổi ảnh đại diện">
                {avatarUploading ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Camera className="w-4 h-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={avatarUploading} />
              </label>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2.5 w-full">
            {isEditing ? (
              <form onSubmit={saveProfile} className="space-y-3">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} required placeholder="Tên hiển thị" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} placeholder="Giới thiệu ngắn về bạn..." className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 resize-none" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold"><X className="w-4 h-4" /> Hủy</button>
                  <button type="submit" className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700"><Check className="w-4 h-4" /> Lưu</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile.displayName}</h1>
                    <div className="text-sm font-semibold text-slate-400 mt-0.5">@{profile.username}</div>
                  </div>
                  {isOwn && (
                    <div className="flex items-center gap-2 justify-center">
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-extrabold"><Edit2 className="w-3.5 h-3.5" /> Sửa hồ sơ</button>
                      <button onClick={() => setShowSettings((s) => !s)} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-extrabold"><Settings className="w-3.5 h-3.5" /> Cài đặt</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-semibold pt-1">
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-slate-600"><UserIcon className="w-4 h-4 text-slate-400" />{profile.role === 'admin' ? 'Quản trị viên' : 'Sinh viên HUST'}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" />Tham gia: {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('vi-VN') : '—'}</span>
                  {isOwn && <span className="text-slate-400">({profile.email})</span>}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium italic pt-2">{profile.bio || 'Chưa có lời tự giới thiệu.'}</p>
              </>
            )}
          </div>
        </div>

        {/* Account settings (own profile) */}
        {isOwn && showSettings && !isEditing && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            {msg && <div className="md:col-span-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">{msg}</div>}
            <form onSubmit={changeUsername} className="space-y-2">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5"><AtSign className="w-4 h-4 text-blue-500" /> Đổi tên đăng nhập</h3>
              {profile.usernameChanged ? (
                <p className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">Bạn đã đổi tên đăng nhập một lần và không thể đổi lại.</p>
              ) : (
                <>
                  <p className="text-[11px] text-slate-400 font-semibold">Chỉ được đổi <b>duy nhất một lần</b>.</p>
                  <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Tên đăng nhập mới" required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                  <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-900">Đổi username</button>
                </>
              )}
            </form>
            <form onSubmit={changePassword} className="space-y-2">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5"><KeyRound className="w-4 h-4 text-blue-500" /> Đổi mật khẩu</h3>
              <PasswordInput value={curPw} onChange={setCurPw} placeholder="Mật khẩu hiện tại" autoComplete="current-password" />
              <PasswordInput value={newPw} onChange={setNewPw} placeholder="Mật khẩu mới" autoComplete="new-password" />
              <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-900">Đổi mật khẩu</button>
            </form>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-black text-slate-900 mb-4">Câu hỏi đã đăng ({posts.length})</h2>
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className="block hover:bg-slate-50 p-4 rounded-xl border border-slate-100 transition-colors">
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="text-base font-black text-slate-900 hover:text-blue-600">{post.title}</h3>
                {post.status !== 'approved' && <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border shrink-0 ${post.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{post.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}</span>}
              </div>
              <p className="text-slate-500 text-sm line-clamp-2 mb-3">{post.content}</p>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span><span>·</span><span>{post.views || 0} lượt xem</span><span>·</span><span>{post.ratingCount > 0 ? `${post.ratingAvg.toFixed(1)}★` : 'Chưa đánh giá'}</span>
              </div>
            </Link>
          ))}
          {posts.length === 0 && <div className="text-center py-10 text-slate-400 font-bold text-sm">Chưa đăng câu hỏi nào.</div>}
        </div>
      </div>
    </div>
  );
}

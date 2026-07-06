import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon, Calendar, FileText, MessageSquare, Edit2, Check, X, Camera } from 'lucide-react';

// Resize an image file to a small square and return a compact base64 data URL
// (stored directly in Firestore, so no external storage/library is needed).
function resizeImageToDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        // cover-crop to a centered square
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
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
  const { currentUser, userData: currentUserData } = useAuth();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !id || !currentUser || currentUser.uid !== id) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp ảnh.');
      return;
    }
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 256);
      await updateDoc(doc(db, 'users', id), { photoURL: dataUrl });
      setProfileUser((prev: any) => ({ ...prev, photoURL: dataUrl }));
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Lỗi khi tải ảnh đại diện. Vui lòng thử ảnh khác.');
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch user profile doc
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const uData = docSnap.data();
          setProfileUser({ id: docSnap.id, ...uData });
          setEditName(uData.displayName || '');
          setEditBio(uData.bio || '');
        }

        // Fetch user posts
        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', id)
        );
        const postsSnap = await getDocs(postsQuery);
        let posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        posts = posts
          .filter((p: any) => p.status === 'approved' || id === currentUser?.uid) // Owner can see pending posts
          .sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setUserPosts(posts);

        // Fetch user comments
        const commentsQuery = query(
          collection(db, 'comments'),
          where('authorId', '==', id)
        );
        const commentsSnap = await getDocs(commentsQuery);
        let comments = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        comments.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setUserComments(comments);

      } catch (error) {
        console.error("Error fetching profile details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id, currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    
    if (!editName.trim()) {
      alert("Tên hiển thị không được để trống!");
      return;
    }

    setSaveLoading(true);
    try {
      await updateDoc(doc(db, 'users', id), {
        displayName: editName.trim(),
        bio: editBio.trim()
      });
      
      setProfileUser((prev: any) => ({
        ...prev,
        displayName: editName.trim(),
        bio: editBio.trim()
      }));
      
      setIsEditing(false);
      alert("Đã cập nhật thông tin cá nhân!");
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu thông tin.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500 font-bold">Đang tải hồ sơ...</div>;
  if (!profileUser) return <div className="text-center py-12 text-slate-500 font-bold">Không tìm thấy người dùng này.</div>;

  const isOwnProfile = currentUser?.uid === id;

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profileUser.photoURL ? (
              <img
                src={profileUser.photoURL}
                alt={profileUser.displayName}
                className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md shadow-blue-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-4xl shadow-md shadow-blue-100">
                {profileUser.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            {isOwnProfile && (
              <label
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shadow-md border-2 border-white transition-colors"
                title="Đổi ảnh đại diện"
              >
                {avatarUploading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2.5 w-full">
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tên hiển thị</label>
                  <input 
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    placeholder="Tên hiển thị"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tiểu sử (Bio)</label>
                  <textarea 
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
                    placeholder="Mô tả ngắn về bạn..."
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1 text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  >
                    <X className="w-4 h-4" /> Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> {saveLoading ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profileUser.displayName}</h1>
                    <div className="text-sm font-semibold text-slate-400 mt-0.5">@{profileUser.username}</div>
                  </div>
                  {isOwnProfile && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Chỉnh sửa hồ sơ
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-semibold pt-1">
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    {profileUser.role === 'admin' ? 'Quản trị viên' : 'Sinh viên HUST'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Tham gia: {profileUser.joinedAt ? new Date(profileUser.joinedAt).toLocaleDateString('vi-VN') : 'Kỳ 2023.1'}
                  </span>
                  {isOwnProfile && (
                    <span className="text-slate-400">({profileUser.email})</span>
                  )}
                </div>

                {/* Biography */}
                <div className="pt-2">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                    {profileUser.bio || "Chưa có lời tự giới thiệu."}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-150 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold border-b-2 transition-all ${
              activeTab === 'posts' 
                ? 'border-blue-600 text-blue-600 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            Câu hỏi đã đăng ({userPosts.length})
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold border-b-2 transition-all ${
              activeTab === 'comments' 
                ? 'border-blue-600 text-blue-600 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <MessageSquare className="w-4.5 h-4.5" />
            Bình luận & Đáp án ({userComments.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 divide-y divide-slate-100">
          
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {userPosts.map(post => (
                <div key={post.id} className="block group">
                  <Link 
                    to={`/post/${post.id}`} 
                    className="block hover:bg-slate-50 p-4 rounded-xl border border-slate-100 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      {post.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-extrabold rounded-md border border-amber-100 shrink-0">
                          Chờ duyệt
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-3">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('vi-VN') : ''}</span>
                      <span>·</span>
                      <span>{post.views || 0} lượt xem</span>
                      <span>·</span>
                      <span>{post.likes || 0} thích</span>
                    </div>
                  </Link>
                </div>
              ))}
              {userPosts.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-bold text-sm">
                  Chưa đăng câu hỏi nào.
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {userComments.map(comment => (
                <div key={comment.id} className="block group">
                  <Link 
                    to={`/post/${comment.postId}`} 
                    className="block hover:bg-slate-50 p-4 rounded-xl border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                      <span>Đã bình luận vào: {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'}</span>
                      {comment.postRating !== undefined && comment.postRating >= 0 && (
                        <span className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                          Đã đánh giá: {comment.postRating}★
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200/50 mb-2 font-medium">
                      {comment.content}
                    </p>
                    <div className="text-xs font-bold text-blue-600 hover:underline">
                      Xem bài viết gốc &rarr;
                    </div>
                  </Link>
                </div>
              ))}
              {userComments.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-bold text-sm">
                  Chưa gửi bình luận hay đáp án nào.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

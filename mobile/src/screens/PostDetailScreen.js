import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Linking,
  Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, resolveMediaUrl, WEB_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLoginGate } from '../context/LoginGate';
import Avatar from '../components/Avatar';
import { StarRatingDisplay, RateButton } from '../components/StarRating';
import Required from '../components/Required';
import { colors } from '../theme/colors';

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 20 * 1024 * 1024;

function guessFile(asset) {
  const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
  const isVideo = asset.type === 'video' || /mp4|mov|m4v/.test(ext);
  return {
    uri: asset.uri,
    name: `upload-${Date.now()}.${ext}`,
    type: asset.mimeType || (isVideo ? `video/${ext === 'mov' ? 'quicktime' : ext}` : `image/${ext === 'jpg' ? 'jpeg' : ext}`),
  };
}

export default function PostDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const { requireLogin } = useLoginGate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);

  
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentMedia, setEditCommentMedia] = useState([]);
  const [editCommentFiles, setEditCommentFiles] = useState([]);

  
  const [editingPost, setEditingPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostTopic, setEditPostTopic] = useState('');
  const [editPostMedia, setEditPostMedia] = useState([]);
  const [editPostFiles, setEditPostFiles] = useState([]);
  const [postSaving, setPostSaving] = useState(false);

  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  
  const [ratersModalOpen, setRatersModalOpen] = useState(false);
  const [raters, setRaters] = useState([]);
  const [ratersLoading, setRatersLoading] = useState(false);
  const ratersPollRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const isOwner = user && post && user.id === post.authorId;

  
  
  const viewCountedIdRef = useRef(null);

  
  useEffect(() => {
    api.get('/topics').then(setTopics).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    const countThisView = viewCountedIdRef.current !== id;
    try {
      const [p, cs] = await Promise.all([
        api.get(`/posts/${id}${countThisView ? '' : '?noview=1'}`),
        api.get(`/posts/${id}/comments`),
      ]);
      if (countThisView) viewCountedIdRef.current = id;
      setPost(p);
      setComments(cs);
      
      setEditPostTitle(p.title || '');
      setEditPostContent(p.content || '');
      setEditPostTopic(p.topic || '');
      setEditPostMedia(p.media || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const [p, cs] = await Promise.all([
          api.get(`/posts/${id}?noview=1`),
          api.get(`/posts/${id}/comments`),
        ]);
        setPost(p);
        setComments(cs);
      } catch (e) {
        console.error(e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  
  useEffect(() => {
    if (post && (isAdmin || (isOwner && post.status !== 'rejected'))) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={showActionMenu} style={{ padding: 6 }}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.primary} />
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({ headerRight: null });
    }
  }, [post, user]);

  const showActionMenu = () => {
    if (!post) return;
    const actions = [];

    if (isAdmin && post.status === 'pending') {
      actions.push({ text: 'Duyệt bài viết', onPress: doApprove });
      actions.push({ text: 'Từ chối duyệt', onPress: () => setRejectModalOpen(true) });
    }
    if (isAdmin && post.status === 'rejected') {
      actions.push({ text: 'Duyệt lại bài viết', onPress: doApprove });
    }
    if (isAdmin || (isOwner && post.status !== 'rejected')) {
      actions.push({
        text: 'Sửa bài viết',
        onPress: () => {
          setEditPostTitle(post.title || '');
          setEditPostContent(post.content || '');
          setEditPostTopic(post.topic || '');
          setEditPostMedia(post.media || []);
          setEditPostFiles([]);
          setEditingPost(true);
        },
      });
    }
    if (isAdmin || isOwner) {
      actions.push({ text: 'Xoá bài viết', onPress: confirmDeletePost, style: 'destructive' });
    }

    actions.push({ text: 'Hủy', style: 'cancel' });
    Alert.alert('Thao tác câu hỏi', 'Chọn hành động bạn muốn thực hiện:', actions);
  };

  const doApprove = async () => {
    try {
      const p = await api.patch(`/posts/${id}/approve`);
      setPost((x) => ({ ...x, ...p }));
      Alert.alert('Thành công', 'Bài viết đã được duyệt.');
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const doRejectSubmit = async () => {
    if (!rejectReason.trim()) return Alert.alert('Lý do không được để trống.');
    try {
      const p = await api.patch(`/posts/${id}/reject`, { reason: rejectReason.trim() });
      setPost((x) => ({ ...x, ...p }));
      setRejectModalOpen(false);
      setRejectReason('');
      Alert.alert('Thành công', 'Đã từ chối duyệt bài viết.');
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const confirmDeletePost = () => {
    Alert.alert('Xoá bài viết', 'Bạn có chắc chắn muốn xoá câu hỏi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/posts/${id}`);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Lỗi', e.message);
          }
        },
      },
    ]);
  };

  const pickMediaForType = async (currentFiles, setFiles) => {
    const totalSlots = currentFiles.length;
    if (totalSlots >= 5) return Alert.alert('Tối đa 5 tệp đính kèm.');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Cần quyền truy cập thư viện ảnh.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      selectionLimit: 5 - totalSlots,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const invalid = [];
      const valid = result.assets.filter((f) => {
        const isVideo = f.type === 'video';
        if (isVideo && f.fileSize > MAX_VIDEO) { invalid.push(`"${f.fileName || 'Video'}" vượt 20MB`); return false; }
        if (!isVideo && f.fileSize > MAX_IMAGE) { invalid.push(`"${f.fileName || 'Ảnh'}" vượt 5MB`); return false; }
        return true;
      });
      if (invalid.length) Alert.alert('File quá lớn', invalid.join('\n'));
      setFiles((prev) => [...prev, ...valid].slice(0, 5));
    }
  };

  const saveEditPost = async () => {
    if (!editPostContent.trim() || !editPostTopic) {
      return Alert.alert('Lỗi', 'Nội dung và chủ đề không được bỏ trống.');
    }
    setPostSaving(true);
    try {
      const form = new FormData();
      form.append('title', editPostTitle.trim());
      form.append('content', editPostContent.trim());
      form.append('topic', editPostTopic);
      form.append('keepMedia', JSON.stringify(editPostMedia.map((m) => m.url)));
      editPostFiles.forEach((f) => form.append('media', guessFile(f)));

      const p = await api.putForm(`/posts/${id}`, form);
      setPost((x) => ({ ...x, ...p }));
      setEditingPost(false);
      setEditPostFiles([]);
      Alert.alert('Thành công', p.status === 'pending' ? 'Bài viết đã cập nhật và đang chờ duyệt lại.' : 'Bài viết đã cập nhật thành công.');
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setPostSaving(false);
    }
  };

  const share = async () => {
    try {
      await Clipboard.setStringAsync(`${WEB_URL}/post/${id}`);
      Alert.alert('Đã sao chép', 'Đã sao chép liên kết bài viết vào bộ nhớ tạm!');

      const storageKey = `shared_post_${id}`;
      const alreadyShared = await AsyncStorage.getItem(storageKey);
      if (alreadyShared) return;

      const r = await api.post(`/posts/${id}/share`);
      setPost((p) => ({ ...p, shares: r.shares }));
      await AsyncStorage.setItem(storageKey, 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const ratePost = async (value) => {
    if (!user) return requireLogin('Bạn cần đăng nhập để đánh giá.');
    try {
      const r = await api.post(`/posts/${id}/rate`, { value });
      setPost((p) => ({ ...p, ratingAvg: r.ratingAvg, ratingCount: r.ratingCount, myRating: r.myRating }));
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const loadRaters = useCallback(async () => {
    try {
      const data = await api.get(`/posts/${id}/raters`);
      setRaters(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRatersLoading(false);
    }
  }, [id]);

  const openRatersModal = () => {
    setRatersModalOpen(true);
    setRatersLoading(true);
    loadRaters();
    ratersPollRef.current = setInterval(loadRaters, 3000);
  };

  const closeRatersModal = () => {
    setRatersModalOpen(false);
    clearInterval(ratersPollRef.current);
    ratersPollRef.current = null;
  };

  useEffect(() => () => clearInterval(ratersPollRef.current), []);

  const submitComment = async () => {
    if (!user) return requireLogin('Bạn cần đăng nhập để bình luận.');
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('content', commentText.trim());
      commentFiles.forEach((f) => form.append('media', guessFile(f)));

      const c = await api.postForm(`/posts/${id}/comments`, form);
      setComments((prev) => [...prev, c]);
      setCommentText('');
      setCommentFiles([]);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (comment) => {
    if (!user) return requireLogin('Bạn cần đăng nhập để trả lời.');
    if (!replyText.trim()) return;
    try {
      const form = new FormData();
      form.append('content', replyText.trim());
      replyFiles.forEach((f) => form.append('media', guessFile(f)));

      const c = await api.postForm(`/comments/${comment.id}/reply`, form);
      setComments((prev) => [...prev, c]);
      setReplyText('');
      setReplyFiles([]);
      setReplyingTo(null);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const startEditComment = (c) => {
    setEditingComment(c.id);
    setEditCommentText(c.content);
    setEditCommentMedia(c.media || []);
    setEditCommentFiles([]);
  };

  const saveEditComment = async (c) => {
    if (!editCommentText.trim()) return;
    try {
      const form = new FormData();
      form.append('content', editCommentText.trim());
      form.append('keepMedia', JSON.stringify(editCommentMedia.map((m) => m.url)));
      editCommentFiles.forEach((f) => form.append('media', guessFile(f)));

      const updated = await api.putForm(`/comments/${c.id}`, form);
      setComments((prev) => prev.map((x) => x.id === c.id ? updated : x));
      setEditingComment(null);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const deleteComment = async (cid) => {
    Alert.alert('Xoá bình luận', 'Bạn có chắc chắn muốn xoá bình luận này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/comments/${cid}`);
            const getAllDescendantIds = (parentId) => {
              const children = comments.filter((c) => c.parentId === parentId);
              return children.reduce(
                (acc, child) => [...acc, child.id, ...getAllDescendantIds(child.id)],
                []
              );
            };
            const toRemove = new Set([cid, ...getAllDescendantIds(cid)]);
            setComments((prev) => prev.filter((c) => !toRemove.has(c.id)));
          } catch (e) {
            Alert.alert('Lỗi', e.message);
          }
        },
      },
    ]);
  };

  const rateComment = async (c, value) => {
    if (!user) return requireLogin('Bạn cần đăng nhập để đánh giá.');
    try {
      const r = await api.post(`/comments/${c.id}/rate`, { value });
      setComments((prev) => prev.map((x) => x.id === c.id ? { ...x, ratingAvg: r.ratingAvg, ratingCount: r.ratingCount, myRating: r.myRating } : x));
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  
  const renderCommentNode = (c, depth = 0) => {
    const isCommentOwner = user && user.id === c.authorId;
    const isEditingThis = editingComment === c.id;
    const children = comments.filter((x) => x.parentId === c.id);

    return (
      <View key={c.id} style={[
        styles.commentBlock,
        (depth > 0 && depth < 3) && styles.nestedCommentBlock,
        depth >= 3 && { marginLeft: -36 }
      ]}>
        <View style={styles.commentRow}>
          <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: c.authorId })}>
            <Avatar url={c.authorPhotoURL} name={c.authorName} size={depth === 0 ? 36 : 28} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, marginLeft: 8 }}>
            {isEditingThis ? (
                            <View style={styles.inlineEditForm}>
                <TextInput
                  value={editCommentText}
                  onChangeText={setEditCommentText}
                  style={styles.inlineEditTextInput}
                  multiline
                />
                
                {}
                <View style={styles.editCommentMediaRow}>
                  {editCommentMedia.map((m, idx) => (
                    <View key={`ex-${idx}`} style={styles.smallThumb}>
                      {m.type === 'video' ? <View style={styles.smallVideoThumb}><Ionicons name="videocam" size={14} color={colors.slate400} /></View> : <Image source={{ uri: resolveMediaUrl(m.url) }} style={styles.smallThumbImg} />}
                      <TouchableOpacity style={styles.smallRemoveBtn} onPress={() => setEditCommentMedia((prev) => prev.filter((_, i) => i !== idx))}>
                        <Ionicons name="close" size={10} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {editCommentFiles.map((f, idx) => (
                    <View key={`new-${idx}`} style={[styles.smallThumb, { borderColor: '#93c5fd' }]}>
                      {f.type === 'video' ? <View style={styles.smallVideoThumb}><Ionicons name="videocam" size={14} color={colors.slate400} /></View> : <Image source={{ uri: f.uri }} style={styles.smallThumbImg} />}
                      <TouchableOpacity style={styles.smallRemoveBtn} onPress={() => setEditCommentFiles((prev) => prev.filter((_, i) => i !== idx))}>
                        <Ionicons name="close" size={10} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {(editCommentMedia.length + editCommentFiles.length) < 5 && (
                    <TouchableOpacity style={styles.smallAddMediaBtn} onPress={() => pickMediaForType(editCommentFiles, setEditCommentFiles)}>
                      <Ionicons name="image-outline" size={16} color={colors.slate400} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inlineEditBtnRow}>
                  <TouchableOpacity style={styles.cancelBtnSmall} onPress={() => setEditingComment(null)}>
                    <Text style={styles.cancelTextSmall}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtnSmall} onPress={() => saveEditComment(c)}>
                    <Text style={styles.saveTextSmall}>Lưu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
                            <>
                <View style={styles.bubble}>
                  <Text style={styles.commentAuthor} onPress={() => navigation.navigate('UserProfile', { userId: c.authorId })}>{c.authorName}</Text>
                  <Text style={styles.commentText}>{c.content}</Text>
                  
                  {}
                  {c.media?.length > 0 && (
                    <View style={styles.commentMediaGrid}>
                      {c.media.map((m, idx) => m.type === 'video' ? (
                        <TouchableOpacity key={idx} style={styles.commentVideoBox} onPress={() => Linking.openURL(resolveMediaUrl(m.url))}>
                          <Ionicons name="play-circle" size={18} color={colors.white} />
                          <Text style={styles.commentVideoLabel}>Xem Video</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity key={idx} onPress={() => setPreviewImage(resolveMediaUrl(m.url))}>
                          <Image source={{ uri: resolveMediaUrl(m.url) }} style={styles.commentMediaImg} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.commentFooter}>
                  <Text style={styles.commentTime}>{new Date(c.createdAt).toLocaleString('vi-VN')}</Text>
                  {c.updatedAt && c.updatedAt !== c.createdAt && <Text style={styles.editedText}>(đã sửa)</Text>}
                  <TouchableOpacity onPress={() => { if (!user) return requireLogin(); setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText(`@${c.authorName} `); setReplyFiles([]); }}>
                    <Text style={styles.replyBtn}>Trả lời</Text>
                  </TouchableOpacity>
                  <RateButton myValue={c.myRating} onRate={(v) => rateComment(c, v)} />
                  {c.ratingCount > 0 && (
                    <View style={styles.badgeRow}>
                      <Ionicons name="star" size={12} color={colors.star} />
                      <Text style={styles.ratingTextSmall}>{c.ratingAvg.toFixed(1)} ({c.ratingCount})</Text>
                    </View>
                  )}
                  {isCommentOwner && (
                    <TouchableOpacity onPress={() => startEditComment(c)}>
                      <Text style={[styles.replyBtn, { color: colors.primary }]}>Sửa</Text>
                    </TouchableOpacity>
                  )}
                  {(isAdmin || isCommentOwner) && (
                    <TouchableOpacity onPress={() => deleteComment(c.id)}>
                      <Text style={[styles.replyBtn, { color: colors.red }]}>Xoá</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {}
            {replyingTo === c.id && user && (
              <View style={styles.replyForm}>
                <View style={styles.replyInputRow}>
                  <TextInput
                    autoFocus
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder={`Trả lời ${c.authorName}...`}
                    placeholderTextColor={colors.slate400}
                    style={styles.replyInput}
                  />
                  <TouchableOpacity style={styles.replyAddMediaBtn} onPress={() => pickMediaForType(replyFiles, setReplyFiles)}>
                    <Ionicons name="image-outline" size={18} color={colors.slate500} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.replySendBtn} onPress={() => submitReply(c)}>
                    <Ionicons name="send" size={14} color={colors.white} />
                  </TouchableOpacity>
                </View>
                
                {}
                {replyFiles.length > 0 && (
                  <View style={styles.commentMediaGrid}>
                    {replyFiles.map((f, idx) => (
                      <View key={idx} style={styles.smallThumb}>
                        {f.type === 'video' ? <View style={styles.smallVideoThumb}><Ionicons name="videocam" size={14} color={colors.slate400} /></View> : <Image source={{ uri: f.uri }} style={styles.smallThumbImg} />}
                        <TouchableOpacity style={styles.smallRemoveBtn} onPress={() => setReplyFiles((prev) => prev.filter((_, i) => i !== idx))}>
                          <Ionicons name="close" size={10} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {}
            {children.length > 0 && (
              <View style={styles.repliesList}>
                {children.map((child) => renderCommentNode(child, depth + 1))}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading || !post) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const topComments = comments.filter((c) => !c.parentId);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        
        {post.status === 'rejected' && post.rejectReason && (
          <View style={styles.rejectNotice}>
            <Text style={styles.rejectNoticeText}>Lý do từ chối: {post.rejectReason}</Text>
          </View>
        )}

        {}
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.postHeader}
            onPress={() => navigation.navigate('UserProfile', { userId: post.authorId })}
            activeOpacity={0.7}
          >
            <Avatar url={post.authorPhotoURL} name={post.authorName} size={44} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.authorNameText}>{post.authorName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.metaText}>{new Date(post.createdAt).toLocaleString('vi-VN')}</Text>
                <Ionicons name="eye-outline" size={12} color={colors.slate400} />
                <Text style={styles.metaText}>{post.views || 0}</Text>
                {post.status !== 'approved' && (
                  <View style={[styles.statusTag, post.status === 'pending' ? styles.statusPending : styles.statusRejected]}>
                    <Text style={styles.statusTagText}>{post.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.title}>{post.title?.trim() || (post.content?.length > 50 ? post.content.substring(0, 50) + '...' : post.content)}</Text>
          <TouchableOpacity style={{ marginBottom: 12, alignSelf: 'flex-start' }} onPress={openRatersModal}>
            <StarRatingDisplay rating={post.ratingAvg || 0} count={post.ratingCount || 0} />
          </TouchableOpacity>
          <Text style={styles.content}>{post.content}</Text>

          {post.media?.length > 0 && (
            <View style={styles.mediaGrid}>
              {post.media.map((m, i) => m.type === 'video' ? (
                <TouchableOpacity key={i} style={styles.videoBox} onPress={() => Linking.openURL(resolveMediaUrl(m.url))}>
                  <Ionicons name="play-circle" size={30} color={colors.white} />
                  <Text style={styles.videoLabel}>Mở video</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity key={i} onPress={() => setPreviewImage(resolveMediaUrl(m.url))}>
                  <Image source={{ uri: resolveMediaUrl(m.url) }} style={styles.mediaImg} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.actionsRow}>
            <RateButton myValue={post.myRating ?? null} onRate={ratePost} size={16} />
            <View style={styles.actionItem}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.slate500} />
              <Text style={styles.actionText}>{comments.length}</Text>
            </View>
            <TouchableOpacity style={[styles.actionItem, { marginLeft: 'auto' }]} onPress={share}>
              <Ionicons name="share-social-outline" size={17} color={colors.slate500} />
              <Text style={styles.actionText}>{post.shares || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bình luận và giải đáp</Text>

          {user ? (
            <View style={styles.commentForm}>
              <View style={styles.identityChip}>
                <View style={styles.dot} />
                <Text style={styles.identityText}>Đang gửi với tên: <Text style={{ fontWeight: '800', color: colors.slate900 }}>{user.displayName}</Text></Text>
              </View>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Đóng góp lời giải..."
                placeholderTextColor={colors.slate400}
                style={styles.commentInput}
                multiline
              />
              
              {}
              {commentFiles.length > 0 && (
                <View style={styles.attachmentsRow}>
                  {commentFiles.map((f, i) => (
                    <View key={i} style={styles.smallThumb}>
                      {f.type === 'video' ? <View style={styles.smallVideoThumb}><Ionicons name="videocam" size={14} color={colors.slate400} /></View> : <Image source={{ uri: f.uri }} style={styles.smallThumbImg} />}
                      <TouchableOpacity style={styles.smallRemoveBtn} onPress={() => setCommentFiles((p) => p.filter((_, idx) => idx !== i))}>
                        <Ionicons name="close" size={10} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.commentSubmitRow}>
                {commentFiles.length < 5 && (
                  <TouchableOpacity style={styles.addMediaRowBtn} onPress={() => pickMediaForType(commentFiles, setCommentFiles)}>
                    <Ionicons name="image-outline" size={18} color={colors.slate500} />
                    <Text style={styles.addMediaRowText}>Đính kèm</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.submitBtn} onPress={submitComment} disabled={submitting}>
                  <Text style={styles.submitBtnText}>{submitting ? 'Đang gửi...' : 'Đăng bình luận'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.guestBox}>
              <Text style={styles.guestText}>Đăng nhập để bình luận và đánh giá câu hỏi này.</Text>
              <TouchableOpacity onPress={() => requireLogin('Bạn cần đăng nhập để bình luận.')}>
                <Text style={styles.link}>Đăng nhập ngay →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ marginTop: 16 }}>
            {topComments.map((c) => renderCommentNode(c, 0))}
            {topComments.length === 0 && <Text style={styles.empty}>Chưa có bình luận nào. Hãy đóng góp câu trả lời đầu tiên!</Text>}
          </View>
        </View>
      </ScrollView>

      {}
      <Modal visible={rejectModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Từ chối duyệt bài viết</Text>
            <Text style={styles.modalHint}>Nhập lý do từ chối (sẽ gửi thông báo cho tác giả):</Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Nhập lý do từ chối..."
              style={styles.modalInput}
              multiline
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRejectModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={doRejectSubmit}>
                <Text style={styles.confirmBtnText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={ratersModalOpen} animationType="slide" transparent onRequestClose={closeRatersModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ai đã đánh giá</Text>
            {ratersLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : raters.length === 0 ? (
              <Text style={styles.modalHint}>Chưa có ai đánh giá bài viết này.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {raters.map((r) => (
                  <View key={r.userId} style={styles.raterRow}>
                    <Avatar url={r.photoURL} name={r.displayName} size={36} />
                    <Text style={styles.raterName} numberOfLines={1}>{r.displayName}</Text>
                    <Text style={styles.raterStars}>{'★'.repeat(r.value)}{'☆'.repeat(5 - r.value)} ({r.value}/5)</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.confirmBtn} onPress={closeRatersModal}>
                <Text style={styles.confirmBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={editingPost} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView style={styles.editPostContainer} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              <Text style={styles.editPostHeader}>Chỉnh sửa câu hỏi</Text>
              
              <Text style={styles.editPostLabel}>Chủ đề<Required /></Text>
              <View style={styles.editPostTopicsRow}>
                {topics.map((t) => (
                  <TouchableOpacity
                    key={t.slug}
                    style={[styles.topicChip, editPostTopic === t.slug && styles.topicChipActive]}
                    onPress={() => setEditPostTopic(t.slug)}
                  >
                    <Text style={[styles.topicChipText, editPostTopic === t.slug && styles.topicChipTextActive]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.editPostLabel}>Tiêu đề (Không bắt buộc)</Text>
              <TextInput
                value={editPostTitle}
                onChangeText={setEditPostTitle}
                placeholder="Nhập tiêu đề (có thể bỏ trống)..."
                style={styles.editPostInput}
              />

              <Text style={styles.editPostLabel}>Nội dung<Required /></Text>
              <TextInput
                value={editPostContent}
                onChangeText={setEditPostContent}
                style={[styles.editPostInput, styles.editPostTextarea]}
                multiline
              />

            <Text style={styles.editPostLabel}>Ảnh / Video đính kèm (tối đa 5)</Text>
            <View style={styles.editPostMediaList}>
              {editPostMedia.map((m, idx) => (
                <View key={`exm-${idx}`} style={styles.editPostMediaThumb}>
                  {m.type === 'video' ? <View style={styles.editPostVideoThumb}><Ionicons name="videocam" size={24} color={colors.slate400} /></View> : <Image source={{ uri: resolveMediaUrl(m.url) }} style={styles.editPostMediaThumbImg} />}
                  <TouchableOpacity style={styles.editPostRemoveBtn} onPress={() => setEditPostMedia((prev) => prev.filter((_, i) => i !== idx))}>
                    <Ionicons name="close" size={12} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
              {editPostFiles.map((f, idx) => (
                <View key={`newm-${idx}`} style={[styles.editPostMediaThumb, { borderColor: '#93c5fd' }]}>
                  {f.type === 'video' ? <View style={styles.editPostVideoThumb}><Ionicons name="videocam" size={24} color={colors.slate400} /></View> : <Image source={{ uri: f.uri }} style={styles.editPostMediaThumbImg} />}
                  <TouchableOpacity style={styles.editPostRemoveBtn} onPress={() => setEditPostFiles((prev) => prev.filter((_, i) => i !== idx))}>
                    <Ionicons name="close" size={12} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
              {(editPostMedia.length + editPostFiles.length) < 5 && (
                <TouchableOpacity style={styles.editPostAddBtn} onPress={() => pickMediaForType(editPostFiles, setEditPostFiles)}>
                  <Ionicons name="image-outline" size={24} color={colors.slate400} />
                  <Text style={{ fontSize: 9, color: colors.slate400, marginTop: 2, fontWeight: '700' }}>Thêm</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.modalBtnRow, { marginTop: 24 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingPost(false)}>
                <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={saveEditPost} disabled={postSaving}>
                {postSaving ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.confirmBtnText}>Lưu thay đổi</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>

      {}
      {previewImage && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }} 
            activeOpacity={1} 
            onPress={() => setPreviewImage(null)}
          >
            <View style={{ width: '90%', height: '80%', justifyContent: 'center', alignItems: 'center' }}>
              <Image source={{ uri: previewImage }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              <TouchableOpacity 
                style={{ position: 'absolute', top: 20, right: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }} 
                onPress={() => setPreviewImage(null)}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.slate200, padding: 16, marginBottom: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  authorNameText: { fontSize: 14.5, fontWeight: '800', color: colors.slate900 },
  metaText: { fontSize: 11, color: colors.slate400, fontWeight: '600' },
  title: { fontSize: 19, fontWeight: '900', color: colors.slate900, marginBottom: 10, lineHeight: 25 },
  content: { fontSize: 14.5, color: colors.slate700, lineHeight: 21, marginBottom: 4 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  mediaImg: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: colors.slate200 },
  videoBox: { width: 100, height: 100, borderRadius: 12, backgroundColor: colors.slate700, alignItems: 'center', justifyContent: 'center' },
  videoLabel: { color: colors.white, fontSize: 10, fontWeight: '700', marginTop: 4 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingTop: 14, marginTop: 14, borderTopWidth: 1, borderTopColor: colors.slate100 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12.5, fontWeight: '700', color: colors.slate500 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: colors.slate900, paddingBottom: 12, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  
  
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  statusPending: { backgroundColor: colors.amberLight, borderColor: '#fde68a' },
  statusRejected: { backgroundColor: colors.redLight, borderColor: '#fecaca' },
  statusTagText: { fontSize: 9, fontWeight: '800', color: colors.slate700 },

  
  rejectNotice: { backgroundColor: colors.redLight, borderColor: '#fecaca', borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 12 },
  rejectNoticeText: { color: colors.red, fontSize: 13, fontWeight: '700' },

  
  commentForm: { backgroundColor: colors.slate50, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f099', padding: 12, marginTop: 8 },
  identityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.slate100, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  identityText: { fontSize: 11, fontWeight: '700', color: colors.slate600 },
  commentInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 12, padding: 12, fontSize: 13.5, minHeight: 70, textAlignVertical: 'top', color: colors.slate900 },
  commentSubmitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  addMediaRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  addMediaRowText: { fontSize: 12, fontWeight: '800', color: colors.slate600 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center' },
  submitBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  attachmentsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  
  guestBox: { backgroundColor: colors.primaryLight, borderRadius: 14, borderWidth: 1, borderColor: '#bfdbfe', padding: 16, alignItems: 'center', marginTop: 8 },
  guestText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, textAlign: 'center', marginBottom: 6 },
  link: { color: colors.primaryDark, fontWeight: '900', fontSize: 13 },
  
  
  commentBlock: { marginTop: 12 },
  nestedCommentBlock: { marginLeft: 12, borderLeftWidth: 1.5, borderLeftColor: colors.slate200, paddingLeft: 8 },
  commentRow: { flexDirection: 'row' },
  bubble: { backgroundColor: colors.slate100, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9, alignSelf: 'flex-start', maxWidth: '90%' },
  commentAuthor: { fontSize: 12, fontWeight: '900', color: colors.slate900 },
  commentText: { fontSize: 13.5, color: colors.slate700, marginTop: 2, lineHeight: 19 },
  commentFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 5, marginLeft: 8, flexWrap: 'wrap' },
  commentTime: { fontSize: 11, color: colors.slate400, fontWeight: '600' },
  editedText: { fontSize: 11, color: colors.slate400, fontWeight: '500', fontStyle: 'italic' },
  replyBtn: { fontSize: 11.5, fontWeight: '800', color: colors.slate600 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTextSmall: { fontSize: 11, fontWeight: '800', color: colors.amber },
  empty: { textAlign: 'center', color: colors.slate400, fontWeight: '700', fontSize: 13, paddingVertical: 24 },
  
  
  commentMediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  commentMediaImg: { width: 72, height: 72, borderRadius: 8, borderWidth: 1, borderColor: colors.slate200 },
  commentVideoBox: { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.slate700, alignItems: 'center', justifyContent: 'center' },
  commentVideoLabel: { color: colors.white, fontSize: 8, fontWeight: '700', marginTop: 2 },

  
  replyForm: { marginTop: 6, backgroundColor: colors.slate50, padding: 8, borderRadius: 10, borderLeftWidth: 2, borderLeftColor: colors.primary },
  replyInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyInput: { flex: 1, backgroundColor: colors.white, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, borderWidth: 1, borderColor: colors.slate200 },
  replyAddMediaBtn: { padding: 4 },
  replySendBtn: { backgroundColor: colors.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  
  inlineEditForm: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.primaryLight, padding: 10, borderRadius: 12 },
  inlineEditTextInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 10, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  editCommentMediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  inlineEditBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancelBtnSmall: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  cancelTextSmall: { fontSize: 12, fontWeight: '700', color: colors.slate500 },
  saveBtnSmall: { backgroundColor: colors.primary, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
  saveTextSmall: { fontSize: 12, fontWeight: '800', color: colors.white },

  
  smallThumb: { width: 44, height: 44, borderRadius: 8, position: 'relative', borderWidth: 1, borderColor: colors.slate200 },
  smallThumbImg: { width: '100%', height: '100%', borderRadius: 8 },
  smallVideoThumb: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  smallRemoveBtn: { position: 'absolute', top: -3, right: -3, backgroundColor: '#000000aa', borderRadius: 8, width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  smallAddMediaBtn: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.slate300, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },

  
  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContainer: { width: '100%', maxWidth: 340, backgroundColor: colors.white, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: colors.slate900, marginBottom: 8 },
  modalHint: { fontSize: 12, fontWeight: '700', color: colors.slate500, marginBottom: 10 },
  modalInput: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 10, padding: 10, minHeight: 60, textAlignVertical: 'top', fontSize: 13, marginBottom: 16 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtnText: { fontSize: 13, fontWeight: '800', color: colors.slate600 },
  confirmBtn: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  confirmBtnText: { fontSize: 13, fontWeight: '800', color: colors.white },

  raterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  raterName: { flex: 1, fontSize: 13.5, fontWeight: '800', color: colors.slate900 },
  raterStars: { fontSize: 12, fontWeight: '700', color: colors.amber },

  
  editPostContainer: { flex: 1, backgroundColor: colors.white },
  editPostHeader: { fontSize: 20, fontWeight: '900', color: colors.slate900, marginBottom: 20 },
  editPostLabel: { fontSize: 11, fontWeight: '800', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8, marginTop: 16 },
  editPostInput: { borderWidth: 1, borderColor: colors.slate300, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.slate900 },
  editPostTextarea: { minHeight: 120, textAlignVertical: 'top' },
  editPostTopicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.slate100 },
  topicChipActive: { backgroundColor: colors.primary },
  topicChipText: { fontSize: 12.5, fontWeight: '700', color: colors.slate600 },
  topicChipTextActive: { color: colors.white },
  editPostMediaList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  editPostMediaThumb: { width: 68, height: 68, borderRadius: 12, position: 'relative' },
  editPostMediaThumbImg: { width: '100%', height: '100%', borderRadius: 12, borderWidth: 1, borderColor: colors.slate200 },
  editPostVideoThumb: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  editPostRemoveBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: '#000000aa', borderRadius: 99, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  editPostAddBtn: { width: 68, height: 68, borderRadius: 12, borderWidth: 1.5, borderColor: colors.slate300, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});

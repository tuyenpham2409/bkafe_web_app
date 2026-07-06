import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLoginGate } from '../context/LoginGate';
import Avatar from '../components/Avatar';
import { StarRatingDisplay, RateButton } from '../components/StarRating';
import { colors } from '../theme/colors';

function CommentItem({ comment, isReply, replies, onReply, onRate, replyingTo, setReplyingTo, replyText, setReplyText, submitReply }) {
  return (
    <View style={{ marginTop: isReply ? 10 : 0 }}>
      <View style={styles.commentRow}>
        <Avatar url={comment.authorPhotoURL} name={comment.authorName} size={isReply ? 30 : 36} />
        <View style={{ flex: 1, marginLeft: 9 }}>
          <View style={styles.bubble}>
            <Text style={styles.commentAuthor}>{comment.authorName}</Text>
            <Text style={styles.commentText}>{comment.content}</Text>
          </View>
          <View style={styles.commentFooter}>
            <Text style={styles.commentTime}>{new Date(comment.createdAt).toLocaleString('vi-VN')}</Text>
            {!isReply && (
              <TouchableOpacity onPress={() => onReply(comment.id)}>
                <Text style={styles.replyBtn}>Trả lời</Text>
              </TouchableOpacity>
            )}
            <RateButton myValue={comment.myRating} onRate={(v) => onRate(comment, v)} />
            {comment.ratingCount > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="star" size={12} color={colors.star} />
                <Text style={styles.ratingSmall}>{comment.ratingAvg.toFixed(1)} ({comment.ratingCount})</Text>
              </View>
            )}
          </View>

          {!isReply && replyingTo === comment.id && (
            <View style={styles.replyInputRow}>
              <TextInput
                autoFocus
                value={replyText}
                onChangeText={setReplyText}
                placeholder={`Trả lời ${comment.authorName}...`}
                placeholderTextColor={colors.slate400}
                style={styles.replyInput}
                onSubmitEditing={() => submitReply(comment.id)}
              />
              <TouchableOpacity style={styles.replySendBtn} onPress={() => submitReply(comment.id)}>
                <Ionicons name="send" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}

          {!isReply && replies.length > 0 && (
            <View style={styles.repliesWrap}>
              {replies.map((r) => (
                <CommentItem key={r.id} comment={r} isReply onRate={onRate} replies={[]} />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function PostDetailScreen({ route }) {
  const { id } = route.params;
  const { user } = useAuth();
  const { requireLogin } = useLoginGate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, cs] = await Promise.all([api.get(`/posts/${id}`), api.get(`/posts/${id}/comments`)]);
      setPost(p); setComments(cs);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const share = async () => {
    try { const r = await api.post(`/posts/${id}/share`); setPost((p) => ({ ...p, shares: r.shares })); }
    catch (e) { console.error(e); }
  };

  const ratePost = async (value) => {
    if (!user) return requireLogin('Bạn cần đăng nhập để đánh giá.');
    try {
      const r = await api.post(`/posts/${id}/rate`, { value });
      setPost((p) => ({ ...p, ratingAvg: r.ratingAvg, ratingCount: r.ratingCount, myRating: r.myRating }));
    } catch (e) { alert(e.message); }
  };

  const rateComment = async (c, value) => {
    if (!user) return requireLogin('Bạn cần đăng nhập để đánh giá.');
    try {
      const r = await api.post(`/comments/${c.id}/rate`, { value });
      setComments((prev) => prev.map((x) => x.id === c.id ? { ...x, ratingAvg: r.ratingAvg, ratingCount: r.ratingCount, myRating: r.myRating } : x));
    } catch (e) { alert(e.message); }
  };

  const submitComment = async () => {
    if (!user) return requireLogin('Bạn cần đăng nhập để bình luận.');
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const c = await api.post(`/posts/${id}/comments`, { content: commentText.trim() });
      setComments((prev) => [...prev, c]);
      setCommentText('');
    } catch (e) { alert(e.message); } finally { setSubmitting(false); }
  };

  const openReply = (commentId) => {
    if (!user) return requireLogin('Bạn cần đăng nhập để trả lời.');
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText('');
  };

  const submitReply = async (parentId) => {
    if (!replyText.trim()) return;
    try {
      const c = await api.post(`/comments/${parentId}/reply`, { content: replyText.trim() });
      setComments((prev) => [...prev, c]);
      setReplyText(''); setReplyingTo(null);
    } catch (e) { alert(e.message); }
  };

  if (loading || !post) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  const topComments = comments.filter((c) => !c.parentId);
  const repliesOf = (pid) => comments.filter((c) => c.parentId === pid);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Post card */}
        <View style={styles.card}>
          <View style={styles.postHeader}>
            <Avatar url={post.authorPhotoURL} name={post.authorName} size={44} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.authorName}>{post.authorName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.metaText}>{new Date(post.createdAt).toLocaleString('vi-VN')}</Text>
                <Ionicons name="eye-outline" size={12} color={colors.slate400} />
                <Text style={styles.metaText}>{post.views || 0}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>{post.title}</Text>
          <View style={{ marginBottom: 12 }}><StarRatingDisplay rating={post.ratingAvg || 0} count={post.ratingCount || 0} /></View>
          <Text style={styles.content}>{post.content}</Text>

          {post.media?.length > 0 && (
            <View style={styles.mediaGrid}>
              {post.media.map((m, i) => m.type === 'video' ? (
                <TouchableOpacity key={i} style={styles.videoBox} onPress={() => Linking.openURL(m.url)}>
                  <Ionicons name="play-circle" size={30} color={colors.white} />
                  <Text style={styles.videoLabel}>Mở video</Text>
                </TouchableOpacity>
              ) : (
                <Image key={i} source={{ uri: m.url }} style={styles.mediaImg} />
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

        {/* Comments */}
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
              <TouchableOpacity style={styles.submitBtn} onPress={submitComment} disabled={submitting}>
                <Text style={styles.submitBtnText}>{submitting ? 'Đang gửi...' : 'Đăng bình luận'}</Text>
              </TouchableOpacity>
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
            {topComments.map((c) => (
              <CommentItem
                key={c.id} comment={c} replies={repliesOf(c.id)}
                onReply={openReply} onRate={rateComment}
                replyingTo={replyingTo} setReplyingTo={setReplyingTo}
                replyText={replyText} setReplyText={setReplyText} submitReply={submitReply}
              />
            ))}
            {topComments.length === 0 && <Text style={styles.empty}>Chưa có bình luận nào. Hãy đóng góp câu trả lời đầu tiên!</Text>}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.slate200, padding: 16, marginBottom: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  authorName: { fontSize: 14.5, fontWeight: '800', color: colors.slate900 },
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
  commentForm: { backgroundColor: colors.slate50, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f099', padding: 12, marginTop: 8 },
  identityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.slate100, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  identityText: { fontSize: 11, fontWeight: '700', color: colors.slate600 },
  commentInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 12, padding: 12, fontSize: 13.5, minHeight: 70, textAlignVertical: 'top', color: colors.slate900 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  guestBox: { backgroundColor: colors.primaryLight, borderRadius: 14, borderWidth: 1, borderColor: '#bfdbfe', padding: 16, alignItems: 'center', marginTop: 8 },
  guestText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, textAlign: 'center', marginBottom: 6 },
  link: { color: colors.primaryDark, fontWeight: '900', fontSize: 13 },
  commentRow: { flexDirection: 'row' },
  bubble: { backgroundColor: colors.slate100, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9, alignSelf: 'flex-start' },
  commentAuthor: { fontSize: 12, fontWeight: '900', color: colors.slate900 },
  commentText: { fontSize: 13.5, color: colors.slate700, marginTop: 2, lineHeight: 19 },
  commentFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 5, marginLeft: 10, flexWrap: 'wrap' },
  commentTime: { fontSize: 11, color: colors.slate500, fontWeight: '600' },
  replyBtn: { fontSize: 11.5, fontWeight: '800', color: colors.slate600 },
  ratingSmall: { fontSize: 11, fontWeight: '800', color: colors.amber },
  replyInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  replyInput: { flex: 1, backgroundColor: colors.slate100, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, fontSize: 13 },
  replySendBtn: { backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  repliesWrap: { marginTop: 4, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.slate100 },
  empty: { textAlign: 'center', color: colors.slate400, fontWeight: '700', fontSize: 13, paddingVertical: 24 },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { colors } from '../theme/colors';

export default function PostCard({ post, topicName, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Avatar url={post.authorPhotoURL} name={post.authorName} size={38} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.author} numberOfLines={1}>{post.authorName}</Text>
          <Text style={styles.date}>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</Text>
        </View>
        {!!topicName && (
          <View style={styles.topicBadge}>
            <Text style={styles.topicText}>#{topicName}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{post.title?.trim() || (post.content?.length > 50 ? post.content.substring(0, 50) + '...' : post.content)}</Text>
      <Text style={styles.content} numberOfLines={3}>{post.content}</Text>

      {post.media?.length > 0 && (
        <View style={styles.mediaRow}>
          <Ionicons name="image-outline" size={14} color={colors.slate400} />
          <Text style={styles.mediaText}>{post.media.length} tệp đính kèm</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.stat}>
          <Ionicons name={post.ratingCount > 0 ? 'star' : 'star-outline'} size={16} color={colors.star} />
          <Text style={styles.statText}>{post.ratingCount > 0 ? `${post.ratingAvg.toFixed(1)}/5` : 'Chưa đánh giá'}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.slate500} />
          <Text style={styles.statText}>{post.commentCount ?? 0}</Text>
        </View>
        <View style={[styles.stat, { marginLeft: 'auto' }]}>
          <Ionicons name="eye-outline" size={16} color={colors.slate500} />
          <Text style={styles.statText}>{post.views || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.slate200, padding: 14, marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  author: { fontSize: 13, fontWeight: '700', color: colors.slate900 },
  date: { fontSize: 11, color: colors.slate500, marginTop: 1 },
  topicBadge: { backgroundColor: colors.slate100, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  topicText: { fontSize: 10, fontWeight: '800', color: colors.slate600 },
  title: { fontSize: 15.5, fontWeight: '800', color: colors.slate900, marginBottom: 4 },
  content: { fontSize: 13.5, color: colors.slate700, lineHeight: 19, marginBottom: 10 },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  mediaText: { fontSize: 11, fontWeight: '700', color: colors.slate400 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600', color: colors.slate500 },
});

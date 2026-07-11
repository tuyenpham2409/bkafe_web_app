import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import Avatar from '../components/Avatar';
import { colors } from '../theme/colors';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [profData, postsData] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/posts?author=${userId}`),
      ]);
      setProfile(profData);
      setPosts(postsData.filter(p => p.status === 'approved'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Không tìm thấy người dùng.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: 40 }}>
      {/* Profile Card */}
      <View style={styles.card}>
        <Avatar url={profile.photoURL} name={profile.displayName} size={84} />
        <Text style={styles.name}>{profile.displayName}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="person" size={12} color={colors.slate600} />
          <Text style={styles.roleText}>{profile.role === 'admin' ? 'Quản trị viên' : 'Sinh viên HUST'}</Text>
        </View>

        {/* Bio Section */}
        <Text style={styles.bioText}>
          {profile.bio?.trim() ? profile.bio : 'Chưa có thông tin tiểu sử.'}
        </Text>

        <View style={styles.divider} />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{profile.postCount ?? posts.length}</Text>
            <Text style={styles.statLbl}>Câu hỏi</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{profile.commentCount ?? 0}</Text>
            <Text style={styles.statLbl}>Bình luận</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Joining Date */}
        <Text style={styles.email}>
          Tham gia ngày: {new Date(profile.joinedAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>

      {/* User's Posts list */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Các câu hỏi đã đăng ({posts.length})</Text>
        {posts.map((p) => (
          <TouchableOpacity key={p.id} style={styles.postItem} onPress={() => navigation.navigate('PostDetail', { id: p.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.postTitle} numberOfLines={1}>
                {p.title?.trim() || (p.content?.length > 50 ? p.content.substring(0, 50) + '...' : p.content)}
              </Text>
              <Text style={styles.postMeta}>{p.views || 0} lượt xem · {p.ratingCount > 0 ? `${p.ratingAvg.toFixed(1)}★` : 'Chưa đánh giá'}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {posts.length === 0 && <Text style={styles.empty}>Chưa đăng câu hỏi nào.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.slate50 },
  error: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 14, fontWeight: '700', color: colors.slate500 },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.slate200, padding: 18, marginBottom: 16, alignItems: 'center' },
  name: { fontSize: 19, fontWeight: '900', color: colors.slate900, marginTop: 12 },
  username: { fontSize: 13, fontWeight: '600', color: colors.slate400, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.slate100, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10, marginBottom: 14 },
  roleText: { fontSize: 11.5, fontWeight: '700', color: colors.slate600 },
  bioText: { fontSize: 13.5, color: colors.slate600, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8, marginVertical: 6 },
  divider: { height: 1, width: '100%', backgroundColor: colors.slate100, marginVertical: 12 },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-evenly' },
  statCol: { alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '900', color: colors.slate900 },
  statLbl: { fontSize: 11, fontWeight: '600', color: colors.slate400, marginTop: 2 },
  email: { fontSize: 11.5, color: colors.slate400, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: colors.slate900, alignSelf: 'flex-start', marginBottom: 8 },
  postItem: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.slate100 },
  postTitle: { fontSize: 13.5, fontWeight: '800', color: colors.slate900 },
  postMeta: { fontSize: 11, color: colors.slate400, fontWeight: '600', marginTop: 2 },
  empty: { fontSize: 12.5, color: colors.slate400, fontWeight: '700', alignSelf: 'center', paddingVertical: 16 },
});

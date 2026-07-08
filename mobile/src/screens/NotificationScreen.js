import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

function LoggedOutNotificationView({ navigation }) {
  return (
    <View style={styles.loggedOut}>
      <View style={styles.loggedOutIcon}>
        <Ionicons name="notifications-outline" size={30} color={colors.primary} />
      </View>
      <Text style={styles.loggedOutTitle}>Bạn chưa đăng nhập</Text>
      <Text style={styles.loggedOutText}>Đăng nhập để xem thông báo cá nhân, lượt duyệt bài và phản hồi của bạn.</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.primaryBtnText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NotificationScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData] = useState({ unread: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [user, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const markAllRead = async () => {
    if (data.unread === 0) return;
    try {
      await api.patch('/notifications/read-all');
      load();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const clickItem = async (n) => {
    try {
      if (!n.read) {
        await api.patch(`/notifications/${n.id}/read`);
      }
      if (n.link) {
        const match = n.link.match(/\/post\/([a-f\d]{24})/i);
        if (match && match[1]) {
          navigation.navigate('PostDetail', { id: match[1] });
        } else {
          navigation.navigate('Home');
        }
      }
      load();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  if (!user) return <LoggedOutNotificationView navigation={navigation} />;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>🔔 Thông báo</Text>
        {data.unread > 0 && (
          <TouchableOpacity style={styles.readAllBtn} onPress={markAllRead}>
            <Ionicons name="checkmark-done-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.readAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={data.items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.slate300} />
            <Text style={styles.emptyText}>Chưa có thông báo nào dành cho bạn.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notificationCard, !item.read && styles.unreadCard]}
            onPress={() => clickItem(item)}
          >
            <View style={styles.cardHeader}>
              {!item.read && <View style={styles.unreadDot} />}
              <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  brand: { fontSize: 20, fontWeight: '900', color: colors.slate900, flex: 1 },
  readAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: colors.slate100 },
  readAllText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  listContainer: { padding: 16, flexGrow: 1 },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: 14,
    marginBottom: 12,
  },
  unreadCard: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff33',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  title: { fontSize: 13.5, fontWeight: '800', color: colors.slate800, flex: 1 },
  unreadTitle: { color: colors.slate900 },
  message: { fontSize: 12.5, color: colors.slate600, lineHeight: 18, marginBottom: 6 },
  time: { fontSize: 10, color: colors.slate400, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { fontSize: 13, fontWeight: '700', color: colors.slate400, marginTop: 12, textAlign: 'center' },
  // Logged out styles
  loggedOut: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loggedOutIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  loggedOutTitle: { fontSize: 17, fontWeight: '900', color: colors.slate900, marginBottom: 6 },
  loggedOutText: { fontSize: 13, color: colors.slate500, fontWeight: '600', textAlign: 'center', marginBottom: 22 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 40, alignItems: 'center', alignSelf: 'stretch' },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});

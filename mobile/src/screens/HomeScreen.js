import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLoginGate } from '../context/LoginGate';
import PostCard from '../components/PostCard';
import { colors } from '../theme/colors';

const POPUP_SEEN_KEY = 'bkafe_popup_seen';
const SITE_VIEW_KEY = 'bkafe_view_tracked';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { requireLogin } = useLoginGate();

  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState('all');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    api.get('/topics').then(setTopics).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort: 'newest' });
      if (activeTopic !== 'all') params.set('topic', activeTopic);
      if (query.trim()) params.set('q', query.trim());
      const data = await api.get(`/posts?${params.toString()}`);
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTopic, query]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  // Count one website view per app session (mirrors the web sessionStorage counter)
  useEffect(() => {
    (async () => {
      const tracked = await AsyncStorage.getItem(SITE_VIEW_KEY);
      if (!tracked) {
        await AsyncStorage.setItem(SITE_VIEW_KEY, '1');
        api.post('/stats/view').catch(() => {});
      }
    })();
  }, []);

  // Ad popup 1 minute after opening the app, suppressed forever once closed (AsyncStorage ~ cookie)
  useEffect(() => {
    let timer;
    (async () => {
      const seen = await AsyncStorage.getItem(POPUP_SEEN_KEY);
      if (!seen) timer = setTimeout(() => setShowPopup(true), 60000);
    })();
    return () => clearTimeout(timer);
  }, []);

  const closePopup = async () => {
    setShowPopup(false);
    await AsyncStorage.setItem(POPUP_SEEN_KEY, '1');
  };

  const openCreatePost = () => {
    if (!user) return requireLogin('Bạn cần đăng nhập để đăng câu hỏi.');
    navigation.navigate('CreatePost');
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>☕ BKafe</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreatePost}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.slate400} style={{ marginLeft: 12 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={load}
          placeholder="Tìm câu hỏi..."
          placeholderTextColor={colors.slate400}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* Topic chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        data={[{ slug: 'all', name: 'Tất cả' }, ...topics]}
        keyExtractor={(t) => t.slug}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, activeTopic === item.slug && styles.chipActive]}
            onPress={() => setActiveTopic(item.slug)}
          >
            <Text style={[styles.chipText, activeTopic === item.slug && styles.chipTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              topicName={topics.find((t) => t.slug === item.topic)?.name}
              onPress={() => navigation.navigate('PostDetail', { id: item.id })}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có câu hỏi nào.</Text>}
        />
      )}

      {/* Ad popup */}
      <Modal visible={showPopup} transparent animationType="fade" onRequestClose={closePopup}>
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <TouchableOpacity style={styles.popupClose} onPress={closePopup}>
              <Ionicons name="close" size={20} color={colors.slate400} />
            </TouchableOpacity>
            <View style={styles.popupIcon}><Ionicons name="cafe" size={28} color={colors.primary} /></View>
            <Text style={styles.popupTitle}>Ưu đãi BKafe!</Text>
            <Text style={styles.popupMsg}>Tham gia ngay cộng đồng sinh viên HUST để nhận tài liệu ôn thi độc quyền hoàn toàn miễn phí.</Text>
            <TouchableOpacity style={styles.popupBtn} onPress={closePopup}>
              <Text style={styles.popupBtnText}>Khám phá ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  brand: { fontSize: 21, fontWeight: '900', color: colors.primary },
  addBtn: { backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: colors.slate200, marginBottom: 10 },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: colors.slate900 },
  chipsRow: { flexGrow: 0, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.slate100 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '700', color: colors.slate600 },
  chipTextActive: { color: colors.white },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  empty: { textAlign: 'center', color: colors.slate400, fontWeight: '700', marginTop: 40 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  popup: { backgroundColor: colors.white, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  popupClose: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  popupIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  popupTitle: { fontSize: 18, fontWeight: '900', color: colors.slate900, textAlign: 'center', marginBottom: 8 },
  popupMsg: { fontSize: 13, color: colors.slate600, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  popupBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  popupBtnText: { color: colors.white, fontWeight: '800', fontSize: 13.5 },
});

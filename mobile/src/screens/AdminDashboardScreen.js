import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Switch, Modal, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { colors } from '../theme/colors';

// Helper for relative active time
function userActiveTime(date) {
  if (!date) return 'Chưa có lịch sử';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000); // seconds
  if (diff < 60) return 'Đang hoạt động';
  if (diff < 3600) return `Hoạt động ${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `Hoạt động ${Math.floor(diff / 3600)} giờ trước`;
  return `Hoạt động ${Math.floor(diff / 86400)} ngày trước`;
}

export default function AdminDashboardScreen({ navigation }) {
  const { user } = useAuth();
  
  // Tab: 'stats', 'posts', 'users'
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sub-tab for Duyệt bài: 'pending' or 'approved'
  const [postStatusFilter, setPostStatusFilter] = useState('pending');

  // States
  const [stats, setStats] = useState(null);
  const [postsList, setPostsList] = useState([]);
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');

  // User Settings Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [banPosting, setBanPosting] = useState(false);
  const [banCommenting, setBanCommenting] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Check auth
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Alert.alert('Không có quyền', 'Bạn không có quyền truy cập trang quản trị.');
      navigation.goBack();
    }
  }, [user]);

  const loadData = useCallback(async () => {
    try {
      if (activeTab === 'stats') {
        const data = await api.get('/stats');
        setStats(data);
      } else if (activeTab === 'posts') {
        const data = await api.get(`/posts?status=${postStatusFilter}`);
        setPostsList(data);
      } else if (activeTab === 'users') {
        const data = await api.get('/users');
        setUsers(data);
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, postStatusFilter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Poll admin data every 4 seconds to keep dashboard updated without sockets
  useEffect(() => {
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenBanModal = (u) => {
    setSelectedUser(u);
    setBanPosting(u.bannedPosting || false);
    setBanCommenting(u.bannedCommenting || false);
    setBanReason(u.banReason || '');
    setIsAdminRole(u.role === 'admin');
  };

  const handleSaveBan = async () => {
    if (!selectedUser) return;
    setSavingUser(true);
    try {
      // 1. Update ban settings
      const banRes = await api.patch(`/users/${selectedUser.id}/ban`, {
        bannedPosting: banPosting,
        bannedCommenting: banCommenting,
        reason: banReason.trim(),
      });

      // 2. Update role if role was toggled
      const originalIsAdmin = selectedUser.role === 'admin';
      let finalRole = selectedUser.role;
      if (isAdminRole !== originalIsAdmin) {
        await api.put(`/users/${selectedUser.id}`, {
          role: isAdminRole ? 'admin' : 'user'
        });
        finalRole = isAdminRole ? 'admin' : 'user';
      }
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, ...banRes, role: finalRole }
            : u
        )
      );

      setSelectedUser(null);
      Alert.alert('Thành công', 'Đã cập nhật cấu hình tài khoản.');
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (uid) => {
    Alert.alert('Xoá tài khoản', 'Bạn có chắc chắn muốn xoá tài khoản này? Hành động này không thể hoàn tác.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/users/${uid}`);
            setUsers((prev) => prev.filter((u) => u.id !== uid));
            setSelectedUser(null);
            Alert.alert('Thành công', 'Đã xoá tài khoản.');
          } catch (e) {
            Alert.alert('Lỗi', e.message);
          }
        },
      },
    ]);
  };

  // Filter users based on query
  const filteredUsers = users.filter((u) => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.screen}>
      {/* Top Tab Selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'stats' && styles.tabItemActive]} onPress={() => { setLoading(true); setActiveTab('stats'); }}>
          <Ionicons name="stats-chart" size={16} color={activeTab === 'stats' ? colors.primary : colors.slate500} />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>KPI Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'posts' && styles.tabItemActive]} onPress={() => { setLoading(true); setActiveTab('posts'); }}>
          <Ionicons name="document-text" size={16} color={activeTab === 'posts' ? colors.primary : colors.slate500} />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>Duyệt bài</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'users' && styles.tabItemActive]} onPress={() => { setLoading(true); setActiveTab('users'); }}>
          <Ionicons name="people" size={16} color={activeTab === 'users' ? colors.primary : colors.slate500} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Thành viên</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* STATS TAB */}
          {activeTab === 'stats' && stats && (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="eye" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{stats.totalViews}</Text>
                <Text style={styles.statLabel}>Lượt xem web</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="document-text" size={24} color={colors.green} />
                <Text style={styles.statValue}>{stats.totalPosts}</Text>
                <Text style={styles.statLabel}>Bài viết</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="hourglass" size={24} color={colors.amber} />
                <Text style={styles.statValue}>{stats.pendingPosts}</Text>
                <Text style={styles.statLabel}>Bài chờ duyệt</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people" size={24} color="#6366f1" />
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Thành viên</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="chatbubbles" size={24} color="#ec4899" />
                <Text style={styles.statValue}>{stats.totalComments}</Text>
                <Text style={styles.statLabel}>Bình luận</Text>
              </View>
            </View>
          )}

          {/* DUYỆT BÀI TAB */}
          {activeTab === 'posts' && (
            <View>
              {/* Sub tabs for posts list */}
              <View style={styles.subTabBar}>
                <TouchableOpacity
                  style={[styles.subTabItem, postStatusFilter === 'pending' && styles.subTabItemActive]}
                  onPress={() => { setLoading(true); setPostStatusFilter('pending'); }}
                >
                  <Text style={[styles.subTabText, postStatusFilter === 'pending' && styles.subTabTextActive]}>Chờ duyệt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subTabItem, postStatusFilter === 'approved' && styles.subTabItemActive]}
                  onPress={() => { setLoading(true); setPostStatusFilter('approved'); }}
                >
                  <Text style={[styles.subTabText, postStatusFilter === 'approved' && styles.subTabTextActive]}>Đã duyệt</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>
                {postStatusFilter === 'pending' ? `Bài viết chờ duyệt (${postsList.length})` : `Bài viết đã duyệt (${postsList.length})`}
              </Text>
              {postsList.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.postCard}
                  onPress={() => navigation.navigate('PostDetail', { id: p.id })}
                >
                  <View style={styles.postCardHeader}>
                    <Avatar url={p.authorPhotoURL} name={p.authorName} size={32} />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={styles.postAuthor}>{p.authorName}</Text>
                      <Text style={styles.postTime}>{new Date(p.createdAt).toLocaleString('vi-VN')}</Text>
                    </View>
                    <View style={p.status === 'approved' ? styles.badgeApproved : styles.badgePending}>
                      <Text style={p.status === 'approved' ? styles.badgeTextApproved : styles.badgeTextPending}>
                        {p.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.postTitle} numberOfLines={1}>
                    {p.title?.trim() || (p.content?.length > 40 ? p.content.substring(0, 40) + '...' : p.content)}
                  </Text>
                  <Text style={styles.postSnippet} numberOfLines={2}>{p.content}</Text>
                </TouchableOpacity>
              ))}
              {postsList.length === 0 && (
                <Text style={styles.emptyText}>Không có bài đăng nào.</Text>
              )}
            </View>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <View>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={18} color={colors.slate400} style={styles.searchIcon} />
                <TextInput
                  value={userQuery}
                  onChangeText={setUserQuery}
                  placeholder="Tìm kiếm thành viên..."
                  placeholderTextColor={colors.slate400}
                  style={styles.searchInput}
                />
              </View>

              {filteredUsers.map((u) => {
                const isBanned = u.bannedPosting || u.bannedCommenting;
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={styles.userCard}
                    onPress={() => handleOpenBanModal(u)}
                  >
                    <Avatar url={u.photoURL} name={u.displayName} size={40} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.userName}>{u.displayName}</Text>
                      <Text style={styles.userUsername}>@{u.username} · {u.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}</Text>
                      
                      {/* Detailed last active and join date */}
                      <Text style={styles.userActive}>
                        {userActiveTime(u.lastActiveAt)} · Nhập học {new Date(u.joinedAt || u.createdAt).toLocaleDateString('vi-VN')}
                      </Text>

                      {isBanned && (
                        <View style={styles.banRowBadge}>
                          <Ionicons name="ban" size={11} color={colors.red} />
                          <Text style={styles.banTextBadge}>
                            Hạn chế: {[u.bannedPosting && 'Đăng bài', u.bannedCommenting && 'Bình luận'].filter(Boolean).join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="settings-sharp" size={18} color={colors.slate400} />
                  </TouchableOpacity>
                );
              })}
              {filteredUsers.length === 0 && (
                <Text style={styles.emptyText}>Không tìm thấy thành viên nào phù hợp.</Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Settings / Ban User Modal */}
      {selectedUser && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Avatar url={selectedUser.photoURL} name={selectedUser.displayName} size={36} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.modalUserName}>{selectedUser.displayName}</Text>
                  <Text style={styles.modalUserSub}>@{selectedUser.username} · {selectedUser.role === 'admin' ? 'QTV' : 'Sinh viên'}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedUser(null)}>
                  <Ionicons name="close" size={24} color={colors.slate600} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Cấp quyền & Thiết lập</Text>

              {/* Admin Role Toggle */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Quyền quản trị viên (Admin)</Text>
                <Switch value={isAdminRole} onValueChange={setIsAdminRole} />
              </View>

              <Text style={[styles.modalLabel, { marginTop: 16 }]}>Hạn chế quyền hoạt động</Text>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Khóa quyền đăng câu hỏi</Text>
                <Switch value={banPosting} onValueChange={setBanPosting} />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Khóa quyền bình luận</Text>
                <Switch value={banCommenting} onValueChange={setBanCommenting} />
              </View>

              {(banPosting || banCommenting) && (
                <View>
                  <Text style={styles.modalLabelInput}>Lý do khóa / hạn chế:</Text>
                  <TextInput
                    value={banReason}
                    onChangeText={setBanReason}
                    placeholder="Nhập lý do gửi đến người dùng..."
                    style={styles.modalInput}
                    multiline
                  />
                </View>
              )}

              <View style={styles.modalActionsRow}>
                {selectedUser.id !== user.id && (
                  <TouchableOpacity
                    style={styles.deleteUserBtn}
                    onPress={() => handleDeleteUser(selectedUser.id)}
                  >
                    <Ionicons name="trash" size={16} color={colors.red} />
                    <Text style={styles.deleteUserBtnText}>Xoá tài khoản</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.saveUserBtn}
                  onPress={handleSaveBan}
                  disabled={savingUser}
                >
                  {savingUser ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.saveUserBtnText}>Lưu thiết lập</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.slate200, paddingTop: 48 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.slate500 },
  tabTextActive: { color: colors.primary },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.slate900, marginTop: 8 },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.slate500, marginTop: 2 },
  
  // Duyệt bài Sub-tab
  subTabBar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  subTabItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.slate100, borderWidth: 1, borderColor: colors.slate200 },
  subTabItemActive: { backgroundColor: colors.primaryLight, borderColor: '#bfdbfe' },
  subTabText: { fontSize: 11.5, fontWeight: '700', color: colors.slate600 },
  subTabTextActive: { color: colors.primary },

  // Pending posts
  sectionTitle: { fontSize: 15, fontWeight: '900', color: colors.slate900, marginBottom: 12 },
  postCard: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.slate200, padding: 12, marginBottom: 12 },
  postCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAuthor: { fontSize: 12.5, fontWeight: '800', color: colors.slate900 },
  postTime: { fontSize: 10, color: colors.slate400, fontWeight: '600', marginTop: 1 },
  badgePending: { backgroundColor: colors.amberLight, borderWidth: 1, borderColor: '#fde68a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTextPending: { fontSize: 9, fontWeight: '800', color: colors.slate700 },
  badgeApproved: { backgroundColor: colors.greenLight, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTextApproved: { fontSize: 9, fontWeight: '800', color: colors.green },
  postTitle: { fontSize: 14, fontWeight: '800', color: colors.slate900, marginBottom: 4 },
  postSnippet: { fontSize: 12, color: colors.slate600, lineHeight: 18 },
  emptyText: { fontSize: 13, fontWeight: '700', color: colors.slate400, textAlign: 'center', paddingVertical: 32 },

  // Users tab
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 10, borderWidth: 1, borderColor: colors.slate300, paddingHorizontal: 12, marginBottom: 14 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: colors.slate900, paddingVertical: 8 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: 12, padding: 12, marginBottom: 10 },
  userName: { fontSize: 13.5, fontWeight: '800', color: colors.slate900 },
  userUsername: { fontSize: 11, fontWeight: '600', color: colors.slate400, marginTop: 1 },
  userActive: { fontSize: 10, fontWeight: '700', color: colors.slate400, marginTop: 3 },
  banRowBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.redLight, alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  banTextBadge: { fontSize: 9.5, fontWeight: '800', color: colors.red },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.slate100, paddingBottom: 12, marginBottom: 16 },
  modalUserName: { fontSize: 15, fontWeight: '900', color: colors.slate900 },
  modalUserSub: { fontSize: 11.5, color: colors.slate400, fontWeight: '600' },
  modalLabel: { fontSize: 12, fontWeight: '900', color: colors.slate900, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 10 },
  modalLabelInput: { fontSize: 11.5, fontWeight: '800', color: colors.slate500, marginTop: 14, marginBottom: 6 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  switchLabel: { fontSize: 13, color: colors.slate700, fontWeight: '700' },
  modalInput: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 8, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  modalActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
  deleteUserBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#fecaca', backgroundColor: colors.redLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  deleteUserBtnText: { fontSize: 12.5, fontWeight: '800', color: colors.red },
  saveUserBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10, marginLeft: 'auto' },
  saveUserBtnText: { fontSize: 12.5, fontWeight: '800', color: colors.white },
});

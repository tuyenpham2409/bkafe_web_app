import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import Avatar from '../components/Avatar';
import { colors } from '../theme/colors';

function LoggedOutView({ navigation }) {
  return (
    <View style={styles.loggedOut}>
      <View style={styles.loggedOutIcon}><Ionicons name="person-outline" size={30} color={colors.primary} /></View>
      <Text style={styles.loggedOutTitle}>Bạn chưa đăng nhập</Text>
      <Text style={styles.loggedOutText}>Đăng nhập để xem hồ sơ, đăng câu hỏi và bình luận.</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.primaryBtnText}>Đăng nhập</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.secondaryBtnText}>Đăng ký tài khoản mới</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');

  const load = useCallback(() => {
    if (!user) return;
    api.get(`/posts?author=${user.id}`).then(setPosts).catch(() => {});
  }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!user) return <LoggedOutView navigation={navigation} />;

  const changeAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Cần quyền truy cập thư viện ảnh.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    setAvatarUploading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 256, height: 256 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const dataUrl = `data:image/jpeg;base64,${manipulated.base64}`;
      await api.put('/users/me', { photoURL: dataUrl });
      await refreshUser();
    } catch (e) { Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện.'); } finally { setAvatarUploading(false); }
  };

  const changeUsername = async () => {
    setSettingsMsg('');
    try {
      await api.put('/auth/username', { username: newUsername.trim() });
      setNewUsername(''); setSettingsMsg('✅ Đã đổi tên đăng nhập.'); await refreshUser();
    } catch (e) { setSettingsMsg('❌ ' + e.message); }
  };
  const changePassword = async () => {
    setSettingsMsg('');
    try {
      await api.put('/auth/password', { currentPassword: curPw, newPassword: newPw });
      setCurPw(''); setNewPw(''); setSettingsMsg('✅ Đã đổi mật khẩu.');
    } catch (e) { setSettingsMsg('❌ ' + e.message); }
  };

  const doLogout = () => Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Đăng xuất', style: 'destructive', onPress: logout },
  ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 40 }}>
      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          <Avatar url={user.photoURL} name={user.displayName} size={84} />
          <TouchableOpacity style={styles.avatarEditBtn} onPress={changeAvatar} disabled={avatarUploading}>
            {avatarUploading ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="camera" size={16} color={colors.white} />}
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="person" size={12} color={colors.slate600} />
          <Text style={styles.roleText}>{user.role === 'admin' ? 'Quản trị viên' : 'Sinh viên HUST'}</Text>
        </View>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.rowBtns}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings((s) => !s)}>
            <Ionicons name="settings-outline" size={15} color={colors.slate600} />
            <Text style={styles.settingsBtnText}>Cài đặt tài khoản</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={doLogout}>
            <Ionicons name="log-out-outline" size={15} color={colors.red} />
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showSettings && (
        <View style={styles.card}>
          {!!settingsMsg && <Text style={styles.settingsMsg}>{settingsMsg}</Text>}

          <Text style={styles.sectionTitle}>Đổi tên đăng nhập</Text>
          {user.usernameChanged ? (
            <Text style={styles.warnText}>Bạn đã đổi tên đăng nhập một lần và không thể đổi lại.</Text>
          ) : (
            <>
              <Text style={styles.hint}>Chỉ được đổi duy nhất một lần.</Text>
              <TextInput value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" placeholder="Tên đăng nhập mới" placeholderTextColor={colors.slate400} style={styles.input} />
              <TouchableOpacity style={styles.darkBtn} onPress={changeUsername}><Text style={styles.darkBtnText}>Đổi username</Text></TouchableOpacity>
            </>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Đổi mật khẩu</Text>
          <PasswordInput value={curPw} onChangeText={setCurPw} placeholder="Mật khẩu hiện tại" autoComplete="current-password" />
          <View style={{ height: 10 }} />
          <PasswordInput value={newPw} onChangeText={setNewPw} placeholder="Mật khẩu mới" autoComplete="new-password" />
          <TouchableOpacity style={styles.darkBtn} onPress={changePassword}><Text style={styles.darkBtnText}>Đổi mật khẩu</Text></TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Câu hỏi đã đăng ({posts.length})</Text>
        {posts.map((p) => (
          <TouchableOpacity key={p.id} style={styles.postItem} onPress={() => navigation.navigate('PostDetail', { id: p.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.postTitle} numberOfLines={1}>{p.title}</Text>
              <Text style={styles.postMeta}>{p.views || 0} lượt xem · {p.ratingCount > 0 ? `${p.ratingAvg.toFixed(1)}★` : 'Chưa đánh giá'}</Text>
            </View>
            {p.status !== 'approved' && (
              <View style={[styles.statusBadge, p.status === 'pending' ? styles.statusPending : styles.statusRejected]}>
                <Text style={styles.statusText}>{p.status === 'pending' ? 'Chờ duyệt' : 'Bị từ chối'}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        {posts.length === 0 && <Text style={styles.empty}>Chưa đăng câu hỏi nào.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.slate200, padding: 18, marginBottom: 16, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 10 },
  avatarEditBtn: { position: 'absolute', bottom: -2, right: -2, backgroundColor: colors.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  name: { fontSize: 19, fontWeight: '900', color: colors.slate900 },
  username: { fontSize: 13, fontWeight: '600', color: colors.slate400, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.slate100, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10 },
  roleText: { fontSize: 11.5, fontWeight: '700', color: colors.slate600 },
  email: { fontSize: 12, color: colors.slate400, marginTop: 8 },
  rowBtns: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  settingsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: 10, paddingVertical: 10 },
  settingsBtnText: { fontSize: 12.5, fontWeight: '800', color: colors.slate600 },
  logoutBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#fecaca', backgroundColor: colors.redLight, borderRadius: 10, paddingVertical: 10 },
  logoutBtnText: { fontSize: 12.5, fontWeight: '800', color: colors.red },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: colors.slate900, alignSelf: 'flex-start', marginBottom: 8 },
  hint: { fontSize: 11, color: colors.slate400, fontWeight: '600', marginBottom: 8, alignSelf: 'flex-start' },
  warnText: { fontSize: 12, color: colors.amber, fontWeight: '700', backgroundColor: colors.amberLight, borderWidth: 1, borderColor: '#fde68a', borderRadius: 10, padding: 10, alignSelf: 'stretch' },
  input: { alignSelf: 'stretch', borderWidth: 1, borderColor: colors.slate200, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, fontSize: 13.5, color: colors.slate900, marginBottom: 8 },
  darkBtn: { alignSelf: 'stretch', backgroundColor: colors.slate700, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 4 },
  darkBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  settingsMsg: { alignSelf: 'stretch', fontSize: 12.5, fontWeight: '700', color: colors.slate700, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: 10, padding: 10, marginBottom: 12 },
  postItem: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.slate100 },
  postTitle: { fontSize: 13.5, fontWeight: '800', color: colors.slate900 },
  postMeta: { fontSize: 11, color: colors.slate400, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  statusPending: { backgroundColor: colors.amberLight, borderColor: '#fde68a' },
  statusRejected: { backgroundColor: colors.redLight, borderColor: '#fecaca' },
  statusText: { fontSize: 9.5, fontWeight: '800', color: colors.slate700 },
  empty: { fontSize: 12.5, color: colors.slate400, fontWeight: '700', alignSelf: 'center', paddingVertical: 16 },
  loggedOut: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loggedOutIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  loggedOutTitle: { fontSize: 17, fontWeight: '900', color: colors.slate900, marginBottom: 6 },
  loggedOutText: { fontSize: 13, color: colors.slate500, fontWeight: '600', textAlign: 'center', marginBottom: 22 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 40, alignItems: 'center', marginBottom: 10, alignSelf: 'stretch' },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  secondaryBtn: { paddingVertical: 8 },
  secondaryBtnText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
});

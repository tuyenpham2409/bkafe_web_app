import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert,
  RefreshControl, Linking, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api, resolveMediaUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
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

export default function ContactScreen() {
  const { user } = useAuth();
  
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  
  const [contacts, setContacts] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unhandledCount, setUnhandledCount] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);

  const isAdmin = user?.role === 'admin';

  
  useEffect(() => {
    if (user && !isAdmin) { setName(user.displayName || ''); setEmail(user.email || ''); }
  }, [user, isAdmin]);

  
  const loadInbox = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await api.get('/contacts');
      setContacts(data);
      setUnhandledCount(data.filter((c) => !c.handled).length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInbox(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) {
        loadInbox();
      }
    }, [isAdmin, loadInbox])
  );

  
  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(loadInbox, 4000);
    return () => clearInterval(interval);
  }, [isAdmin, loadInbox]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInbox();
  };

  const toggleHandled = async (id) => {
    try {
      const r = await api.patch(`/contacts/${id}/handled`);
      setContacts((cs) => cs.map((c) => c.id === id ? { ...c, handled: r.handled } : c));
      setUnhandledCount((n) => r.handled ? n - 1 : n + 1);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const deleteInboxItem = async (id) => {
    Alert.alert('Xoá góp ý', 'Bạn có chắc chắn muốn xoá góp ý này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/contacts/${id}`);
            setContacts((cs) => cs.filter((c) => c.id !== id));
            setUnhandledCount((n) => {
              const item = contacts.find((c) => c.id === id);
              return item && !item.handled ? n - 1 : n;
            });
          } catch (e) {
            Alert.alert('Lỗi', e.message);
          }
        },
      },
    ]);
  };

  const pickMedia = async () => {
    if (files.length >= 5) return Alert.alert('Tối đa 5 tệp đính kèm.');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Cần quyền truy cập thư viện ảnh để đính kèm tệp.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      selectionLimit: 5 - files.length,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const invalid = [];
      const valid = result.assets.filter((f) => {
        const isVideo = f.type === 'video';
        if (isVideo && f.fileSize > MAX_VIDEO) { invalid.push(`"${f.fileName || 'Video'}" vượt quá 20MB`); return false; }
        if (!isVideo && f.fileSize > MAX_IMAGE) { invalid.push(`"${f.fileName || 'Ảnh'}" vượt quá 5MB`); return false; }
        return true;
      });
      if (invalid.length) Alert.alert('File quá lớn', invalid.join('\n'));
      setFiles((prev) => [...prev, ...valid].slice(0, 5));
    }
  };

  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('email', email.trim());
      form.append('message', message.trim());
      files.forEach((asset) => form.append('media', guessFile(asset)));
      
      await api.postForm('/contacts', form);
      setSubmitted(true);
      setMessage('');
      setFiles([]);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) { Alert.alert('Lỗi', e.message); } finally { setLoading(false); }
  };

  if (isAdmin) {
        if (loadingInbox) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <Text style={styles.h1}><Ionicons name="inbox-outline" size={22} color={colors.primary} /> Hộp thư góp ý</Text>
          <Text style={styles.p}>
            Các ý kiến đóng góp từ sinh viên ({contacts.length}) —
            {unhandledCount > 0 ? (
              <Text style={{ color: colors.amber, fontWeight: '700' }}> {unhandledCount} chưa xử lý</Text>
            ) : (
              <Text style={{ color: colors.green, fontWeight: '700' }}> Tất cả đã xử lý</Text>
            )}
          </Text>
        </View>

        {contacts.map((c) => (
          <View key={c.id} style={[styles.card, c.handled && styles.handledCard]}>
            <View style={styles.inboxHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inboxName}>{c.name}</Text>
                <Text style={styles.inboxEmail}>{c.email}</Text>
              </View>
              {c.handled && (
                <View style={styles.statusBadgeInbox}>
                  <Text style={styles.statusBadgeText}>Đã xử lý</Text>
                </View>
              )}
            </View>

            <Text style={styles.inboxMessage}>{c.message}</Text>

            {}
            {c.media?.length > 0 && (
              <View style={styles.inboxMediaRow}>
                {c.media.map((m, idx) => m.type === 'video' ? (
                  <TouchableOpacity key={idx} style={styles.videoBoxInbox} onPress={() => Linking.openURL(resolveMediaUrl(m.url))}>
                    <Ionicons name="play-circle" size={24} color={colors.white} />
                    <Text style={styles.videoBoxLabel}>Mở video</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity key={idx} onPress={() => setPreviewImage(resolveMediaUrl(m.url))}>
                    <Image source={{ uri: resolveMediaUrl(m.url) }} style={styles.imageBoxInbox} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.inboxActions}>
              <TouchableOpacity
                style={[styles.inboxActionBtn, c.handled ? styles.unhandleBtn : styles.handleBtn]}
                onPress={() => toggleHandled(c.id)}
              >
                <Ionicons name={c.handled ? "refresh-circle-outline" : "checkmark-circle-outline"} size={16} color={c.handled ? colors.slate600 : colors.white} />
                <Text style={[styles.inboxActionBtnText, c.handled ? { color: colors.slate600 } : { color: colors.white }]}>
                  {c.handled ? 'Đánh dấu chưa xử lý' : 'Đánh dấu đã xử lý'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inboxDeleteBtn} onPress={() => deleteInboxItem(c.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.red} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {contacts.length === 0 && (
          <Text style={styles.emptyInboxText}>Không có ý kiến đóng góp nào trong hộp thư.</Text>
        )}
      </ScrollView>
    );
  }

    return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 40 }}>
        <View style={styles.card}>
          <Text style={styles.h1}>Về BKafe</Text>
          <Text style={styles.p}>
            Chào mừng bạn đến với <Text style={styles.bold}>BKafe</Text> — Nền tảng hỏi đáp trực tuyến dành riêng cho sinh viên Đại học Bách khoa Hà Nội (HUST).
          </Text>
          <Text style={styles.p}>
            Dự án được xây dựng bởi <Text style={styles.bold}>Nhóm 4</Text> (Phạm Minh Tuyên - 20233885 và Lê Hà Hải Vân).
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}><Ionicons name="mail-outline" size={17} color={colors.primary} /> Liên hệ & Góp ý</Text>

          {submitted ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Cảm ơn bạn đã gửi ý kiến! Chúng tôi sẽ phản hồi sớm nhất có thể.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Họ tên<Required /></Text>
              <TextInput value={name} onChangeText={setName} placeholder="Tên của bạn" placeholderTextColor={colors.slate400} style={styles.input} />

              <Text style={styles.label}>Email<Required /></Text>
              <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Email liên hệ" placeholderTextColor={colors.slate400} style={styles.input} />

              <Text style={styles.label}>Nội dung ý kiến<Required /></Text>
              <TextInput
                value={message} onChangeText={setMessage} placeholder="Nhập nội dung bạn muốn gửi..."
                placeholderTextColor={colors.slate400} style={[styles.input, styles.textarea]} multiline
              />

              <Text style={styles.label}>Ảnh / Video đính kèm (tối đa 5, ảnh ≤5MB, video ≤20MB)</Text>
              <View style={styles.mediaRow}>
                {files.map((f, i) => (
                  <View key={i} style={styles.mediaThumb}>
                    {f.type === 'video' ? (
                      <View style={styles.videoThumb}><Ionicons name="videocam" size={22} color={colors.slate400} /></View>
                    ) : (
                      <Image source={{ uri: f.uri }} style={styles.mediaThumbImg} />
                    )}
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeFile(i)}>
                      <Ionicons name="close" size={12} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                {files.length < 5 && (
                  <TouchableOpacity style={styles.addMediaBtn} onPress={pickMedia}>
                    <Ionicons name="image-outline" size={22} color={colors.slate400} />
                    <Text style={styles.addMediaText}>Thêm</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Gửi liên hệ</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

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
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.slate200, padding: 18, marginBottom: 16 },
  h1: { fontSize: 20, fontWeight: '900', color: colors.slate900, marginBottom: 12 },
  h2: { fontSize: 17, fontWeight: '900', color: colors.slate900, marginBottom: 14 },
  p: { fontSize: 13.5, color: colors.slate700, lineHeight: 20, marginBottom: 10 },
  bold: { fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '800', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.slate300, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, color: colors.slate900 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  mediaThumb: { width: 64, height: 64, borderRadius: 12, position: 'relative' },
  mediaThumbImg: { width: '100%', height: '100%', borderRadius: 12, borderWidth: 1, borderColor: colors.slate200 },
  videoThumb: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#00000099', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  addMediaBtn: { width: 64, height: 64, borderRadius: 12, borderWidth: 1.5, borderColor: colors.slate300, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addMediaText: { fontSize: 9, fontWeight: '700', color: colors.slate400, marginTop: 2 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 18 },
  submitBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  successBox: { backgroundColor: colors.greenLight, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 14 },
  successText: { color: colors.green, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  
  
  handledCard: { opacity: 0.65, borderColor: colors.slate200 },
  inboxHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  inboxName: { fontSize: 14.5, fontWeight: '800', color: colors.slate900 },
  inboxEmail: { fontSize: 11, fontWeight: '600', color: colors.slate400, marginTop: 1 },
  statusBadgeInbox: { backgroundColor: colors.greenLight, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 9, fontWeight: '800', color: colors.green },
  inboxMessage: { fontSize: 13.5, color: colors.slate700, lineHeight: 20, marginBottom: 12 },
  
  inboxMediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  imageBoxInbox: { width: 76, height: 76, borderRadius: 10, borderWidth: 1, borderColor: colors.slate200 },
  videoBoxInbox: { width: 76, height: 76, borderRadius: 10, backgroundColor: colors.slate700, alignItems: 'center', justifyContent: 'center' },
  videoBoxLabel: { fontSize: 8, fontWeight: '800', color: colors.white, marginTop: 2 },
  
  inboxActions: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.slate100, paddingTop: 12 },
  inboxActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, paddingVertical: 8 },
  handleBtn: { backgroundColor: colors.primary },
  unhandleBtn: { backgroundColor: colors.slate100, borderWidth: 1, borderColor: colors.slate200 },
  inboxActionBtnText: { fontSize: 12, fontWeight: '800' },
  inboxDeleteBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' },
  emptyInboxText: { fontSize: 13, fontWeight: '700', color: colors.slate400, textAlign: 'center', paddingVertical: 40 },
});

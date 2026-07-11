import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api/client';
import Required from '../components/Required';
import { colors } from '../theme/colors';

function guessFile(asset) {
  const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
  const isVideo = asset.type === 'video' || /mp4|mov|m4v/.test(ext);
  return {
    uri: asset.uri,
    name: `upload-${Date.now()}.${ext}`,
    type: asset.mimeType || (isVideo ? `video/${ext === 'mov' ? 'quicktime' : ext}` : `image/${ext === 'jpg' ? 'jpeg' : ext}`),
  };
}

export default function CreatePostScreen({ navigation }) {
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/topics').then((t) => { setTopics(t); if (t[0]) setTopic(t[0].slug); }).catch(() => {});
  }, []);

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
      setFiles((prev) => [...prev, ...result.assets].slice(0, 5));
    }
  };
  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setError('');
    if (!content.trim() || !topic) {
      setError('Vui lòng nhập nội dung và chọn chủ đề.');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('content', content.trim());
      form.append('topic', topic);
      files.forEach((asset) => form.append('media', guessFile(asset)));
      const post = await api.postForm('/posts', form);
      if (post.status === 'approved') {
        Alert.alert('Thành công', 'Đăng bài viết thành công!', [
          { text: 'OK', onPress: () => navigation.replace('PostDetail', { id: post.id }) },
        ]);
      } else {
        Alert.alert('Đã gửi', 'Bài viết của bạn đã được gửi và đang chờ ban quản trị phê duyệt.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo bài viết.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

      <Text style={styles.label}>Chủ đề<Required /></Text>
      <View style={styles.topicRow}>
        {topics.map((t) => (
          <TouchableOpacity key={t.slug} style={[styles.topicChip, topic === t.slug && styles.topicChipActive]} onPress={() => setTopic(t.slug)}>
            <Text style={[styles.topicChipText, topic === t.slug && styles.topicChipTextActive]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Tiêu đề (Không bắt buộc)</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề câu hỏi..." placeholderTextColor={colors.slate400} style={styles.input} />

      <Text style={styles.label}>Nội dung<Required /></Text>
      <TextInput
        value={content} onChangeText={setContent} placeholder="Bạn đang nghĩ gì? Hãy đặt câu hỏi hoặc chia sẻ..."
        placeholderTextColor={colors.slate400} style={[styles.input, styles.textarea]} multiline
      />

      <Text style={styles.label}>Ảnh / Video đính kèm (tối đa 5)</Text>
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
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Đăng bài</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  label: { fontSize: 11, fontWeight: '800', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: colors.slate300, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.slate900 },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.slate100 },
  topicChipActive: { backgroundColor: colors.primary },
  topicChipText: { fontSize: 12.5, fontWeight: '700', color: colors.slate600 },
  topicChipTextActive: { color: colors.white },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mediaThumb: { width: 76, height: 76, borderRadius: 12, position: 'relative' },
  mediaThumbImg: { width: '100%', height: '100%', borderRadius: 12, borderWidth: 1, borderColor: colors.slate200 },
  videoThumb: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#00000099', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  addMediaBtn: { width: 76, height: 76, borderRadius: 12, borderWidth: 1.5, borderColor: colors.slate300, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addMediaText: { fontSize: 10, fontWeight: '700', color: colors.slate400, marginTop: 2 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 28 },
  submitBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  errorBox: { backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: 8 },
  errorText: { color: colors.red, fontWeight: '700', fontSize: 13 },
});

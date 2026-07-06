import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Required from '../components/Required';
import { colors } from '../theme/colors';

export default function ContactScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Prefill from the logged-in account (still editable)
  useEffect(() => {
    if (user) { setName(user.displayName || ''); setEmail(user.email || ''); }
  }, [user]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setLoading(true);
    try {
      await api.post('/contacts', { name: name.trim(), email: email.trim(), message: message.trim() });
      setSubmitted(true);
      setMessage('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

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

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Gửi liên hệ</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.slate200, padding: 18, marginBottom: 16 },
  h1: { fontSize: 20, fontWeight: '900', color: colors.slate900, marginBottom: 12 },
  h2: { fontSize: 17, fontWeight: '900', color: colors.slate900, marginBottom: 14 },
  p: { fontSize: 13.5, color: colors.slate700, lineHeight: 20, marginBottom: 10 },
  bold: { fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '800', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.slate300, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, color: colors.slate900 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 18 },
  submitBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  successBox: { backgroundColor: colors.greenLight, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 14 },
  successText: { color: colors.green, fontWeight: '700', fontSize: 13, textAlign: 'center' },
});

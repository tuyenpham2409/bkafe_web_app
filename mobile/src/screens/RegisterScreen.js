import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import Required from '../components/Required';
import { colors } from '../theme/colors';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(''); setLoading(true);
    try {
      await register({ username: username.trim(), displayName: displayName.trim(), email: email.trim(), password });
      navigation.popToTop();
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Đăng ký tài khoản BKafe</Text>
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <Text style={styles.label}>Tên đăng nhập (username/MSSV)<Required /></Text>
        <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Ví dụ: 20233885" placeholderTextColor={colors.slate400} style={styles.input} />

        <Text style={styles.label}>Tên hiển thị<Required /></Text>
        <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Ví dụ: Phạm Minh Tuyên" placeholderTextColor={colors.slate400} style={styles.input} />

        <Text style={styles.label}>Email<Required /></Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="sv@sis.hust.edu.vn" placeholderTextColor={colors.slate400} style={styles.input} />

        <Text style={styles.label}>Mật khẩu<Required /></Text>
        <PasswordInput value={password} onChangeText={setPassword} autoComplete="new-password" />
        <Text style={styles.hint}>Tối thiểu 6 ký tự.</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Đăng ký</Text>}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.link}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: colors.white },
  title: { fontSize: 22, fontWeight: '900', color: colors.slate900, textAlign: 'center', marginBottom: 20, marginTop: 12 },
  label: { fontSize: 11, fontWeight: '800', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.slate900 },
  hint: { fontSize: 11, color: colors.slate400, fontWeight: '600', marginTop: 4 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  link: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 12 },
  footerText: { color: colors.slate600, fontSize: 13, fontWeight: '600' },
  errorBox: { backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: colors.red, fontWeight: '700', fontSize: 13 },
});

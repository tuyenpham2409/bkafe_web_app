import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import Required from '../components/Required';
import { colors } from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <Text style={styles.title}>Đăng nhập BKafe</Text>
        <Text style={styles.label}>Tên đăng nhập (MSSV) hoặc Email<Required /></Text>
        <TextInput
          value={identifier} onChangeText={setIdentifier} autoCapitalize="none"
          placeholder="20233885 hoặc sv@sis.hust.edu.vn" placeholderTextColor={colors.slate400}
          style={styles.input}
        />
        <Text style={styles.label}>Mật khẩu<Required /></Text>
        <PasswordInput value={password} onChangeText={setPassword} autoComplete="current-password" />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Đăng nhập</Text>}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: colors.white, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: colors.slate900, textAlign: 'center', marginBottom: 20 },
  subtitle: { fontSize: 12.5, color: colors.slate500, textAlign: 'center', fontWeight: '600', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.slate900 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  darkBtn: { backgroundColor: colors.slate700, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  link: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: colors.slate600, fontSize: 13, fontWeight: '600' },
  errorBox: { backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: colors.red, fontWeight: '700', fontSize: 13 },
  infoBox: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, padding: 12, marginBottom: 16 },
  infoText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
});

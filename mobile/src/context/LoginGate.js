import React, { createContext, useContext, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const Ctx = createContext({ requireLogin: () => { } });
export const useLoginGate = () => useContext(Ctx);

export function LoginGateProvider({ children, navigationRef }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const requireLogin = (msg) => {
    setMessage(msg || 'Bạn cần đăng nhập để sử dụng tính năng này.');
    setVisible(true);
  };

  const go = (screen) => {
    setVisible(false);
    navigationRef.current?.navigate(screen);
  };

  return (
    <Ctx.Provider value={{ requireLogin }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.card} onPress={() => { }}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
              <Ionicons name="close" size={20} color={colors.slate400} />
            </TouchableOpacity>
            <View style={styles.iconWrap}>
              <Ionicons name="log-in-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Yêu cầu đăng nhập</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => go('Login')}>
                <Text style={styles.primaryBtnText}>Đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => go('Register')}>
                <Text style={styles.secondaryBtnText}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '900', color: colors.slate900, textAlign: 'center', marginBottom: 6 },
  message: { fontSize: 13, color: colors.slate500, textAlign: 'center', fontWeight: '600', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  secondaryBtn: { flex: 1, backgroundColor: colors.slate100, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: colors.slate700, fontWeight: '800', fontSize: 13 },
});

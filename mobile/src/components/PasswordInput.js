import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Password field with a show/hide eye toggle (mirrors the web PasswordInput).
export default function PasswordInput({ value, onChangeText, placeholder = 'Mật khẩu', autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoComplete={autoComplete}
        style={styles.input}
        placeholderTextColor={colors.slate400}
      />
      <TouchableOpacity style={styles.eye} onPress={() => setShow((s) => !s)}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.slate400} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1, borderColor: colors.slate200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    paddingRight: 42, fontSize: 14, color: colors.slate900, backgroundColor: colors.white,
  },
  eye: { position: 'absolute', right: 12 },
});

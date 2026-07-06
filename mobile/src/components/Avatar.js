import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Avatar({ url, name, size = 40 }) {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (url) return <Image source={{ uri: url }} style={[styles.img, dim]} />;
  return (
    <View style={[styles.fallback, dim]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{(name || 'U').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { borderWidth: 1, borderColor: colors.slate200 },
  fallback: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dbeafe' },
  letter: { color: colors.primary, fontWeight: '900' },
});

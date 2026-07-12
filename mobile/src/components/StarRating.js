import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export function StarRatingDisplay({ rating = 0, count = 0, size = 15 }) {
  const rounded = Math.round(rating);
  return (
    <View style={styles.row}>
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Ionicons key={s} name={rounded >= s ? 'star' : 'star-outline'} size={size} color={rounded >= s ? colors.star : colors.slate300} />
        ))}
      </View>
      <Text style={styles.label}>{count > 0 ? `${rating.toFixed(1)}/5 (${count})` : 'Chưa có đánh giá'}</Text>
    </View>
  );
}

export function StarSelector({ visible, value, onSelect, onClose }) {
  if (!visible) return null;
  return (
    <View style={styles.selector}>
      <TouchableOpacity onPress={() => onSelect(0)} style={styles.zeroBtn}>
        <Text style={styles.zeroText}>0</Text>
      </TouchableOpacity>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onSelect(s)} style={{ padding: 2 }}>
          <Ionicons name={(value ?? 0) >= s ? 'star' : 'star-outline'} size={20} color={colors.star} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function RateButton({ myValue, onRate, size = 14 }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ position: 'relative', zIndex: 50 }}>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen((o) => !o)}>
        <Ionicons name={myValue !== null ? 'star' : 'star-outline'} size={size} color={myValue !== null ? colors.star : colors.slate500} />
        <Text style={[styles.triggerText, myValue !== null && { color: colors.star, fontWeight: '800' }]}>
          {myValue !== null ? `Đã đánh giá ${myValue}★` : 'Đánh giá'}
        </Text>
      </TouchableOpacity>
      <StarSelector
        visible={open}
        value={myValue}
        onSelect={(v) => { onRate(v); setOpen(false); }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.slate500 },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  triggerText: { fontSize: 12, fontWeight: '700', color: colors.slate500 },
  selector: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    width: 170,
    zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.white,
    borderRadius: 20, borderWidth: 1, borderColor: colors.slate200, paddingHorizontal: 8, paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  zeroBtn: { paddingHorizontal: 5, borderRightWidth: 1, borderRightColor: colors.slate200, marginRight: 3 },
  zeroText: { fontSize: 10, fontWeight: '900', color: colors.slate400 },
});

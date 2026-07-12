import React from 'react';
import { Text } from 'react-native';
import { colors } from '../theme/colors';

export default function Required() {
  return <Text style={{ color: colors.red }}> *</Text>;
}

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { spacing } from '../theme/spacing';
import { type as typeStyles } from '../theme/typography';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap} accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
});

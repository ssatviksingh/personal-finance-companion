import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { radius, spacing } from '../theme/spacing';
import { type as typeStyles } from '../theme/typography';
import { PrimaryButton } from './PrimaryButton';

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon = 'wallet-outline',
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={[typeStyles.title2, styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[typeStyles.body, styles.msg, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel && onAction ? (
        <View style={styles.cta}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { textAlign: 'center' },
  msg: { textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  cta: { marginTop: spacing.md, alignSelf: 'stretch', maxWidth: 320, width: '100%' },
});

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { radius, spacing } from '../theme/spacing';
import { type as typeStyles } from '../theme/typography';
import { PrimaryButton } from './PrimaryButton';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.expenseMuted }]}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.expense} />
      </View>
      <Text style={[typeStyles.title3, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[typeStyles.caption, styles.msg, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry ? (
        <View style={styles.btn}>
          <PrimaryButton label="Try again" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xxl,
    gap: spacing.md,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  msg: { textAlign: 'center', maxWidth: 300 },
  btn: { marginTop: spacing.md, alignSelf: 'stretch', maxWidth: 280 },
});

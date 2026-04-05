import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { radius, spacing } from '../theme/spacing';
import { getShadow } from '../theme/shadows';
import { type as typeStyles } from '../theme/typography';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'default',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'default' | 'compact';
  style?: ViewStyle;
}) {
  const { colors } = useAppTheme();
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';

  const bg = isPrimary
    ? colors.primary
    : isDanger
      ? colors.expense
      : 'transparent';
  const fg = isSecondary ? colors.primary : '#FFFFFF';
  const borderColor = isSecondary ? colors.primary : 'transparent';

  const compact = size === 'compact';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        {
          backgroundColor: isSecondary ? colors.surfaceElevated : bg,
          borderWidth: isSecondary ? 1.5 : 0,
          borderColor,
          opacity: pressed ? 0.92 : disabled ? 0.48 : 1,
        },
        isPrimary && !disabled && !loading ? getShadow(colors.shadow, 'sm') : {},
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text
          style={[
            typeStyles.bodyStrong,
            compact && styles.labelCompact,
            { color: fg, textAlign: 'center' },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  labelCompact: {
    fontSize: 14,
  },
});

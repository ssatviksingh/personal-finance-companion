import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { radius, spacing } from '../theme/spacing';
import { getShadow } from '../theme/shadows';
import { type as typeStyles } from '../theme/typography';

type ShadowLevel = 'none' | 'sm' | 'md';

export function AppCard({
  title,
  subtitle,
  children,
  style,
  shadow = 'sm',
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  shadow?: ShadowLevel;
  padded?: boolean;
}) {
  const { colors } = useAppTheme();
  const shadowStyle = shadow === 'none' ? {} : getShadow(colors.shadow, shadow);

  return (
    <View
      style={[
        styles.card,
        shadowStyle,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          padding: padded ? spacing.xl : 0,
        },
        style,
      ]}
    >
      {title ? (
        <Text style={[typeStyles.title3, { color: colors.text }]}>{title}</Text>
      ) : null}
      {subtitle ? (
        <Text style={[typeStyles.caption, styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  subtitle: {
    marginTop: -4,
    lineHeight: 18,
  },
});

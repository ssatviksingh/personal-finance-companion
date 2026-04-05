import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { type as typeStyles } from '../theme/typography';

export function SectionLabel({
  children,
  color,
}: {
  children: string;
  color?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Text style={[typeStyles.overline, styles.label, { color: color ?? colors.textMuted }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
});

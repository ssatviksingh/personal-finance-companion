import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import type { RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { spacing } from '../theme/spacing';

const H_PAD = spacing.xxl;

export function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
  edges = ['top', 'left', 'right'],
  refreshControl,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  const { colors } = useAppTheme();

  const inner = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, styles.column, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]} edges={edges}>
      <KeyboardAvoidingView
        style={[styles.fill, !scroll && styles.column]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: {
    paddingHorizontal: H_PAD,
    gap: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: spacing.xxxl + spacing.lg,
    gap: spacing.lg,
  },
});

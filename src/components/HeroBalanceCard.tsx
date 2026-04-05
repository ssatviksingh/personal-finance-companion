import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { radius, spacing } from '../theme/spacing';
import { getShadow } from '../theme/shadows';
import { type as typeStyles } from '../theme/typography';

interface Props {
  balanceLabel?: string;
  balanceDisplay: string;
  monthLabel: string;
  incomeDisplay: string;
  expenseDisplay: string;
}

export function HeroBalanceCard({
  balanceLabel = 'Total balance',
  balanceDisplay,
  monthLabel,
  incomeDisplay,
  expenseDisplay,
}: Props) {
  const { colors } = useAppTheme();

  return (
    <LinearGradient
      colors={[colors.heroGradientTop, colors.heroGradientBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, getShadow(colors.shadow, 'lg')]}
    >
      <Text style={[typeStyles.overline, { color: colors.onHeroMuted }]}>{balanceLabel}</Text>
      <Text style={[typeStyles.heroNumber, { color: colors.onHero }]}>{balanceDisplay}</Text>
      <Text style={[typeStyles.caption, { color: colors.onHeroMuted, marginTop: 4 }]}>
        {monthLabel}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[typeStyles.overline, { color: colors.onHeroMuted, marginBottom: 4 }]}>
            Income
          </Text>
          <Text style={[typeStyles.title3, { color: '#7DDFB4' }]}>{incomeDisplay}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[typeStyles.overline, { color: colors.onHeroMuted, marginBottom: 4 }]}>
            Expenses
          </Text>
          <Text style={[typeStyles.title3, { color: '#FCA5A5' }]}>{expenseDisplay}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: radius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.22)',
  },
  stat: { flex: 1 },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: spacing.md,
  },
});

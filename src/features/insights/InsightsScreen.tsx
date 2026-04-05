import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionLabel } from '../../components/SectionLabel';
import { useAppTheme } from '../../context/ThemeContext';
import { useDatabaseStatus } from '../../context/DatabaseContext';
import {
  getAverageExpenseTransactionThisMonth,
  getHighestExpenseCategoryThisMonth,
  getMonthlyExpenseTrend,
  getMostFrequentExpenseCategoryThisMonth,
  getTopExpenseCategoriesThisMonth,
  getWeekOverWeekExpenseDelta,
} from '../../repositories/insightsRepository';
import { radius, spacing } from '../../theme/spacing';
import { type as typeStyles } from '../../theme/typography';
import type { ColorScheme } from '../../theme/colors';
import { formatCurrency } from '../../utils/money';

export function InsightsScreen() {
  const { colors } = useAppTheme();
  const { ready } = useDatabaseStatus();
  const [loading, setLoading] = useState(true);
  const [highest, setHighest] = useState<Awaited<
    ReturnType<typeof getHighestExpenseCategoryThisMonth>
  > | null>(null);
  const [wow, setWow] = useState<Awaited<ReturnType<typeof getWeekOverWeekExpenseDelta>> | null>(
    null
  );
  const [trend, setTrend] = useState<Awaited<ReturnType<typeof getMonthlyExpenseTrend>>>([]);
  const [top3, setTop3] = useState<Awaited<ReturnType<typeof getTopExpenseCategoriesThisMonth>>>(
    []
  );
  const [freq, setFreq] = useState<Awaited<
    ReturnType<typeof getMostFrequentExpenseCategoryThisMonth>
  > | null>(null);
  const [avg, setAvg] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const skipBlockingFocus = useRef(false);
  const blockingEligible = useRef(true);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
    if (!ready) return;
    if (mode === 'initial' && blockingEligible.current) setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      const [h, w, tr, t3, f, a] = await Promise.all([
        getHighestExpenseCategoryThisMonth(),
        getWeekOverWeekExpenseDelta(),
        getMonthlyExpenseTrend(6),
        getTopExpenseCategoriesThisMonth(3),
        getMostFrequentExpenseCategoryThisMonth(),
        getAverageExpenseTransactionThisMonth(),
      ]);
      setHighest(h);
      setWow(w);
      setTrend(tr);
      setTop3(t3);
      setFreq(f);
      setAvg(a);
    } finally {
      setLoading(false);
      setRefreshing(false);
      blockingEligible.current = false;
      setHasLoadedOnce(true);
    }
  }, [ready]);

  useFocusEffect(
    useCallback(() => {
      load(skipBlockingFocus.current ? 'silent' : 'initial');
      skipBlockingFocus.current = true;
    }, [load])
  );

  if (!ready) {
    return (
      <ScreenContainer scroll={false} contentStyle={styles.loadingWrap}>
        <LoadingState message="Analyzing your spending…" />
      </ScreenContainer>
    );
  }

  if (loading && !hasLoadedOnce) {
    return (
      <ScreenContainer scroll={false} contentStyle={styles.loadingWrap}>
        <LoadingState message="Analyzing your spending…" />
      </ScreenContainer>
    );
  }

  const trendBars = trend.map((m) => ({
    value: Math.round(m.total_cents / 100),
    label: m.label,
  }));

  const wowText =
    wow == null || wow.percentChange === null
      ? 'Not enough data yet'
      : `${wow.percentChange >= 0 ? '+' : ''}${wow.percentChange.toFixed(1)}% vs last week`;

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => load('refresh')}
      tintColor={colors.primary}
      colors={[colors.primary]}
    />
  );

  return (
    <ScreenContainer refreshControl={refreshControl}>
      <View style={styles.intro}>
        <SectionLabel>Intelligence</SectionLabel>
        <Text style={[typeStyles.title1, { color: colors.text }]}>Insights</Text>
        <Text style={[typeStyles.caption, { color: colors.textSecondary, marginTop: 6 }]}>
          Pull down to refresh · Clear signals from this month and recent activity
        </Text>
      </View>

      <AppCard shadow="md">
        <CardHead icon="trending-up-outline" title="Top category" colors={colors} />
        {highest ? (
          <>
            <Text style={[typeStyles.title2, { color: colors.text }]}>{highest.category_name}</Text>
            <Text style={[typeStyles.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {formatCurrency(highest.total_cents)} this month
            </Text>
          </>
        ) : (
          <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>
            No expenses recorded this month.
          </Text>
        )}
      </AppCard>

      <AppCard shadow="md">
        <CardHead icon="calendar-outline" title="Week over week" colors={colors} />
        <Text style={[typeStyles.title2, { color: colors.text }]}>{wowText}</Text>
        <Text style={[typeStyles.caption, { color: colors.textSecondary, marginTop: 8 }]}>
          This week {formatCurrency(wow?.thisWeek ?? 0)} · Last week{' '}
          {formatCurrency(wow?.lastWeek ?? 0)}
        </Text>
      </AppCard>

      <AppCard title="Six-month trend" subtitle="Total expenses by month" shadow="md">
        {trendBars.every((b) => b.value === 0) ? (
          <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>
            Not enough history yet.
          </Text>
        ) : (
          <View style={[styles.chartPanel, { backgroundColor: colors.chartPanel }]}>
            <BarChart
              data={trendBars}
              barWidth={26}
              spacing={16}
              roundedTop
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
              noOfSections={4}
              frontColor={colors.accent}
            />
          </View>
        )}
      </AppCard>

      <AppCard title="Category leaderboard" subtitle="Top 3 by spend" shadow="md">
        {top3.length === 0 ? (
          <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>No data yet.</Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {top3.map((c, i) => (
              <View
                key={c.category_id}
                style={[
                  styles.leaderRow,
                  { backgroundColor: colors.surfaceMuted, borderRadius: radius.md },
                ]}
              >
                <View style={[styles.rank, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={[typeStyles.bodyStrong, { color: colors.primary }]}>{i + 1}</Text>
                </View>
                <Text style={[typeStyles.bodyStrong, { color: colors.text, flex: 1 }]}>
                  {c.category_name}
                </Text>
                <Text style={[typeStyles.bodyStrong, { color: colors.text }]}>
                  {formatCurrency(c.total_cents)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </AppCard>

      <AppCard shadow="md">
        <CardHead icon="repeat-outline" title="Frequency" colors={colors} />
        {freq ? (
          <Text style={[typeStyles.body, { color: colors.text, lineHeight: 22 }]}>
            Most often:{' '}
            <Text style={{ fontWeight: '800', color: colors.primary }}>{freq.category_name}</Text>{' '}
            · {freq.count} transactions
          </Text>
        ) : (
          <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>
            No expense transactions this month.
          </Text>
        )}
      </AppCard>

      <AppCard shadow="md">
        <CardHead icon="analytics-outline" title="Average ticket" colors={colors} />
        <Text style={[typeStyles.heroNumber, { color: colors.text, fontSize: 28 }]}>
          {avg != null ? formatCurrency(Math.round(avg)) : '—'}
        </Text>
        <Text style={[typeStyles.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          Mean expense amount this month
        </Text>
      </AppCard>
    </ScreenContainer>
  );
}

function CardHead({
  icon,
  title,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  colors: ColorScheme;
}) {
  return (
    <View style={styles.cardHead}>
      <View style={[styles.iconBadge, { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[typeStyles.title3, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center' },
  intro: { marginBottom: spacing.xs },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPanel: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

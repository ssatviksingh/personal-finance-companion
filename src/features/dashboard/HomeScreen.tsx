import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { HeroBalanceCard } from '../../components/HeroBalanceCard';
import { LoadingState } from '../../components/LoadingState';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionLabel } from '../../components/SectionLabel';
import { Skeleton } from '../../components/Skeleton';
import { useAppTheme } from '../../context/ThemeContext';
import { useDatabaseStatus } from '../../context/DatabaseContext';
import { getGoalForYearMonth } from '../../repositories/goalsRepository';
import {
  getSavingsIncomeForYearMonth,
  getTopExpenseCategoriesThisMonth,
} from '../../repositories/insightsRepository';
import {
  countTransactions,
  getBalanceAllTime,
  getDailyExpenseSeries,
  sumByTypeInRange,
} from '../../repositories/transactionsRepository';
import { radius, spacing } from '../../theme/spacing';
import { type as typeStyles } from '../../theme/typography';
import {
  currentYearMonth,
  endOfMonth,
  startOfMonth,
  toISODateString,
} from '../../utils/dates';
import { formatCurrency } from '../../utils/money';

export function HomeScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const { ready } = useDatabaseStatus();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [incomeMonth, setIncomeMonth] = useState(0);
  const [expenseMonth, setExpenseMonth] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [pieData, setPieData] = useState<{ value: number; color: string; text: string }[]>(
    []
  );
  const [barData, setBarData] = useState<{ value: number; label: string }[]>([]);
  const [goalTarget, setGoalTarget] = useState<number | null>(null);
  const [savingsProgress, setSavingsProgress] = useState(0);
  const [monthLabel, setMonthLabel] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const skipBlockingReload = useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      if (!ready) return;
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
      const now = new Date();
      const s = startOfMonth(now);
      const e = endOfMonth(now);
      setMonthLabel(
        now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      );

      const [bal, sums, n, cats, week, ym, goal] = await Promise.all([
        getBalanceAllTime(),
        sumByTypeInRange(toISODateString(s), toISODateString(e)),
        countTransactions(),
        getTopExpenseCategoriesThisMonth(8),
        getDailyExpenseSeries(7),
        Promise.resolve(currentYearMonth()),
        getGoalForYearMonth(currentYearMonth()),
      ]);

      setBalance(bal);
      setIncomeMonth(sums.income);
      setExpenseMonth(sums.expense);
      setTxCount(n);

      const pie = cats
        .filter((c) => c.total_cents > 0)
        .map((c, i) => ({
          value: c.total_cents / 100,
          color:
            c.color ??
            [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5][i % 5],
          text: c.category_name,
        }));
      setPieData(pie);

      setBarData(
        week.map((d) => ({
          value: Math.round(d.value / 100),
          label: d.label,
        }))
      );

      const saved = await getSavingsIncomeForYearMonth(ym);
      setSavingsProgress(saved);
      setGoalTarget(goal?.target_amount_cents ?? null);
    } finally {
      if (mode === 'initial') setLoading(false);
      setRefreshing(false);
    }
  },
    [ready, colors]
  );

  useFocusEffect(
    useCallback(() => {
      load(skipBlockingReload.current ? 'silent' : 'initial');
      skipBlockingReload.current = true;
    }, [load])
  );

  const goalPercent =
    goalTarget && goalTarget > 0
      ? Math.min(100, Math.round((savingsProgress / goalTarget) * 100))
      : 0;

  const openAdd = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as { getParent?: () => { navigate: (n: string) => void } })
      .getParent?.()
      ?.navigate('AddTransaction');
  };

  if (!ready) {
    return (
      <ScreenContainer>
        <LoadingState message="Preparing your data…" />
      </ScreenContainer>
    );
  }

  if (!loading && txCount === 0) {
    return (
      <ScreenContainer
        contentStyle={styles.emptyScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <EmptyState
          title="Welcome to Finance Companion"
          message="Track spending, set a savings goal, and see insights — securely on your device."
          actionLabel="Add your first transaction"
          onAction={openAdd}
          icon="sparkles-outline"
        />
      </ScreenContainer>
    );
  }

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
      <View style={styles.topBar}>
        <View>
          <SectionLabel>Portfolio</SectionLabel>
          <Text style={[typeStyles.title1, { color: colors.text }]}>Dashboard</Text>
        </View>
        <Pressable
          accessibilityLabel="Add transaction"
          hitSlop={12}
          onPress={openAdd}
          style={[styles.iconBtn, { backgroundColor: colors.primaryMuted }]}
        >
          <Ionicons name="add" size={26} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ gap: spacing.lg }}>
          <Skeleton style={{ height: 200, width: '100%', borderRadius: radius.xl }} />
          <Skeleton style={{ height: 140, width: '100%', borderRadius: radius.lg }} />
        </View>
      ) : (
        <>
          <HeroBalanceCard
            balanceDisplay={formatCurrency(balance, { showSign: balance !== 0 })}
            monthLabel={`Cash flow · ${monthLabel}`}
            incomeDisplay={formatCurrency(incomeMonth)}
            expenseDisplay={formatCurrency(expenseMonth)}
          />

          <AppCard title="Savings goal" subtitle="Income categorized as Savings this month">
            {goalTarget ? (
              <View>
                <View style={styles.goalHeader}>
                  <View style={[styles.ring, { borderColor: colors.primary }]}>
                    <Text style={[typeStyles.title3, { color: colors.primary }]}>{goalPercent}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typeStyles.bodyStrong, { color: colors.text }]}>
                      {formatCurrency(savingsProgress)} of {formatCurrency(goalTarget)}
                    </Text>
                    <Text style={[typeStyles.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                      Log savings as income with the Savings category.
                    </Text>
                  </View>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${goalPercent}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : (
              <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>
                Set a monthly target in the Savings goal tab.
              </Text>
            )}
          </AppCard>

          <AppCard title="Spending mix" subtitle="Expense categories · this month">
            {pieData.length === 0 ? (
              <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>
                No expenses this month yet.
              </Text>
            ) : (
              <View style={[styles.chartPanel, { backgroundColor: colors.chartPanel }]}>
                <PieChart
                  data={pieData}
                  donut
                  showText
                  textColor={colors.text}
                  textSize={11}
                  showTextBackground={false}
                  innerRadius={48}
                  radius={86}
                />
              </View>
            )}
          </AppCard>

          <AppCard title="Spending rhythm" subtitle="Last 7 days · daily expenses">
            {barData.every((d) => d.value === 0) ? (
              <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>
                No expenses in the last week.
              </Text>
            ) : (
              <View style={[styles.chartPanel, { backgroundColor: colors.chartPanel }]}>
                <BarChart
                  data={barData}
                  barWidth={20}
                  spacing={14}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                  noOfSections={4}
                  frontColor={colors.primary}
                />
              </View>
            )}
          </AppCard>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 520,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  chartPanel: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppCard } from '../../components/AppCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionLabel } from '../../components/SectionLabel';
import { useAppTheme } from '../../context/ThemeContext';
import { useDatabaseStatus } from '../../context/DatabaseContext';
import { useToast } from '../../context/ToastContext';
import {
  getGoalForYearMonth,
  listGoals,
  upsertMonthlyGoal,
} from '../../repositories/goalsRepository';
import { getSavingsIncomeForYearMonth } from '../../repositories/insightsRepository';
import { radius, spacing } from '../../theme/spacing';
import { type as typeStyles } from '../../theme/typography';
import { currentYearMonth, formatMonthYear } from '../../utils/dates';
import { formatCurrency, parseAmountInput } from '../../utils/money';

const schema = z.object({
  target: z.string().min(1, 'Enter a target amount'),
});

type Form = z.infer<typeof schema>;

export function GoalScreen() {
  const { colors, mode, setMode, resolved } = useAppTheme();
  const { ready } = useDatabaseStatus();
  const { toast } = useToast();
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listGoals>>>([]);
  const [saved, setSaved] = useState(0);
  const ym = currentYearMonth();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { target: '' },
  });

  const load = useCallback(async () => {
    if (!ready) return;
    const goal = await getGoalForYearMonth(ym);
    const s = await getSavingsIncomeForYearMonth(ym);
    const rows = await listGoals(12);
    setHistory(rows);
    setSaved(s);
    if (goal) {
      reset({ target: (goal.target_amount_cents / 100).toFixed(2) });
    }
  }, [ready, ym, reset]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onSave = handleSubmit(async (vals) => {
    const cents = parseAmountInput(vals.target);
    if (cents === null || cents === 0) {
      Alert.alert('Invalid amount', 'Enter a positive number.');
      return;
    }
    await upsertMonthlyGoal(ym, cents);
    await load();
    toast('Savings target saved');
  });

  const currentGoal = history.find((g) => g.year_month === ym);
  const progress =
    currentGoal && currentGoal.target_amount_cents > 0
      ? Math.min(100, Math.round((saved / currentGoal.target_amount_cents) * 100))
      : 0;

  if (!ready) {
    return (
      <ScreenContainer>
        <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>Loading…</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.intro}>
        <SectionLabel>Plan</SectionLabel>
        <Text style={[typeStyles.title1, { color: colors.text }]}>Savings goal</Text>
        <Text style={[typeStyles.caption, { color: colors.textSecondary, marginTop: 6 }]}>
          {formatMonthYear(ym)} · Progress from Savings-category income
        </Text>
      </View>

      <AppCard title="Monthly target" subtitle="USD · whole dollars or cents" shadow="md">
        <SectionLabel>Amount</SectionLabel>
        <Controller
          control={control}
          name="target"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholder="500.00"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                typeStyles.body,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
            />
          )}
        />
        {errors.target ? (
          <Text style={[typeStyles.caption, { color: colors.expense }]}>{errors.target.message}</Text>
        ) : null}

        {currentGoal ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressLabels}>
              <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>Progress</Text>
              <Text style={[typeStyles.bodyStrong, { color: colors.text }]}>
                {formatCurrency(saved)} · {progress}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: colors.income },
                ]}
              />
            </View>
          </View>
        ) : null}

        <PrimaryButton label="Save target" onPress={onSave} />
      </AppCard>

      <AppCard title="Appearance" subtitle="Match system or lock light/dark" shadow="sm">
        <View style={styles.segment}>
          {(
            [
              ['system', 'System'],
              ['light', 'Light'],
              ['dark', 'Dark'],
            ] as const
          ).map(([key, label]) => {
            const selected = mode === key;
            return (
              <Pressable
                key={key}
                onPress={() => setMode(key)}
                style={[
                  styles.segmentItem,
                  {
                    backgroundColor: selected ? colors.primaryMuted : colors.surfaceMuted,
                    borderColor: selected ? colors.primary : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    typeStyles.caption,
                    { fontWeight: selected ? '800' : '500', color: selected ? colors.primary : colors.text },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[typeStyles.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
          Using {resolved} theme
        </Text>
      </AppCard>

      <AppCard title="Target history" shadow="sm">
        <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
          {history.length === 0 ? (
            <Text style={[typeStyles.caption, { color: colors.textSecondary }]}>
              No saved targets yet.
            </Text>
          ) : (
            history.map((g) => (
              <View key={g.id} style={[styles.histRow, { borderBottomColor: colors.borderSubtle }]}>
                <View style={styles.histLeft}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Text style={[typeStyles.bodyStrong, { color: colors.text }]}>
                    {formatMonthYear(g.year_month)}
                  </Text>
                </View>
                <Text style={[typeStyles.bodyStrong, { color: colors.text }]}>
                  {formatCurrency(g.target_amount_cents)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    marginBottom: spacing.md,
  },
  progressBlock: { marginBottom: spacing.lg, gap: spacing.sm },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTrack: {
    height: 10,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  segment: { flexDirection: 'row', gap: spacing.sm },
  segmentItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  histRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  histLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

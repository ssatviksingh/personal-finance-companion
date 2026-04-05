import * as Haptics from 'expo-haptics';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionLabel } from '../../components/SectionLabel';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../context/ThemeContext';
import type { RootStackParamList } from '../../navigation/types';
import { getCategoriesByType } from '../../repositories/categoriesRepository';
import {
  getTransactionById,
  upsertTransaction,
} from '../../repositories/transactionsRepository';
import { radius, spacing } from '../../theme/spacing';
import { type as typeStyles } from '../../theme/typography';
import type { CategoryRow, TxType } from '../../db/types';
import { toISODateString } from '../../utils/dates';
import { parseAmountInput } from '../../utils/money';

const schema = z.object({
  amount: z.string().min(1, 'Enter an amount'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Pick a category'),
  occurred_at: z.string().min(1),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction' | 'EditTransaction'>;

export function TransactionFormScreen(_props: Props) {
  const { colors } = useAppTheme();
  const { toast } = useToast();
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const editId = route.name === 'EditTransaction' ? route.params?.id : undefined;

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(!!editId);

  const defaultValues: FormValues = useMemo(
    () => ({
      amount: '',
      type: 'expense',
      category_id: '',
      occurred_at: toISODateString(new Date()),
      note: '',
    }),
    []
  );

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const type = watch('type');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cats = await getCategoriesByType(type as TxType);
      if (!cancelled) {
        setCategories(cats);
        if (!editId) {
          setValue('category_id', cats[0]?.id ?? '');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, editId, setValue]);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      const row = await getTransactionById(editId);
      if (cancelled || !row) {
        setLoading(false);
        return;
      }
      reset({
        amount: (row.amount_cents / 100).toFixed(2),
        type: row.type,
        category_id: row.category_id,
        occurred_at: row.occurred_at,
        note: row.note ?? '',
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const cents = parseAmountInput(values.amount);
    if (cents === null || cents === 0) {
      Alert.alert('Invalid amount', 'Enter a valid positive number.');
      return;
    }
    try {
      await upsertTransaction({
        id: editId,
        amount_cents: cents,
        type: values.type as TxType,
        category_id: values.category_id,
        occurred_at: values.occurred_at,
        note: values.note?.trim() ? values.note.trim() : null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast(editId ? 'Transaction updated' : 'Transaction added');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  });

  if (loading) {
    return (
      <ScreenContainer scroll={false} contentStyle={styles.loadingWrap}>
        <LoadingState message="Loading transaction…" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <AppCard title="Transaction" subtitle="Amounts in USD" shadow="md">
        <SectionLabel>Direction</SectionLabel>
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => (
            <View style={styles.row}>
              {(['expense', 'income'] as const).map((t) => (
                <View key={t} style={styles.flex}>
                  <PrimaryButton
                    label={t === 'expense' ? 'Expense' : 'Income'}
                    variant={value === t ? 'primary' : 'secondary'}
                    size="compact"
                    onPress={() => onChange(t)}
                  />
                </View>
              ))}
            </View>
          )}
        />

        <SectionLabel>Amount</SectionLabel>
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
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
        {errors.amount ? (
          <Text style={[typeStyles.caption, { color: colors.expense }]}>
            {errors.amount.message}
          </Text>
        ) : null}

        <SectionLabel>Category</SectionLabel>
        <Controller
          control={control}
          name="category_id"
          render={({ field: { value, onChange } }) => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chips}>
                {categories.map((c) => {
                  const selected = value === c.id;
                  return (
                    <PrimaryButton
                      key={c.id}
                      label={c.name}
                      variant={selected ? 'primary' : 'secondary'}
                      size="compact"
                      onPress={() => onChange(c.id)}
                      style={styles.chipBtn}
                    />
                  );
                })}
              </View>
            </ScrollView>
          )}
        />
        {errors.category_id ? (
          <Text style={[typeStyles.caption, { color: colors.expense }]}>
            {errors.category_id.message}
          </Text>
        ) : null}

        <SectionLabel>Date</SectionLabel>
        <Text style={[typeStyles.caption, { color: colors.textMuted, marginTop: -4, marginBottom: 6 }]}>
          Format YYYY-MM-DD
        </Text>
        <Controller
          control={control}
          name="occurred_at"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              placeholder="2026-04-04"
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

        <SectionLabel>Note</SectionLabel>
        <Text style={[typeStyles.caption, { color: colors.textMuted, marginTop: -4, marginBottom: 6 }]}>
          Optional description
        </Text>
        <Controller
          control={control}
          name="note"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              multiline
              placeholder="e.g. Weekly groceries, paycheck…"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                styles.inputMulti,
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
      </AppCard>

      <PrimaryButton label={editId ? 'Save changes' : 'Add transaction'} onPress={onSubmit} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 4 },
  chipBtn: { minWidth: 100 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
});

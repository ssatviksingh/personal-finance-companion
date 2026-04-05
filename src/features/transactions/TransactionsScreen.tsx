import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ColorScheme } from '../../theme/colors';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionLabel } from '../../components/SectionLabel';
import { useAppTheme } from '../../context/ThemeContext';
import { useDatabaseStatus } from '../../context/DatabaseContext';
import { getAllCategories } from '../../repositories/categoriesRepository';
import {
  deleteTransaction,
  listTransactions,
} from '../../repositories/transactionsRepository';
import { useTxFiltersStore } from '../../stores/uiStore';
import { radius, spacing } from '../../theme/spacing';
import { getShadow } from '../../theme/shadows';
import { type as typeStyles } from '../../theme/typography';
import type {
  CategoryRow,
  TransactionFilters,
  TransactionWithCategory,
} from '../../db/types';
import { groupTransactionsByDate } from '../../utils/groupByDate';
import { formatCurrency } from '../../utils/money';

function TransactionsFilterHeader({
  colors,
  categories,
  filters,
  searchDraft,
  setSearchDraft,
  setType,
  setDatePreset,
  setCategoryId,
}: {
  colors: ColorScheme;
  categories: CategoryRow[];
  filters: TransactionFilters;
  searchDraft: string;
  setSearchDraft: (s: string) => void;
  setType: (t: 'all' | 'income' | 'expense') => void;
  setDatePreset: (p: TransactionFilters['datePreset']) => void;
  setCategoryId: (id: string | null) => void;
}) {
  return (
    <View style={headerStyles.headerBlock}>
      <View style={headerStyles.intro}>
        <SectionLabel>Activity</SectionLabel>
        <Text style={[typeStyles.caption, { color: colors.textSecondary, lineHeight: 20 }]}>
          Pull down to refresh. Tap a row to edit, long-press to delete.
        </Text>
      </View>

      <AppCard title="Find & filter" shadow="md">
        <View
          style={[
            headerStyles.searchWrap,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} style={headerStyles.searchIcon} />
          <TextInput
            value={searchDraft}
            onChangeText={setSearchDraft}
            placeholder="Search notes or merchants"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            {...(Platform.OS === 'ios' ? { clearButtonMode: 'while-editing' as const } : {})}
            style={[typeStyles.body, headerStyles.searchInput, { color: colors.text }]}
          />
        </View>

        <SectionLabel>Type</SectionLabel>
        <View style={headerStyles.chips}>
          {(['all', 'income', 'expense'] as const).map((t) => (
            <FilterChip
              key={t}
              label={t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expense'}
              selected={filters.type === t}
              onPress={() => setType(t)}
            />
          ))}
        </View>

        <SectionLabel>Period</SectionLabel>
        <View style={headerStyles.chips}>
          {(
            [
              ['all', 'All time'],
              ['week', 'This week'],
              ['month', 'This month'],
            ] as const
          ).map(([key, label]) => (
            <FilterChip
              key={key}
              label={label}
              selected={filters.datePreset === key}
              onPress={() => setDatePreset(key)}
            />
          ))}
        </View>

        <SectionLabel>Category</SectionLabel>
        <View style={headerStyles.chips}>
          <FilterChip
            label="Any"
            selected={filters.categoryId === null}
            onPress={() => setCategoryId(null)}
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.name}
              selected={filters.categoryId === c.id}
              onPress={() => setCategoryId(c.id)}
            />
          ))}
        </View>
      </AppCard>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  headerBlock: { gap: spacing.lg, marginBottom: spacing.sm },
  intro: { marginTop: spacing.xs },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

export function TransactionsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { ready } = useDatabaseStatus();
  const filters = useTxFiltersStore((s) => s.filters);
  const setSearch = useTxFiltersStore((s) => s.setSearch);
  const setType = useTxFiltersStore((s) => s.setType);
  const setCategoryId = useTxFiltersStore((s) => s.setCategoryId);
  const setDatePreset = useTxFiltersStore((s) => s.setDatePreset);
  const storeSearch = useTxFiltersStore((s) => s.filters.search);

  const [searchDraft, setSearchDraft] = useState(storeSearch);

  useEffect(() => {
    setSearchDraft(storeSearch);
  }, [storeSearch]);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchDraft), 320);
    return () => clearTimeout(id);
  }, [searchDraft, setSearch]);

  const [sections, setSections] = useState(
    [] as ReturnType<typeof groupTransactionsByDate>
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!ready) return;
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
        const rows = await listTransactions(filters);
        setSections(groupTransactionsByDate(rows));
        const cats = await getAllCategories();
        setCategories(cats);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ready, filters]
  );

  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Export CSV"
            hitSlop={8}
            style={[styles.headerIcon, { backgroundColor: colors.surfaceMuted }]}
            onPress={async () => {
              try {
                const rows = await listTransactions({
                  ...filters,
                  datePreset: 'all',
                  search: '',
                  type: 'all',
                  categoryId: null,
                  customStart: null,
                  customEnd: null,
                });
                const header = 'date,type,category,amount,note';
                const lines = rows.map((r) =>
                  [
                    r.occurred_at,
                    r.type,
                    `"${r.category_name.replace(/"/g, '""')}"`,
                    (r.amount_cents / 100).toFixed(2),
                    `"${(r.note ?? '').replace(/"/g, '""')}"`,
                  ].join(',')
                );
                const csv = [header, ...lines].join('\n');
                const path = `${FileSystem.cacheDirectory ?? ''}transactions.csv`;
                await FileSystem.writeAsStringAsync(path, csv, {
                  encoding: FileSystem.EncodingType.UTF8,
                });
                await Sharing.shareAsync(path, {
                  mimeType: 'text/csv',
                  dialogTitle: 'Export transactions',
                });
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (e) {
                Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
              }
            }}
          >
            <Ionicons name="download-outline" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityLabel="Add transaction"
            hitSlop={8}
            style={[styles.headerIcon, { backgroundColor: colors.primaryMuted }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              (navigation as { getParent?: () => { navigate: (n: string) => void } })
                .getParent?.()
                ?.navigate('AddTransaction');
            }}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, colors.primary, colors.primaryMuted, colors.surfaceMuted, filters]);

  const onDelete = (item: TransactionWithCategory) => {
    Alert.alert(
      'Delete transaction',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(item.id);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            load('refresh');
          },
        },
      ]
    );
  };

  const openEdit = (item: TransactionWithCategory) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as { getParent?: () => { navigate: (n: string, p: object) => void } })
      .getParent?.()
      ?.navigate('EditTransaction', { id: item.id });
  };

  const listSections = useMemo(
    () => sections.map((s) => ({ title: s.title, data: s.data })),
    [sections]
  );

  const bottomPad = insets.bottom + spacing.xxxl;

  const listHeader = (
    <TransactionsFilterHeader
      colors={colors}
      categories={categories}
      filters={filters}
      searchDraft={searchDraft}
      setSearchDraft={setSearchDraft}
      setType={setType}
      setDatePreset={setDatePreset}
      setCategoryId={setCategoryId}
    />
  );

  if (!ready) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <View style={[styles.screenRoot, { backgroundColor: colors.background }]}>
      <SectionList
        style={styles.sectionList}
        sections={listSections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyLoading}>
              <LoadingState message="Loading transactions…" />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <EmptyState
                title="No transactions match"
                message="Try adjusting filters or add a new entry to get started."
                actionLabel="Add transaction"
                onAction={() =>
                  (navigation as { getParent?: () => { navigate: (n: string) => void } })
                    .getParent?.()
                    ?.navigate('AddTransaction')
                }
                icon="receipt-outline"
              />
            </View>
          )
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[typeStyles.overline, { color: colors.textMuted }]}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const accent = item.type === 'income' ? colors.income : colors.expense;
          return (
                <Pressable
                  onPress={() => openEdit(item)}
                  onLongPress={() => onDelete(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.category_name}, ${item.type === 'income' ? 'income' : 'expense'}, ${formatCurrency(item.amount_cents)}`}
                  accessibilityHint="Opens editor. Long press to delete this transaction."
                  style={({ pressed }) => [
                styles.row,
                getShadow(colors.shadow, 'sm'),
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View style={[styles.accentStripe, { backgroundColor: accent }]} />
              <View style={styles.rowBody}>
                <View style={styles.rowLeft}>
                  <Text style={[typeStyles.bodyStrong, { color: colors.text }]} numberOfLines={1}>
                    {item.category_name}
                  </Text>
                  {item.note ? (
                    <Text
                      style={[typeStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}
                      numberOfLines={1}
                    >
                      {item.note}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    typeStyles.title3,
                    { color: accent, fontVariant: ['tabular-nums'] },
                  ]}
                >
                  {item.type === 'income' ? '+' : '−'}
                  {formatCurrency(item.amount_cents)}
                </Text>
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: spacing.xxl,
            paddingBottom: bottomPad,
          },
          listSections.length === 0 && styles.listContentEmpty,
        ]}
        SectionSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primaryMuted : colors.surfaceElevated,
        },
      ]}
    >
      <Text
        style={[
          typeStyles.caption,
          {
            color: selected ? colors.primary : colors.text,
            fontWeight: selected ? '700' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  sectionList: { flex: 1 },
  listContent: {
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  sectionHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  emptyLoading: { minHeight: 220, justifyContent: 'center' },
  emptyWrap: { flexGrow: 1, justifyContent: 'center', minHeight: 280 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 4 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: '100%',
  },
  row: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 4,
    overflow: 'hidden',
  },
  accentStripe: { width: 4 },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowLeft: { flex: 1, marginRight: spacing.md },
});

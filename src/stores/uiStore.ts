import { create } from 'zustand';
import type { DatePreset, TransactionFilters } from '../db/types';

const defaultFilters: TransactionFilters = {
  search: '',
  type: 'all',
  categoryId: null,
  datePreset: 'month',
  customStart: null,
  customEnd: null,
};

interface UiState {
  filters: TransactionFilters;
  setSearch: (search: string) => void;
  setType: (type: 'all' | 'income' | 'expense') => void;
  setCategoryId: (categoryId: string | null) => void;
  setDatePreset: (datePreset: DatePreset) => void;
  setCustomRange: (customStart: string | null, customEnd: string | null) => void;
  resetFilters: () => void;
}

export const useTxFiltersStore = create<UiState>((set) => ({
  filters: defaultFilters,
  setSearch: (search) =>
    set((s) => ({ filters: { ...s.filters, search } })),
  setType: (type) =>
    set((s) => ({ filters: { ...s.filters, type } })),
  setCategoryId: (categoryId) =>
    set((s) => ({ filters: { ...s.filters, categoryId } })),
  setDatePreset: (datePreset) =>
    set((s) => ({
      filters: { ...s.filters, datePreset, customStart: null, customEnd: null },
    })),
  setCustomRange: (customStart, customEnd) =>
    set((s) => ({
      filters: {
        ...s.filters,
        datePreset: 'custom',
        customStart,
        customEnd,
      },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));

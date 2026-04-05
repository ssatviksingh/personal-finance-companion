import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Theme as NavTheme } from '@react-navigation/native';
import { darkColors, lightColors, type ColorScheme } from '../theme/colors';

type Mode = 'light' | 'dark' | 'system';

interface ThemeCtx {
  colors: ColorScheme;
  mode: Mode;
  setMode: (m: Mode) => void;
  resolved: 'light' | 'dark';
  navigationTheme: NavTheme;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<Mode>('system');

  const resolved = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const colors = resolved === 'dark' ? darkColors : lightColors;

  const navigationTheme = useMemo(() => {
    const base = resolved === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    };
  }, [resolved, colors]);

  const value = useMemo(
    () => ({ colors, mode, setMode, resolved, navigationTheme }),
    [colors, mode, resolved, navigationTheme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppTheme outside ThemeProvider');
  return v;
}

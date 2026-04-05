import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getShadow } from '../theme/shadows';
import { radius, spacing } from '../theme/spacing';
import { type as typeStyles } from '../theme/typography';
import { useAppTheme } from './ThemeContext';

const Ctx = createContext<{ toast: (message: string) => void } | null>(null);

/**
 * Unobtrusive confirmation messages (preferred over blocking alerts for happy paths).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback(
    (msg: string) => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      setMessage(msg);
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      clearTimer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setMessage(null);
        });
      }, 2200);
    },
    [opacity]
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.anchor,
            {
              bottom: insets.bottom + 72,
              opacity,
            },
          ]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.borderSubtle,
              },
              getShadow(colors.shadow, 'md'),
            ]}
          >
            <Text style={[typeStyles.bodyStrong, { color: colors.text, textAlign: 'center' }]}>
              {message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export function useToast(): { toast: (message: string) => void } {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast must be used within ToastProvider');
  return v;
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: spacing.xxl,
    right: spacing.xxl,
    alignItems: 'center',
  },
  bubble: {
    maxWidth: 400,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../theme/spacing';
import { type as typeStyles } from '../theme/typography';

const LOGO = require('../../assets/brand-logo.png');

/**
 * Shown briefly after the native splash while the app finishes loading.
 * Matches native splash colors for a smooth handoff.
 */
export function BrandedSplash({ message = 'Securing your data…' }: { message?: string }) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, scale]);

  return (
    <LinearGradient
      colors={['#0F2744', '#1B4B73']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.root, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <View style={styles.logoWrap}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="Finance Companion logo" />
        </View>
        <Text style={[typeStyles.title2, styles.title]}>Finance Companion</Text>
        <Text style={[typeStyles.caption, styles.sub]}>Your money, organized privately on this device</Text>
      </Animated.View>
      <Text style={[typeStyles.caption, styles.status]}>{message}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  logoWrap: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logo: {
    width: 112,
    height: 112,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
    maxWidth: 280,
    alignSelf: 'center',
  },
  status: {
    position: 'absolute',
    bottom: spacing.xxxl,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
});

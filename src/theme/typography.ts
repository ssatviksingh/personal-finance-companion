import { Platform, TextStyle } from 'react-native';

const ios = Platform.OS === 'ios';

export const font = {
  regular: ios ? 'System' : 'sans-serif',
  medium: ios ? 'System' : 'sans-serif-medium',
  semibold: ios ? 'System' : 'sans-serif-medium',
  bold: ios ? 'System' : 'sans-serif',
};

export const type: Record<string, TextStyle> = {
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  title3: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  title2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  title1: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroNumber: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
};

import { Platform, ViewStyle } from 'react-native';

type Elevation = 'none' | 'sm' | 'md' | 'lg';

export function getShadow(color: string, elevation: Elevation): ViewStyle {
  if (elevation === 'none') return {};

  const presets = {
    sm: { offsetY: 2, opacity: 0.06, radius: 8, android: 2 },
    md: { offsetY: 4, opacity: 0.08, radius: 14, android: 4 },
    lg: { offsetY: 10, opacity: 0.12, radius: 24, android: 8 },
  };
  const p = presets[elevation];

  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: p.offsetY },
      shadowOpacity: p.opacity,
      shadowRadius: p.radius,
    };
  }

  return { elevation: p.android };
}

export const Colors = {
  primary: '#1B3A6B',
  primaryLight: '#2D5AA0',
  primaryMuted: '#EEF2FF',
  background: '#FFFFFF',
  surface: '#F7F8FA',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  success: '#22C55E',
  successLight: '#DCFCE7',
  successDark: '#16A34A',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#B45309',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoDark: '#1D4ED8',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  purpleDark: '#6D28D9',
  error: '#EF4444',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

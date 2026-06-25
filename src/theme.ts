// Design tokens — Cal AI inspired: clean white canvas, near-black ink, rounded
// type, soft-shadow cards, and small tinted color pills as the only accents.

export const colors = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F4F5', // light gray fills (steppers, chips, badges)
  surfaceSunken: '#FAFAFA',
  border: '#ECECEE',
  borderStrong: '#E3E3E6',

  text: '#0A0A0A',
  textDim: '#8E8E93',
  textFaint: '#BFBFC4',

  black: '#0A0A0A',
  white: '#FFFFFF',

  // Cal AI style color highlights — used sparingly, always as tinted pills.
  green: '#34C759',
  greenTint: '#E7F9EE',
  orange: '#FF9500',
  orangeTint: '#FFF3E2',
  blue: '#0A84FF',
  blueTint: '#E8F1FF',
  red: '#FF3B30',
  redTint: '#FFECEB',

  // legacy alias so any stragglers resolve to the primary ink color
  accent: '#0A0A0A',
};

// Rounded geometric family (Nunito) — the heart of the modern, friendly look.
export const fonts = {
  regular: 'Nunito_500Medium',
  semibold: 'Nunito_700Bold',
  bold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  pill: 999,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const font = {
  display: 34,
  title: 24,
  h2: 19,
  body: 16,
  small: 13,
  tiny: 11,
};

// Soft, diffuse card shadow (iOS) + elevation (Android).
export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;
